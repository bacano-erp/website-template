"use client";

import { resolveProductPricing } from "@bacano/sdk";
import { useCart } from "@bacano/sdk/react";
import Link from "next/link";
import { formatPrice } from "@/lib/bacano";

/**
 * Entirely client-rendered. The cart belongs to the shopper, not to the build:
 * nothing here can be pre-rendered, and it must never be cached at the edge.
 */
export default function CartPage() {
  const { cart, loading, removeItem, updateItem } = useCart();

  if (loading) {
    return <p className="text-neutral-600">Cargando carrito…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="font-semibold text-2xl">Tu carrito</h1>
        <p className="mt-4 text-neutral-600">Tu carrito está vacío.</p>
        <Link
          href="/catalogo/"
          className="mt-6 inline-block rounded bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-semibold text-2xl">Tu carrito</h1>

      <ul className="divide-y divide-neutral-200">
        {cart.items.map((item) => {
          const name = item.productVariant.product.name;
          const unitPrice = resolveProductPricing(
            item.productVariant.prices,
          ).currentPrice;

          return (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <div className="flex-1">
                <p className="font-medium">{name}</p>
                <p className="text-neutral-500 text-sm">
                  {formatPrice(unitPrice)}
                </p>
              </div>

              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  updateItem(item.id, Math.max(1, Number(e.target.value)))
                }
                className="h-9 w-16 rounded border border-neutral-300 px-2 text-sm"
                aria-label={`Cantidad de ${name}`}
              />

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-neutral-500 text-sm hover:text-red-600"
              >
                Quitar
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between border-neutral-200 border-t pt-6">
        <span className="font-semibold text-lg">
          Total {formatPrice(cart.totals.total)}
        </span>
        <Link
          href="/checkout/"
          className="rounded bg-neutral-900 px-5 py-2.5 font-medium text-sm text-white hover:bg-neutral-700"
        >
          Continuar al pago
        </Link>
      </div>

      <p className="mt-4 text-neutral-500 text-xs">
        Los precios y el stock se confirman contra Bacano al finalizar la
        compra.
      </p>
    </div>
  );
}
