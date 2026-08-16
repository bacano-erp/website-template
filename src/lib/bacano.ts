import { type BacanoClient, createBacanoClient } from "@bacano/sdk";

/**
 * Build-time Bacano client.
 *
 * This runs during `next build` only — never in the browser and never at
 * request time, because the site is a static export. Use it from Server
 * Components and `generateStaticParams` to bake catalog content, copy and
 * display prices into the HTML for SEO.
 *
 * Do NOT use it for stock, cart or checkout. Those must be read live in the
 * browser (see `useAvailability` / `useCart`), or a shopper would be looking at
 * whatever was true when the site was last published.
 */
let client: BacanoClient | null = null;

export async function getBuildClient(): Promise<BacanoClient> {
  if (client) return client;

  const apiUrl = process.env.NEXT_PUBLIC_BACANO_API_URL;
  const websiteSlug = process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG;

  if (!apiUrl || !websiteSlug) {
    // Failing loudly beats emitting an empty catalog: a silent miss here would
    // publish a site with no products and still report a green deploy.
    throw new Error(
      "Missing NEXT_PUBLIC_BACANO_API_URL or NEXT_PUBLIC_BACANO_WEBSITE_SLUG. " +
        "Copy .env.example to .env.local for local development; in CI these come " +
        "from repository variables set by Bacano when the site was provisioned.",
    );
  }

  const c = createBacanoClient({ apiUrl, websiteSlug, tokenStorage: "memory" });
  await c.init();
  client = c;
  return c;
}

let browserClient: Promise<BacanoClient> | null = null;

/**
 * Runtime client for work that happens outside React's data flow.
 *
 * `useBacano()` is the normal way to reach the SDK from a component, and it is
 * what the cart and stock islands use. It cannot be used here: under
 * `output: export` every page is prerendered at build time, and the hook throws
 * `NotInitializedError` when it runs on the server — which is what a payment
 * return page does before it ever reaches a browser.
 *
 * So this creates and initialises a client on first use, in the browser only,
 * and hands back the same promise afterwards. Call it inside an effect or an
 * event handler, never during render.
 */
export async function getBrowserClient(): Promise<BacanoClient> {
  if (browserClient) return browserClient;

  const apiUrl = process.env.NEXT_PUBLIC_BACANO_API_URL;
  const websiteSlug = process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG;

  if (!apiUrl || !websiteSlug) {
    throw new Error(
      "Missing NEXT_PUBLIC_BACANO_API_URL or NEXT_PUBLIC_BACANO_WEBSITE_SLUG.",
    );
  }

  const c = createBacanoClient({ apiUrl, websiteSlug, tokenStorage: "memory" });

  browserClient = c
    .init()
    .then(() => c)
    .catch((error) => {
      // Do not cache a failed init: a shopper who reloads after a network blip
      // would otherwise keep the broken client for the life of the tab.
      browserClient = null;
      throw error;
    });

  return browserClient;
}

/** Formats a price for display. Adjust locale/currency for the market. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
