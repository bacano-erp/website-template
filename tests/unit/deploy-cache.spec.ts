import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * A publish must never replay the previous build's API responses.
 *
 * `.next/cache` holds two things that are answers from the Bacano API rather
 * than products of the source: Next's fetch cache, and this template's
 * catalogue snapshot. A GitHub Actions cache key can only hash what is in the
 * repository — and a publish is triggered precisely when something *outside*
 * the repository changed. So caching the whole directory restores a warm copy
 * on every publish and rebuilds the site from stale data, which looks exactly
 * like "publishing does nothing".
 *
 * This happened to a production storefront: it kept serving content its API no
 * longer returned, and the build regenerated eleven pages in under 300ms
 * because it never called the gateway at all.
 *
 * The compiler cache is safe and is the part worth keeping, so the fix is the
 * narrow path — enforced here because the failure is silent and the workflow is
 * not something anyone reads twice.
 */
const workflow = readFileSync(resolve(".github/workflows/deploy.yml"), "utf8");

/** Every `path:` given to actions/cache in the deploy workflow. */
function cachedPaths(): string[] {
  const paths: string[] = [];
  const lines = workflow.split("\n");

  for (const [index, line] of lines.entries()) {
    if (!/uses:\s*actions\/cache/.test(line)) continue;
    // The `with:` block follows; read its `path:` entries until it ends.
    for (const next of lines.slice(index + 1, index + 12)) {
      const match = next.match(/^\s*path:\s*(\S+)\s*$/);
      if (match) paths.push(match[1]);
      if (/^\s*-\s*name:/.test(next)) break;
    }
  }

  return paths;
}

test("the deploy workflow caches something", () => {
  // Guards the guard: a workflow that stopped using actions/cache would make
  // every assertion below trivially true.
  expect(cachedPaths().length).toBeGreaterThan(0);
});

test("no cached path can replay a gateway response", () => {
  for (const path of cachedPaths()) {
    expect(path).not.toBe(".next/cache");
    expect(path).not.toBe(".next/cache/");
    // Both live directly under .next/cache; nothing may restore them.
    expect(path).not.toContain("fetch-cache");
    expect(path).not.toContain("bacano-static-catalog");
  }
});

test("the compiler cache is still restored", () => {
  // Build time is the whole cost of publishing, so losing this would be a
  // regression of its own.
  expect(cachedPaths()).toContain(".next/cache/webpack");
});
