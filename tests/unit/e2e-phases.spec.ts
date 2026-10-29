import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Every end-to-end spec has to run in some build phase.
 *
 * `scripts/test-static.mjs` names its specs per phase, because each phase builds
 * against a different catalogue. A spec added to `tests/e2e/` without being
 * named there never runs, and nothing says so: the suite stays green while the
 * new check does not exist.
 */
test("each e2e spec is named by a phase of test-static.mjs", () => {
  const runner = readFileSync(resolve("scripts/test-static.mjs"), "utf8");
  const specs = readdirSync(resolve("tests/e2e")).filter((name) =>
    name.endsWith(".spec.ts"),
  );

  expect(specs.length).toBeGreaterThan(0);
  const unnamed = specs.filter((name) => !runner.includes(`tests/e2e/${name}`));
  expect(
    unnamed,
    `${unnamed.join(", ")} never run — add them to a phase in scripts/test-static.mjs`,
  ).toEqual([]);
});
