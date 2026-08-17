#!/usr/bin/env node
/**
 * Builds the storefront against a fake API, serves the export, runs the tests.
 *
 * The tests have to assert on the artifact that actually ships — the HTML in
 * `out/`, not a dev server — because everything this template gets wrong lives
 * in the gap between them: a page that renders in `next dev` and 404s on S3, a
 * price that only appears after hydration, a private page that reaches the
 * sitemap.
 *
 * The API is a fixture rather than the real gateway so CI needs no
 * credentials, no network and no store. That is also why the fixtures are
 * recorded from a real response shape: a handwritten mock would drift from the
 * gateway and the tests would pass against a fiction.
 */
import { spawn } from "node:child_process";
import { createReadStream, existsSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";

// Not 4190: that is `managesieve`, which the fetch spec lists as a blocked
// port, so Node refuses to connect to it while curl happily does. The build
// talks to this through fetch.
const API_PORT = 4191;
const SITE_PORT = 4173;
const SITE_URL = `http://localhost:${SITE_PORT}`;
const OUT_DIR = resolve("out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

/**
 * Serves `out/` the way a static host does — including the part that matters:
 * an unknown path is a 404 with the 404 page's body, not a rewrite to
 * index.html. A dev server that rewrites would hide exactly the bug this
 * template shipped before (`trailingSlash` and directory indexes).
 */
const site = createServer((req, res) => {
  const url = new URL(req.url ?? "/", SITE_URL);
  const candidates = [
    join(OUT_DIR, url.pathname),
    join(OUT_DIR, url.pathname, "index.html"),
    join(OUT_DIR, `${url.pathname}.html`),
  ];

  const file = candidates.find((c) => existsSync(c) && extname(c) !== "");

  if (!file) {
    const notFound = join(OUT_DIR, "404.html");
    res.writeHead(404, { "content-type": MIME[".html"] });
    res.end(existsSync(notFound) ? readFileSync(notFound) : "Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": MIME[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
});

/**
 * Starts the mock and waits for it to say it is serving the right catalogue.
 *
 * A handshake on the child's own output rather than a poll of the port. Both
 * phases use one port, so a leftover server answers exactly like a fresh one —
 * and polling cannot tell them apart: the probe succeeds a moment before the
 * real child dies of `EADDRINUSE`, and the phase then builds the previous
 * catalogue and passes. Only the process we started can print this line.
 */
function startMock(fixtures) {
  const child = spawn("node", ["scripts/mock-api.mjs"], {
    stdio: ["ignore", "ignore", "pipe"],
    env: {
      ...process.env,
      MOCK_API_PORT: String(API_PORT),
      MOCK_API_FIXTURES: fixtures,
    },
  });

  const ready = new Promise((resolve, reject) => {
    let buffered = "";

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      buffered += chunk;
      if (buffered.includes(`serving ${fixtures}`)) resolve();
    });

    child.once("exit", (code) =>
      reject(
        new Error(
          `mock API exited with ${code} before serving ${fixtures} — ` +
            `usually the port is still held by the previous phase`,
        ),
      ),
    );

    setTimeout(
      () => reject(new Error(`mock API never served ${fixtures}`)),
      15_000,
    ).unref();
  });

  return { child, ready };
}

/** Stops a child and waits for it to actually go, so the port is free. */
function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }
  return new Promise((done) => {
    child.once("exit", done);
    child.kill();
  });
}

function run(command, args, env) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) =>
      code === 0
        ? resolveRun()
        : rejectRun(new Error(`${command} exited ${code}`)),
    );
  });
}

/**
 * One build, one set of specs, against one catalogue.
 *
 * Run twice: a store with products, and a store with none. The empty case is
 * not an edge case — it is every store on its first day, and the state that has
 * broken this template twice.
 */
async function phase({ fixtures, specs, buildId }) {
  console.error(`\n=== ${fixtures} ===`);

  // Belt and braces with the per-phase build id: whatever the cache decides,
  // a phase must never inherit the previous phase's catalogue.
  rmSync(resolve(".next/cache/bacano-static-catalog.json"), { force: true });

  const { child: mockApi, ready } = startMock(fixtures);

  try {
    await ready;

    await run("pnpm", ["exec", "next", "build"], {
      NEXT_PUBLIC_BACANO_API_URL: `http://localhost:${API_PORT}`,
      NEXT_PUBLIC_BACANO_WEBSITE_SLUG: "tienda-de-ejemplo",
      NEXT_PUBLIC_SITE_URL: SITE_URL,
      NEXT_PUBLIC_SITE_NAME: "Tienda de ejemplo",
      // Empty on purpose: most stores are provisioned without buyer accounts,
      // and that is the configuration most likely to break.
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      // Distinct per phase, so the second build cannot serve the first one's
      // catalogue out of `.next/cache`.
      BACANO_BUILD_ID: buildId,
    });

    await run("pnpm", ["exec", "playwright", "test", ...specs], {
      PLAYWRIGHT_BASE_URL: SITE_URL,
    });
  } finally {
    // Awaited: the next phase binds this same port, and a lingering server
    // would answer for it.
    await stop(mockApi);
  }
}

async function main() {
  // Awaited: Playwright must not start against a socket that is not listening.
  await new Promise((ready) => site.listen(SITE_PORT, ready));

  try {
    await phase({
      fixtures: "tests/fixtures/api.json",
      specs: [
        "tests/unit",
        "tests/e2e/static-storefront.spec.ts",
        "tests/e2e/payment-adverse.spec.ts",
      ],
      buildId: `test-catalogue-${Date.now()}`,
    });

    await phase({
      fixtures: "tests/fixtures/api-empty.json",
      specs: ["tests/e2e/empty-catalogue.spec.ts"],
      buildId: `test-empty-${Date.now()}`,
    });
  } finally {
    site.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
