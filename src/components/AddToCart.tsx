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
  const { addItem } = useCart();

  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stock = availability?.[0];
  const inStock = stock?.inStock ?? false;

  async function handleAdd() {
    setPending(true);
    setError(null);
    try {
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
