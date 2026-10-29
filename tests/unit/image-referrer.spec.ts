import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Every image tag sends no Referer.
 *
 * Bacano storage refuses requests whose Referer it does not trust — localhost,
 * a preview host — and answers with an error the browser then blocks, so the
 * image silently never appears. It works in production and fails everywhere a
 * store is built and reviewed, which is how it kept coming back.
 */

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

test("each <Image> and <img> declares referrerPolicy", () => {
  const missing: string[] = [];

  for (const file of sourceFiles(resolve("src"))) {
    const source = readFileSync(file, "utf8");
    for (const tag of source.matchAll(/<(?:Image|img)\b[^>]*?\/?>/gs)) {
      if (!tag[0].includes("referrerPolicy")) {
        const line = source.slice(0, tag.index).split("\n").length;
        missing.push(`${relative(process.cwd(), file)}:${line}`);
      }
    }
  }

  expect(
    missing,
    `add referrerPolicy="no-referrer" at ${missing.join(", ")}`,
  ).toEqual([]);
});
