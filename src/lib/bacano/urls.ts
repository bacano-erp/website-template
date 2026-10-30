import type { Product } from "@bacano/sdk";

/**
 * A product's page. Only `/producto/<slug>/` is generated (see
 * `app/producto/[slug]`), with the trailing slash S3 needs; a product without a
 * slug has no page of its own, so it links to the catalogue rather than a 404.
 */
export function getProductUrl(
  product: Pick<Product, "id"> & Partial<Pick<Product, "slug">>,
) {
  if (product.slug) {
    return `/producto/${encodeURIComponent(product.slug)}/`;
  }

  return "/catalogo/";
}

export function getProductVariantUrl(
  product: Pick<Product, "id"> & Partial<Pick<Product, "slug">>,
  variantId: string,
) {
  const params = new URLSearchParams({ variant: variantId });
  const productUrl = getProductUrl(product);
  const separator = productUrl.includes("?") ? "&" : "?";

  return `${productUrl}${separator}${params.toString()}`;
}
