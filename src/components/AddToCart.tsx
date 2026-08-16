"use client";

import { useAvailability, useCart } from "@bacano/sdk/react";
import { useState } from "react";

/**
 * The live island on an otherwise static page.
 *
 * Stock and the cart are deliberately NOT baked at build time: a published page
 * can be hours or days old, and selling something that is out of stock is worse
 * than a brief loading state. Both are read from the Bacano API in the browser,
 * on every view.
 */
export function AddToCart({ productVariantId }: { productVariantId: string }) {
  const { data: availability, loading: checkingStock } = useAvailability([
    productVariantId,
  ]);
  const { cart, addItem, getOrCreate } = useCart();

  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stock = availability?.[0];
  const inStock = stock?.inStock ?? false;

  async function handleAdd() {
    setPending(true);
    setError(null);
    try {
      // A cart has to exist before anything can go in it. `addItem` writes
      // against a session — an order id and a cart token — and throws
      // "Start checkout with contact before syncing cart items to Bacano"
      // when there is none, which is what every first click used to do.
      //
      // `getOrCreate()` with no arguments makes an anonymous one; contact
      // details are collected later, by the store's own checkout, through
      // `startCheckout`. Guarded on `cart` rather than called every time
      // because it is a round trip, though it is safe to repeat: it sends the
      // existing token and gets the same cart back.
      if (!cart) {
        await getOrCreate();
      }

      await addItem(productVariantId, 1);
      setAdded(true);
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
        className="h-11 w-full animate-pulse rounded bg-neutral-100"
      >
        <span className="sr-only">Consultando disponibilidad</span>
      </div>
    );
  }

  if (!inStock) {
    return (
      <p className="rounded bg-neutral-100 px-4 py-3 text-neutral-600 text-sm">
        {stock?.label ?? "Agotado"}
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={pending || added}
        className="h-11 w-full rounded bg-neutral-900 px-4 font-medium text-sm text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Agregando…" : added ? "Agregado ✓" : "Agregar al carrito"}
      </button>
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
    </div>
  );
}
