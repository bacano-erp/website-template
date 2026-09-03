import type { Product } from "@bacano/sdk";

/**
 * Rules about *what* a page shows, kept out of both the route and the view.
 *
 * These exist because the same page is rendered from two data sources — the
 * build snapshot for the published site, a live read for preview — and a rule
 * duplicated across the two would drift silently. Nothing would crash; preview
 * would simply show a different number of products than the real page, and both
 * would look correct.
 */

/** Products in the home page's "Destacados" row. */
export const HOME_FEATURED_COUNT = 8;

export function homeFeatured(products: Product[]): Product[] {
  return products.slice(0, HOME_FEATURED_COUNT);
}
