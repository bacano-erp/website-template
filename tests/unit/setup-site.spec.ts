import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import {
  MARKED_FILES,
  STORE_PATHS,
  stripStoreBlocks,
} from "../../scripts/setup-site.mjs";

/**
 * `pnpm setup:site --tipo=sitio` must leave a site that builds.
 *
 * The script deletes the store's folders and strips `<commerce>` blocks from
 * the shared files. Both lists are maintained by hand, so the failure to guard
 * against is the next store feature wired into a shared file without a marker:
 * the script would delete the module and leave an import pointing at nothing.
 */

const ROOT = resolve(".");
const isStorePath = (path: string) =>
  STORE_PATHS.some((store) => path === store || path.startsWith(`${store}/`));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|mjs|css)$/.test(path) ? [path] : [];
  });
}

/** What the store paths are imported as from the files that stay. */
const STORE_IMPORTS =
  /@\/features\/commerce|@\/features\/legal|@\/components\/form|@\/components\/AddToCart|commerce\.css|react-phone-number-input|from "zod"/;

test("removes a marked block, markers included, and keeps the rest", () => {
  const text = [
    "keep 1",
    "// <commerce>",
    "store only",
    "// </commerce>",
    "keep 2",
  ].join("\n");
  expect(stripStoreBlocks(text)).toBe("keep 1\nkeep 2");
});

test("refuses unbalanced markers instead of guessing", () => {
  expect(() => stripStoreBlocks("// <commerce>\nx")).toThrow(/never closed/);
  expect(() => stripStoreBlocks("x\n// </commerce>")).toThrow(/without/);
});

test("every listed path exists, so a rename cannot be skipped silently", () => {
  const missing = [...STORE_PATHS, ...MARKED_FILES].filter(
    (path) => !existsSync(resolve(path)),
  );
  expect(missing).toEqual([]);
});

test("after the store is removed, nothing left imports it", () => {
  const dangling: string[] = [];

  for (const dir of ["src", "tests", "scripts"]) {
    for (const file of sourceFiles(resolve(dir))) {
      const path = relative(ROOT, file);
      // The script and this test name the store's paths on purpose.
      const describesTheStore =
        path === "scripts/setup-site.mjs" ||
        path === "tests/unit/setup-site.spec.ts";
      if (isStorePath(path) || describesTheStore) {
        continue;
      }

      const source = readFileSync(file, "utf8");
      const kept = MARKED_FILES.includes(path)
        ? stripStoreBlocks(source, path)
        : source;

      if (STORE_IMPORTS.test(kept)) dangling.push(path);
    }
  }

  expect(
    dangling,
    `${dangling.join(", ")} still reference the store after --tipo=sitio — ` +
      "wrap that code in <commerce> markers and list the file in MARKED_FILES",
  ).toEqual([]);
});
