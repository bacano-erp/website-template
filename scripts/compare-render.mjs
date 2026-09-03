#!/usr/bin/env node
/**
 * Compares two `out/` trees and reports whether the rendered HTML is identical.
 *
 * Written for a refactor whose entire safety argument is "the artifact does not
 * change". These three pages — home, catalogue, product — are the ones a shopper
 * buys from, in every store built from this template, and the way they break
 * under a refactor is quiet: a missed prop renders a product with no price, or a
 * catalogue with nothing in it. Both look plausible in a screenshot, and the e2e
 * suite only asserts what someone thought to assert.
 *
 * So the check is the whole artifact, byte for byte.
 *
 * **CI cannot run this**, which is why there is no `check:` script for it: it
 * needs two builds from two different commits. It is a tool for whoever is doing
 * or reviewing such a change:
 *
 *   git checkout main && <build> && cp -R out /tmp/out-baseline
 *   git checkout <branch> && <build>
 *   node scripts/compare-render.mjs /tmp/out-baseline out
 *
 * Use the same build the e2e harness uses, or the comparison is meaningless —
 * `scripts/test-static.mjs` has the fixture API and the environment it needs.
 *
 * ## The one thing that must be masked
 *
 * Next stamps a per-build deployment id into every page's flight data. It
 * changes on every build regardless of source, so without masking it *every*
 * page reports as changed and the check is useless. It appears both plainly and
 * backslash-escaped inside a JS string literal — missing the escaped spelling is
 * how this script's first version reported all ten pages as different when only
 * that id had moved.
 *
 * Nothing else is masked. Anything else that differs is a real change.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const BUILD_ID = /(\\?")b\\?"\s*:\s*\\?"[A-Za-z0-9_-]{8,}\\?"/g;

function htmlFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith(".html")) found.push(relative(root, path));
    }
  };
  walk(root);
  return found.sort();
}

function digest(path) {
  const normalized = readFileSync(path, "utf8").replace(
    BUILD_ID,
    '"b":"BUILDID"',
  );
  return createHash("sha256").update(normalized).digest("hex");
}

const [baseline, candidate] = process.argv.slice(2).map((p) => p && resolve(p));
if (!baseline || !candidate) {
  console.error(
    "usage: node scripts/compare-render.mjs <baseline-out> <candidate-out>",
  );
  process.exit(2);
}

const before = htmlFiles(baseline);
const after = htmlFiles(candidate);
const problems = [];

for (const file of after) {
  if (!before.includes(file)) {
    problems.push(`ADDED    ${file}`);
    continue;
  }
  if (digest(join(baseline, file)) !== digest(join(candidate, file))) {
    problems.push(`DIFFERS  ${file}`);
  }
}
for (const file of before) {
  // A page that stopped being emitted is the worst outcome here and the easiest
  // to miss, because nothing fails — the URL simply 404s on the live site.
  if (!after.includes(file)) problems.push(`DROPPED  ${file}`);
}

console.log(`compared ${after.length} HTML files against ${before.length}`);
for (const problem of problems) console.log(`  ${problem}`);
console.log(
  problems.length === 0 ? "RESULT: IDENTICAL" : "RESULT: DIFFERENCES",
);
process.exit(problems.length === 0 ? 0 : 1);
