"use client";

import Link from "next/link";
import { useCart } from "@bacano/sdk/react";
import { formatPrice } from "@/lib/bacano";

/**
 * Checkout scaffold — intentionally incomplete.
 *
 * A real checkout is store-specific (pickup vs shipping, which payment
 * providers, address requirements), so the template stops at the point where
 * those decisions start. The SDK surface you need:
 *
 *   const client = useBacano();
 *   client.checkout.getLocationOptions()      // departments / municipalities
 *   client.checkout.getDeliveryOptions()      // pickup vs shipping
 *   client.checkout.getShippingQuotes({...})  // cost for an address
 *   client.checkout.getPaymentOptions({...})  // enabled payment methods
 *   client.checkout.createPaymentSession(...) // hosted payment redirect
 *   useCheckout().checkout({...})             // submit the order
 *
 * Two rules that are not negotiable:
 *   1. Never collect card details in this app. Use the provider's hosted
 *      fields or redirect, so card data never touches the storefront and PCI
 *      scope stays minimal.
 *   2. The totals shown here are indicative. Bacano re-validates price and
 *      stock server-side when the order is submitted — that result wins.
 */
export default function CheckoutPage() {
  const { cart, loading } = useCart();

  if (loading) return <p className="text-neutral-600">Cargando…</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Pago</h1>
        <p className="mt-4 text-neutral-600">Tu carrito está vacío.</p>
        <Link href="/catalogo/" className="mt-6 inline-block text-sm underline">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Pago</h1>

      <dl className="mt-6 space-y-2 border-b border-neutral-200 pb-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Subtotal</dt>
          <dd>{formatPrice(cart.totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">Impuestos</dt>
          <dd>{formatPrice(cart.totals.tax)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatPrice(cart.totals.total)}</dd>
        </div>
      </dl>

      <div className="mt-6 rounded border border-dashed border-neutral-300 p-6">
        <p className="text-sm font-medium">Checkout pendiente de implementar</p>
        <p className="mt-2 text-sm text-neutral-600">
          Implementa aquí entrega, dirección y pago con{" "}
          <code className="rounded bg-neutral-100 px-1">client.checkout.*</code>.
          Consulta los comentarios de este archivo y el README del SDK.
        </p>
      </div>

      <Link href="/carrito/" className="mt-6 inline-block text-sm underline">
        Volver al carrito
      </Link>
    </div>
  );
}
