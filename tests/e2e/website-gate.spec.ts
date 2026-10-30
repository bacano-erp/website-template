import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * The "site under construction" gate (BacanoWebsiteGate).
 *
 * Bacano turns it on per website; the storefront only mounts it. What can go
 * wrong here is all on the storefront's side: mounting it inside Clerk so the
 * screen loads the auth it was meant to keep out, or losing the catalogue from
 * the exported HTML so crawlers see an empty page while the gate checks.
 */

const PUBLIC_CONFIG = "GET /api/v1/website/public-config";
const recorded = JSON.parse(
  readFileSync(resolve("tests/fixtures/api.json"), "utf8"),
)[PUBLIC_CONFIG];

/** The recorded configuration with construction switched on, as Bacano sends it. */
async function serveConstruction(page: Page) {
  await page.route("**/api/v1/website/public-config**", (route) =>
    route.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        ...recorded,
        construction: {
          ...recorded.construction,
          enabled: true,
          enforced: true,
        },
      }),
    }),
  );
}

test("with construction off, the store mounts", async ({ page }) => {
  await page.goto("/catalogo/");
  await expect(page.getByText("Producto de ejemplo").first()).toBeVisible();
  await expect(page.getByText("Sitio en construcción")).toHaveCount(0);
});

test("with construction on, the screen replaces the store and asks not to be indexed", async ({
  page,
}) => {
  await serveConstruction(page);
  await page.goto("/catalogo/");

  await expect(page.getByText("Sitio en construcción").first()).toBeVisible();
  await expect(page.getByText("Producto de ejemplo")).toHaveCount(0);
  await expect(
    page.locator('meta[name="robots"][data-bacano-construction="true"]'),
  ).toHaveAttribute("content", "noindex,nofollow");
});

test("the exported HTML keeps the catalogue while the gate checks", () => {
  // Crawlers that run no JavaScript must still see the store: the gate keeps
  // its children in a <noscript> until the live configuration answers.
  const source = readFileSync(resolve("out/catalogo/index.html"), "utf8");
  expect(source).toContain('data-bacano-static-storefront="true"');
  expect(source).toMatch(/Producto de ejemplo/);
});
