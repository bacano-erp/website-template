import type { Product, ProductVariant } from "@bacano/sdk";

/** Variant that owns the price advertised on product lists and cards. */
export function getDisplayVariant(product: Product): ProductVariant | null {
  return (
    product.variants
      .filter((variant) => typeof variant.pricing.currentPrice === "number")
      .toSorted(
        (a, b) =>
          (a.pricing.currentPrice ?? 0) - (b.pricing.currentPrice ?? 0) ||
          a.order - b.order ||
          a.id.localeCompare(b.id),
      )[0] ?? null
  );
}
