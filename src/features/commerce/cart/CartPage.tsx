"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatMoneyCOP } from "@/lib/bacano/formatters";
import { getProductUrl } from "@/lib/bacano/urls";
import { useCart } from "./CartProvider";

/**
 * The cart as a page, for whoever lands on /carrito/ by URL. Shopping happens
 * in the drawer; this shows the same local cart and leads to checkout.
 */
export function CartPage() {
  const { cart, isLoading, removeItem, setItemQuantity } = useCart();
  const items = cart?.items ?? [];

  if (isLoading) {
    return <p className="container-page py-10 text-muted">Cargando carrito…</p>;
  }

  return (
    <main className="container-page py-10">
      <h1 className="font-semibold text-2xl text-foreground">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="mt-8 grid justify-items-start gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
            <ShoppingBag aria-hidden="true" size={26} />
          </span>
          <p className="text-muted">Tu carrito está vacío.</p>
          <Link href="/catalogo/" className="btn btn-primary">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-border">
            {items.map((item) => {
              const price = item.productVariant.pricing.currentPrice;
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={getProductUrl(item.productVariant.product)}
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.productVariant.product.name}
                    </Link>
                    {item.productVariant.attributes.length > 0 ? (
                      <p className="text-muted text-sm">
                        {item.productVariant.attributes
                          .map(({ name, value }) => `${name}: ${value}`)
                          .join(" / ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Quitar una unidad"
                      onClick={() =>
                        void setItemQuantity(item.id, item.quantity - 1)
                      }
                      className="grid size-8 place-items-center rounded-full border border-border text-foreground"
                    >
                      <Minus aria-hidden="true" size={16} />
                    </button>
                    <span className="min-w-6 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Agregar una unidad"
                      onClick={() =>
                        void setItemQuantity(item.id, item.quantity + 1)
                      }
                      className="grid size-8 place-items-center rounded-full border border-border text-foreground"
                    >
                      <Plus aria-hidden="true" size={16} />
                    </button>
                    <span className="w-28 text-right font-medium tabular-nums">
                      {price === null
                        ? ""
                        : formatMoneyCOP(price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.productVariant.product.name}`}
                      onClick={() => void removeItem(item.id)}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-border border-t pt-6">
            <p className="text-lg">
              Subtotal{" "}
              <strong className="tabular-nums">
                {formatMoneyCOP(cart?.totals.subtotal ?? 0)}
              </strong>
            </p>
            <Link href="/checkout/" className="btn btn-cart">
              Ir a pagar
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
