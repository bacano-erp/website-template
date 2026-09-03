/**
 * The one table of previewable routes.
 *
 * `isPreviewableRoute` and the toolbar's suggestions both derive from this, so
 * a route cannot be previewable in one and absent from the other. The reference
 * storefront keeps two lists and they drifted.
 */

/** Routes with a fixed path. A product page is matched separately. */
export const PREVIEW_STATIC_ROUTES = ["/", "/catalogo"] as const;

/** `/producto/<slug>` — one segment, and the slug must be non-empty. */
const PRODUCT_ROUTE = /^\/producto\/[^/]+$/;

export function isPreviewablePath(route: string): boolean {
  if ((PREVIEW_STATIC_ROUTES as readonly string[]).includes(route)) return true;
  return PRODUCT_ROUTE.test(route);
}

/**
 * What the toolbar offers. The product entry is filled in by the caller from
 * real catalogue data — a hardcoded slug would 404 on every store but one.
 */
export function suggestedPreviewRoutes(productSlug?: string): string[] {
  const routes: string[] = [...PREVIEW_STATIC_ROUTES];
  if (productSlug) routes.push(`/producto/${productSlug}`);
  return routes;
}
