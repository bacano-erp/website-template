import { expect, test } from "@playwright/test";

/**
 * The payment pages when nothing goes to plan.
 *
 * This is the money path, and every branch here runs *after* a shopper may
 * already have been charged. The failure that matters is not an error message —
 * it is a page that spins forever, or one that throws and leaves a blank
 * screen, because the shopper then has no idea whether they paid and no way to
 * find their order.
 *
 * The mock API has no fixtures for order operations, so every call below fails
 * the way an unreachable or unhappy gateway would.
 */

const ORDER = "00000000-0000-4000-8000-000000000010";
const TOKEN = "a-token-the-api-will-not-accept";

/** Fails the test on an uncaught error rather than letting it pass silently. */
async function withoutPageErrors(
  page: import("@playwright/test").Page,
  body: () => Promise<void>,
) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await body();
  expect(errors).toEqual([]);
}

test("a payment return the API will not confirm still reaches a verdict", async ({
  page,
}) => {
  await withoutPageErrors(page, async () => {
    await page.goto(`/pago/respuesta/?orderId=${ORDER}&token=${TOKEN}`);

    // "Pending", never "failed": the API not answering says nothing about
    // whether the card was charged.
    await expect(page.getByText(/en revisión/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/confirmando tu pago/i)).toBeHidden();
  });
});

test("the return page offers a way onward even when the lookup fails", async ({
  page,
}) => {
  await page.goto(`/pago/respuesta/?orderId=${ORDER}&token=${TOKEN}`);
  await expect(
    page.getByRole("link", { name: /ver mi pedido/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /seguir comprando/i }),
  ).toBeVisible();
});

test("gateway parameters under their alternative names are understood", async ({
  page,
}) => {
  // Providers disagree about these names. Read as `reference` +
  // `public_order_token`, this must behave like the canonical spelling rather
  // than claiming the reference is missing.
  await withoutPageErrors(page, async () => {
    await page.goto(
      `/pago/respuesta/?reference=${ORDER}&public_order_token=${TOKEN}`,
    );
    await expect(page.getByText(/no encontramos la referencia/i)).toBeHidden();
    await expect(page.getByText(/en revisión/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});

test("an order page whose token the API rejects says so", async ({ page }) => {
  await withoutPageErrors(page, async () => {
    await page.goto(`/pedido/?orderId=${ORDER}&token=${TOKEN}`);
    await expect(page.getByText(/no encontramos el pedido/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});

test("both pages survive storage being unavailable", async ({ page }) => {
  // Safari in private mode throws on `localStorage` access rather than
  // returning null. The order is already placed by then, so losing the local
  // copy is acceptable; throwing on the page is not.
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("localStorage is disabled");
      },
    });
  });

  await withoutPageErrors(page, async () => {
    await page.goto(`/pago/respuesta/?orderId=${ORDER}&token=${TOKEN}`);
    await expect(page.getByText(/en revisión/i)).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`/pedido/?orderId=${ORDER}&token=${TOKEN}`);
    await expect(page.getByText(/no encontramos el pedido/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});

test("a payment return reaches a verdict even when the API is unreachable", async ({
  page,
}) => {
  // Not a 500 — nothing answers at all, which is what a shopper meets when the
  // gateway sends them back during an outage, or when a store was built with the
  // wrong API URL. Reaching the client can fail before any order call runs, and
  // an unhandled rejection there left this page on "no cierres esta ventana"
  // indefinitely.
  await page.route("**/api/v1/website/**", (route) => route.abort());

  await withoutPageErrors(page, async () => {
    await page.goto(`/pago/respuesta/?orderId=${ORDER}&token=${TOKEN}`);

    await expect(page.getByText(/en revisión/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/confirmando tu pago/i)).toBeHidden();

    // And the way onward survives too, because the reference came from the URL.
    await expect(
      page.getByRole("link", { name: /ver mi pedido/i }),
    ).toBeVisible();
  });
});
