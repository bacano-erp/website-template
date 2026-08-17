import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * A store on the day it is provisioned.
 *
 * Every store starts here, and this template has broken here twice: once
 * because `next build` refuses a dynamic route with no params, and once because
 * the placeholder invented to satisfy it became a real page. Neither was caught
 * by a catalogue that had a product in it.
 */

const OUT = resolve("out");
const html = (path: string) => readFileSync(resolve(OUT, path), "utf8");

test("the site builds and serves its home page", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
});

test("the catalogue says so rather than failing", async ({ page }) => {
  await page.goto("/catalogo/");
  await expect(page.getByText(/no hay productos/i)).toBeVisible();
});

test("the placeholder route renders as not-found and is never indexed", async ({
  page,
}) => {
  // `generateStaticParams` emits one placeholder because Next refuses a dynamic
  // route with no params under `output: export` — verified: removing it fails
  // the build with "is missing generateStaticParams()".
  //
  // So the file exists, and a static host therefore answers 200: nothing in the
  // export can make S3 return a status for a key that is present. What can be
  // guaranteed is that it says nothing about a product and asks crawlers to
  // ignore it, which is what this checks.
  await page.goto("/producto/sin-productos/");
  expect(html("producto/sin-productos/index.html")).toMatch(/noindex/);
});

test("the sitemap advertises no products at all", () => {
  const sitemap = html("sitemap.xml");
  expect(sitemap).not.toContain("/producto/");
  // The two real pages are still listed.
  expect(sitemap).toContain("/catalogo/");
});

test("the placeholder is the only thing under producto/", () => {
  // A real product page here would mean the empty catalogue was not empty.
  const entries = readdirSync(resolve(OUT, "producto"));
  expect(entries).toEqual(["sin-productos"]);
});
