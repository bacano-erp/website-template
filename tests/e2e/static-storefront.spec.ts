import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * What has to be true of the artifact, not of the app in a dev server.
 *
 * Every bug this template has shipped lived in that gap: a build that renders
 * locally and 404s on S3, a price that only exists after hydration, a private
 * page that reached the sitemap. So these read `out/` and the served files.
 */

const OUT = resolve("out");

const html = (path: string) => readFileSync(resolve(OUT, path), "utf8");

test.describe("the export", () => {
  const publicPages = [
    ["/", "index.html"],
    ["/catalogo/", "catalogo/index.html"],
    ["/carrito/", "carrito/index.html"],
    ["/checkout/", "checkout/index.html"],
    [
      "/producto/producto-de-ejemplo/",
      "producto/producto-de-ejemplo/index.html",
    ],
  ] as const;

  for (const [path, file] of publicPages) {
    test(`${path} is served as real HTML`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(html(file)).toContain("<html");
    });
  }

  test("an unknown path is a real 404, not a rewrite", async ({ page }) => {
    const response = await page.goto("/no-existe/");
    expect(response?.status()).toBe(404);
  });
});

test.describe("what crawlers get", () => {
  test("the product page carries its price before any JavaScript runs", () => {
    // The whole point of baking the catalogue. If this only appears after
    // hydration, the store is invisible to anything that does not run JS.
    const source = html("producto/producto-de-ejemplo/index.html");
    expect(source).toMatch(/Producto de ejemplo/);
    expect(source).toMatch(/\$\s?[\d.,]+/);
  });

  test("the catalogue lists products without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/catalogo/");
    await expect(page.getByText("Producto de ejemplo").first()).toBeVisible();
    await context.close();
  });

  test("the product page declares a canonical URL", () => {
    expect(html("producto/producto-de-ejemplo/index.html")).toContain(
      'rel="canonical"',
    );
  });

  test("private pages declare noindex", () => {
    // Both carry an order token in the query string. Indexed, that token ends
    // up in a search result.
    for (const file of ["pedido/index.html", "pago/respuesta/index.html"]) {
      expect(html(file)).toMatch(/noindex/);
    }
  });
});

test.describe("the sitemap", () => {
  const sitemap = () => html("sitemap.xml");

  test("lists the real product pages", () => {
    expect(sitemap()).toContain("/producto/producto-de-ejemplo/");
  });

  test("excludes checkout, cart, order and payment return", () => {
    // A sitemap is a claim that these URLs are worth indexing. Two of them
    // are private, and the others are dead ends for a crawler.
    for (const path of [
      "/checkout/",
      "/carrito/",
      "/pedido",
      "/pago/respuesta",
    ]) {
      expect(sitemap()).not.toContain(path);
    }
  });

  test("never lists the empty-catalogue placeholder", () => {
    // The placeholder exists so a store with no products can build at all. It
    // renders as a 404 and must not be advertised.
    expect(sitemap()).not.toContain("sin-productos");
  });
});

test.describe("the storefront at runtime", () => {
  test("the payment return survives a gateway that sends nothing useful", async ({
    page,
  }) => {
    // A shopper landing here without a reference must be told so, not left on
    // a spinner forever.
    await page.goto("/pago/respuesta/");
    await expect(page.getByText(/no encontramos la referencia/i)).toBeVisible();
  });

  test("the order page asks for a reference rather than hanging", async ({
    page,
  }) => {
    await page.goto("/pedido/");
    await expect(page.getByText(/no encontramos el pedido/i)).toBeVisible();
  });

  test("a store with no Clerk key still renders its cart", async ({ page }) => {
    // Buyer accounts are opt-in and most stores ship without them. This
    // configuration is the one that broke every provisioned store once.
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/carrito/");
    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
