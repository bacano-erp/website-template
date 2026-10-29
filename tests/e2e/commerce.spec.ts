import { expect, type Page, test } from "@playwright/test";

/**
 * The purchase path, from a product page to the checkout.
 *
 * The cart stays in the browser until checkout has a contact, so none of this
 * writes to Bacano: the mock answers the live reads (stock, delivery, payment
 * options) from responses recorded against a real gateway.
 */

const PRODUCT = "/producto/producto-de-ejemplo/";

/** Fails the test on an uncaught error rather than letting it pass silently. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function addToCart(page: Page) {
  await page.goto(PRODUCT);
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
}

test("adding a product opens the cart with it and a way to checkout", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await addToCart(page);

  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("Mi Carrito")).toBeVisible();
  await expect(drawer.getByText("Producto de ejemplo").first()).toBeVisible();
  await expect(
    drawer.getByRole("link", { name: /checkout|pagar|finalizar/i }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("the cart is still there after a reload, and on its own page", async ({
  page,
}) => {
  await addToCart(page);
  await expect(page.getByRole("dialog").getByText("Mi Carrito")).toBeVisible();

  await page.goto("/carrito/");
  await expect(page.getByRole("heading", { name: "Tu carrito" })).toBeVisible();
  await expect(page.getByText("Producto de ejemplo").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir a pagar" })).toBeVisible();
});

test("checkout shows the cart and Bacano's delivery options", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await addToCart(page);
  await page.goto("/checkout/");

  await expect(page.getByText("Producto de ejemplo").first()).toBeVisible();
  // Both options come from the recorded GetDeliveryOptions, not the template.
  await expect(page.getByText("Recoger en tienda").first()).toBeVisible();
  await expect(page.getByText("Envío").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("an empty checkout sends the shopper back to the catalogue", async ({
  page,
}) => {
  await page.goto("/checkout/");
  await expect(
    page.getByRole("link", { name: /cat[aá]logo/i }).first(),
  ).toBeVisible();
});
