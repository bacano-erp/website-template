import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * The documented command has to be the real one.
 *
 * `AGENTS.md` and the README both used to promise that `pnpm verify` was
 * "exactly what CI runs". It stopped being true the moment CI grew a step, and
 * nothing noticed — a contributor following the instruction could push a change
 * that failed a check they were told they had already run.
 *
 * So the claim is enforced here instead of maintained by hand: every pnpm script
 * CI invokes must be reachable from `verify:all`.
 */

const scripts: Record<string, string> = JSON.parse(
  readFileSync(resolve("package.json"), "utf8"),
).scripts;

const workflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");

/** Every `pnpm <script>` the workflow runs, ignoring `pnpm exec` and installs. */
function scriptsRunByCi(): string[] {
  const found = new Set<string>();

  for (const match of workflow.matchAll(/run:\s*pnpm\s+([a-z:]+)/g)) {
    const name = match[1];
    if (name === "install" || name === "exec") continue;
    found.add(name);
  }

  return [...found];
}

/** Which scripts `verify:all` reaches, following `pnpm <script>` references. */
function scriptsReachedBy(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];

  while (queue.length > 0) {
    const name = queue.pop() as string;
    if (seen.has(name)) continue;
    seen.add(name);

    for (const match of (scripts[name] ?? "").matchAll(/pnpm\s+([a-z:]+)/g)) {
      queue.push(match[1]);
    }
  }

  return seen;
}

test("CI runs at least one pnpm script", () => {
  // Guards the test itself: a regex that matches nothing would make the
  // assertion below vacuously true.
  expect(scriptsRunByCi().length).toBeGreaterThan(0);
});

test("everything CI runs is reachable from verify:all", () => {
  const reachable = scriptsReachedBy("verify:all");
  const missing = scriptsRunByCi().filter((name) => !reachable.has(name));

  expect(
    missing,
    `CI runs ${missing.join(", ")}, which \`pnpm verify:all\` does not — ` +
      "either add it to the script or stop telling contributors verify:all is what CI runs",
  ).toEqual([]);
});
