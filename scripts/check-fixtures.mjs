#!/usr/bin/env node
/**
 * Compares the recorded fixtures against the gateway they were recorded from.
 *
 * The test suite builds the storefront against `tests/fixtures/`, which makes it
 * fast, credential-free and reproducible — and means it keeps passing if the
 * real gateway changes shape. A fixture that has drifted is worse than no
 * fixture: the suite reports success about a contract that no longer exists.
 *
 * Shapes only. Values change constantly and prove nothing; a missing key or a
 * changed type is what breaks a build. Nothing is written — this reports, and
 * updating a fixture stays a deliberate act with a human reading the diff.
 *
 * Needs a reachable store, so it is not part of CI:
 *
 *   BACANO_API_URL=… BACANO_WEBSITE_SLUG=… node scripts/check-fixtures.mjs
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

const PORT = Number(process.env.FIXTURE_PROXY_PORT ?? 4192);
const FIXTURES = resolve("tests/fixtures/api.json");

const apiUrl = process.env.BACANO_API_URL || "";
const websiteSlug = process.env.BACANO_WEBSITE_SLUG || "";

if (!apiUrl || !websiteSlug) {
  console.error(
    "Set BACANO_API_URL and BACANO_WEBSITE_SLUG to a reachable store.\n" +
      "No defaults on purpose: this talks to a real gateway, and a default " +
      "would decide which one on your behalf.",
  );
  process.exit(2);
}

/**
 * The shape of a value: keys and types, recursively, with arrays collapsed to
 * their first element. Two responses describing the same contract have the same
 * shape however different their contents.
 */
function shapeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return value.length === 0 ? "[]" : [shapeOf(value[0])];
  }
  if (typeof value === "object") {
    const shape = {};
    for (const key of Object.keys(value).sort())
      shape[key] = shapeOf(value[key]);
    return shape;
  }
  return typeof value;
}

/**
 * Some fields arrive as JSON encoded inside a string — the catalogue does. A
 * string that parses as an object is compared as the object it represents,
 * because that is where drift would actually hurt.
 */
function decode(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalise(value) {
  const decoded = decode(value);
  if (decoded === null || typeof decoded !== "object") return shapeOf(decoded);
  if (Array.isArray(decoded)) {
    return decoded.length === 0 ? "[]" : [normalise(decoded[0])];
  }
  const shape = {};
  for (const key of Object.keys(decoded).sort())
    shape[key] = normalise(decoded[key]);
  return shape;
}

/** Every path where two shapes disagree, described in a way a reader can act on. */
function differences(expected, actual, path = "") {
  const at = path || "(root)";

  if (typeof expected === "string" || typeof actual === "string") {
    return expected === actual
      ? []
      : [
          `${at}: fixture ${JSON.stringify(expected)}, gateway ${JSON.stringify(actual)}`,
        ];
  }

  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      return [
        `${at}: fixture ${Array.isArray(expected) ? "array" : "not array"}, gateway ${Array.isArray(actual) ? "array" : "not array"}`,
      ];
    }
    if (expected.length === 0 || actual.length === 0) return [];
    return differences(expected[0], actual[0], `${at}[]`);
  }

  const found = [];
  const keys = new Set([
    ...Object.keys(expected ?? {}),
    ...Object.keys(actual ?? {}),
  ]);

  for (const key of [...keys].sort()) {
    const where = path ? `${path}.${key}` : key;
    if (!(key in (expected ?? {}))) {
      found.push(`${where}: gateway has it, fixture does not`);
    } else if (!(key in (actual ?? {}))) {
      found.push(
        `${where}: fixture has it, gateway does not — a build reading it would break`,
      );
    } else {
      found.push(...differences(expected[key], actual[key], where));
    }
  }

  return found;
}

const captured = new Map();

const proxy = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;

  const upstream = await fetch(apiUrl.replace(/\/+$/, "") + req.url, {
    method: req.method,
    headers: { "content-type": "application/json" },
    body: body || undefined,
  });
  const text = await upstream.text();

  try {
    const operation = /(?:query|mutation)\s+(\w+)/.exec(
      JSON.parse(body).query ?? "",
    )?.[1];
    if (operation && !captured.has(operation))
      captured.set(operation, JSON.parse(text));
  } catch {
    // Not a GraphQL exchange, or not JSON. Nothing to compare.
  }

  res.writeHead(upstream.status, { "content-type": "application/json" });
  res.end(text);
});

function build() {
  return new Promise((done, fail) => {
    const child = spawn("pnpm", ["exec", "next", "build"], {
      stdio: ["ignore", "ignore", "inherit"],
      env: {
        ...process.env,
        NEXT_PUBLIC_BACANO_API_URL: `http://localhost:${PORT}`,
        NEXT_PUBLIC_BACANO_WEBSITE_SLUG: websiteSlug,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
        NEXT_PUBLIC_SITE_NAME: "Fixture check",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
        BACANO_BUILD_ID: `fixture-check-${Date.now()}`,
      },
    });
    child.on("exit", (code) =>
      code === 0 ? done() : fail(new Error(`next build exited ${code}`)),
    );
  });
}

async function main() {
  await new Promise((ready) => proxy.listen(PORT, ready));

  try {
    console.error(`Building against ${apiUrl} as "${websiteSlug}"…`);
    await build();
  } finally {
    proxy.close();
  }

  const fixtures = JSON.parse(readFileSync(FIXTURES, "utf8"));
  const problems = [];
  let compared = 0;

  for (const [operation, recorded] of Object.entries(fixtures)) {
    const live = captured.get(operation);

    if (!live) {
      problems.push(
        `${operation}: the build never asked for it — the fixture may be obsolete`,
      );
      continue;
    }

    compared += 1;
    for (const difference of differences(
      normalise(recorded),
      normalise(live),
    )) {
      problems.push(`${operation}: ${difference}`);
    }
  }

  for (const operation of captured.keys()) {
    if (!(operation in fixtures)) {
      problems.push(
        `${operation}: the build asks for it and there is no fixture — tests are covering less than the build does`,
      );
    }
  }

  if (problems.length === 0) {
    console.log(
      `Fixtures match the gateway (${compared} operation(s) compared).`,
    );
    return;
  }

  console.error("Fixtures no longer match the gateway:\n");
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error(
    "\nRe-record deliberately, and strip identifiers, names, domains, prices\n" +
      "and timestamps before committing — this repository is public.",
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
