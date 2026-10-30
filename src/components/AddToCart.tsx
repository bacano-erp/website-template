"use client";

import type { Product, ProductVariant } from "@bacano/sdk";
import { useProductLiveState } from "@bacano/sdk/react";
import { useState } from "react";
import { useCart } from "@/features/commerce/cart/CartProvider";
import { getPrimaryImage } from "@/lib/bacano/formatters";
import {
  getPrimaryProductMedia,
  getProductMediaSrcSet,
} from "@/lib/bacano/media";

/**
 * The live island on an otherwise static page.
 *
 * Stock is deliberately NOT baked at build time: a published page can be hours
 * or days old, and selling something that is out of stock is worse than a
 * brief loading state. It is read from the Bacano API in the browser, on every
 * view.
 *
 * The cart itself stays in the browser until checkout has a contact (see
 * CartProvider). Adding a product sends nothing to Bacano, so browsing never
 * leaves empty carts behind in the platform, and the drawer opens right away.
 */
export function AddToCart({
  product,
  variant,
}: {
  product: Product;
  variant: ProductVariant;
}) {
  // Same request LivePrice makes, and the same hook: stock and price come back
  // together, so the page pays for one round trip rather than two.
  const { data: liveState, loading: checkingStock } = useProductLiveState([
    variant.id,
  ]);
  const { addVariant } = useCart();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stock = liveState?.[0];
  const inStock = stock?.inStock ?? false;

  async function handleAdd() {
    setPending(true);
    setError(null);
    try {
      await addVariant(
        {
          productVariantId: variant.id,
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          productImageSrc: getPrimaryImage(product),
          productImageSrcSet: getProductMediaSrcSet(
            getPrimaryProductMedia(product.media),
          ),
          sku: variant.sku,
          pricing: variant.pricing,
          variantAttributes: variant.attributes.map(({ name, value }) => ({
            name,
            value,
          })),
        },
        1,
        stock?.maxPurchasableQuantity,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo agregar al carrito",
      );
    } finally {
      setPending(false);
    }
  }

  if (checkingStock) {
    return (
      // role="status" so the wait is announced; a bare div with aria-label is
      // silent to screen readers.
      <div
        role="status"
        aria-live="polite"
        className="h-11 w-full animate-pulse rounded-full bg-default"
      >
        <span className="sr-only">Consultando disponibilidad</span>
      </div>
    );
  }

  if (!inStock) {
    return (
      <p className="rounded-md bg-default px-4 py-3 text-muted text-sm">
        {stock?.availabilityLabel ?? "Agotado"}
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={pending}
        className="btn btn-cart w-full"
      >
        {pending ? "Agregando…" : "Agregar al carrito"}
      </button>
      {error && <p className="mt-2 text-danger text-sm">{error}</p>}
    </div>
  );
}
