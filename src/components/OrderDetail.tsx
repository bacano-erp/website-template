"use client";

import type { PublicOrder } from "@bacano/sdk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, getBrowserClient } from "@/lib/bacano";
import { readOrderReference, readPaymentOutcome } from "@/lib/order-return";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; order: PublicOrder };

/**
 * A page opened without an order id cannot become anything else, so it is
 * derived during render rather than discovered by an effect — which also keeps
 * the effect free of the synchronous setState React warns about.
 *
 * The token is different: it may come from local storage, which does not exist
 * while prerendering, so resolving it has to wait for the browser.
 */

/**
 * A guest's order, looked up with the token they were given.
 *
 * There is no session here on purpose: most storefronts sell to shoppers who
 * never create an account, and an order they cannot open is an order they will
 * phone about. The token in the URL is the credential, which is why this page
 * is never indexed.
 *
 * A signed-in buyer has a better route — `client.orders.list()` — and a store
 * with accounts enabled should link that from "mis pedidos" instead.
 */
export function OrderDetail() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ status: "loading" });

  const orderId = searchParams.get("orderId");
  const tokenFromUrl = searchParams.get("token");

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    const load = async () => {
      const client = await getBrowserClient();

      // The URL wins, but a shopper who reopened this page from history — or
      // followed a link that lost its query string — still has the copy saved
      // when the order was placed.
      const token = tokenFromUrl ?? readOrderReference(orderId)?.token ?? null;
      if (!token) {
        if (!cancelled) setState({ status: "missing" });
        return;
      }

      try {
        const order = await client.orders.getPublicOrder({ orderId, token });
        if (cancelled) return;
        setState(order ? { status: "ready", order } : { status: "missing" });
      } catch {
        if (!cancelled) setState({ status: "missing" });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [orderId, tokenFromUrl]);

  const display: State = orderId ? state : { status: "missing" };

  if (display.status === "loading") {
    return <p className="text-neutral-600">Cargando tu pedido…</p>;
  }

  if (display.status === "missing") {
    return (
      <div>
        <h1 className="font-semibold text-2xl">No encontramos el pedido</h1>
        <p className="mt-3 text-neutral-600">
          El enlace puede haber expirado o estar incompleto. Si ya compraste,
          revisa el correo de confirmación.
        </p>
        <Link href="/catalogo/" className="mt-6 inline-block text-sm underline">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const { order } = display;
  const outcome = readPaymentOutcome(order.paymentStatus);

  return (
    <div>
      <h1 className="font-semibold text-2xl">
        Pedido {order.orderNumber ?? order.orderId}
      </h1>
      <p className="mt-2 text-neutral-600 text-sm">{PAYMENT_COPY[outcome]}</p>

      <ul className="mt-8 divide-y divide-neutral-200 border-neutral-200 border-y">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
            <span>
              {item.name}
              <span className="text-neutral-500"> × {item.quantity}</span>
            </span>
            <span>{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 text-sm">
        <Row label="Subtotal" value={order.totals.subtotal} />
        {order.totals.discount > 0 && (
          <Row label="Descuento" value={-order.totals.discount} />
        )}
        <Row label="Impuestos" value={order.totals.tax} />
        <div className="flex justify-between border-neutral-200 border-t pt-2 font-semibold text-base">
          <dt>Total</dt>
          <dd>{formatPrice(order.totals.totalWithDiscount)}</dd>
        </div>
      </dl>

      {/* What the shopper has to do next — pay at the counter, wait for a
          transfer to clear, collect at a pickup point. Bacano composes these
          from the delivery and payment methods actually chosen, so a store
          never has to guess which sentence applies. */}
      {order.nextSteps.length > 0 && (
        <section className="mt-8 rounded-lg bg-neutral-50 p-4">
          <h2 className="font-medium text-sm">Siguientes pasos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700 text-sm">
            {order.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/catalogo/" className="mt-8 inline-block text-sm underline">
        Seguir comprando
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-600">{label}</dt>
      <dd>{formatPrice(value)}</dd>
    </div>
  );
}

const PAYMENT_COPY: Record<ReturnType<typeof readPaymentOutcome>, string> = {
  approved: "Pago confirmado. Ya estamos preparando tu pedido.",
  pending: "Estamos esperando la confirmación del pago.",
  failed: "El pago no se completó. Tu pedido sigue guardado.",
};
