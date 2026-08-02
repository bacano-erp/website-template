import { createBacanoClient, type BacanoClient } from "@bacano/sdk";

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

/** Formats a price for display. Adjust locale/currency for the market. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
