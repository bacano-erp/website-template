"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBrowserClient } from "@/lib/bacano";
import {
  buildOrderPath,
  type PaymentOutcome,
  readPaymentOutcome,
  readPaymentReturnParams,
  saveOrderReference,
} from "@/lib/order-return";

/** The outcome of the settlement attempt. Absent until it resolves. */
type Settled = { status: PaymentOutcome; orderNumber: string | null };

/** What the shopper is shown, including the cases no request can change. */
type Display = "checking" | "unknown" | PaymentOutcome;

/**
 * Where the payment gateway drops the shopper on the way back.
 *
 * This page is the difference between a storefront that can take money and one
 * that cannot. `createPaymentSession` sends the shopper to the provider; if
 * nothing handles the return, they come back to a URL that does not exist and
 * have no idea whether they just paid.
 *
 * Three things happen here, in order:
 *
 *   1. The order reference is stored locally, before anything can fail. A
 *      shopper who closes the tab during the wait can still find their order.
 *   2. If the gateway returned a transaction, it is reconciled — that is what
 *      turns "the provider says approved" into an order Bacano agrees is paid.
 *   3. The order is polled until payment settles, because approval is
 *      asynchronous and the redirect usually arrives first.
 *
 * The status shown always comes from the order, never from the query string.
 * A URL saying `status=APPROVED` is an assertion by whoever opened the link.
 */
export function PaymentReturn() {
  const searchParams = useSearchParams();
  const [settled, setSettled] = useState<Settled | null>(null);

  const params = useMemo(
    () => readPaymentReturnParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const { orderId, token, paymentSessionId, gatewayTransactionId } = params;

  /**
   * A return with no order reference is a fact about the URL, not something to
   * discover — no request could change it. Deriving it during render keeps the
   * effect free of a synchronous setState, which is the shape React warns
   * about and which this used to do.
   */
  const display: Display = !(orderId && token)
    ? "unknown"
    : (settled?.status ?? "checking");

  useEffect(() => {
    if (!orderId || !token) return;

    let cancelled = false;
    saveOrderReference(orderId, token);

    const settle = async () => {
      const client = await getBrowserClient();
      // Best effort: a gateway that returns no transaction id (or a provider
      // Bacano reconciles from its own webhook) is normal, and polling below
      // reaches the same answer either way.
      if (gatewayTransactionId && paymentSessionId) {
        try {
          await client.checkout.reconcilePaymentSession({
            orderId,
            publicOrderToken: token,
            paymentSessionId,
            gatewayTransactionId,
          });
        } catch {
          // Reconciliation is retried server-side; the order is the source of
          // truth and is read next regardless.
        }
      }

      // Read once before waiting. Most returns arrive after the provider has
      // already told Bacano, and answering immediately beats making a shopper
      // watch a spinner for a poll interval to be told what was already known.
      const known = await readOrder(client, orderId, token);
      if (cancelled) return;

      if (known && readPaymentOutcome(known.paymentStatus) !== "pending") {
        setSettled({
          status: readPaymentOutcome(known.paymentStatus),
          orderNumber: known.orderNumber,
        });
        return;
      }

      try {
        const order = await client.orders.waitForPayment({
          orderId,
          token,
          // The SDK waits two minutes by default, polling through errors. That
          // is far too long to leave somebody who may have just been charged
          // looking at "no cierres esta ventana" with nothing changing. Half a
          // minute is enough for a gateway that is going to answer; past that,
          // saying "we are still checking, we will email you" is more useful
          // than continuing to spin.
          timeoutMs: 30_000,
          intervalMs: 2_000,
        });
        if (cancelled) return;
        setSettled({
          status: readPaymentOutcome(order.paymentStatus),
          orderNumber: order.orderNumber,
        });
      } catch {
        // A timeout is an undecided payment, not a failed one: saying "failed"
        // here would tell a shopper whose card was charged that it was not.
        if (cancelled) return;

        const last = await readOrder(client, orderId, token);
        if (cancelled) return;

        setSettled({
          status: last ? readPaymentOutcome(last.paymentStatus) : "pending",
          orderNumber: last?.orderNumber ?? known?.orderNumber ?? null,
        });
      }
    };

    // Every failure has to end in a verdict. Reaching the API can fail before
    // any of the calls below — an unreachable gateway, a store whose API URL is
    // wrong — and an unhandled rejection here left the page on "no cierres esta
    // ventana" for as long as the shopper was willing to look at it.
    void settle().catch(() => {
      if (!cancelled) setSettled({ status: "pending", orderNumber: null });
    });

    return () => {
      cancelled = true;
    };
  }, [orderId, token, paymentSessionId, gatewayTransactionId]);

  const copy = MESSAGES[display];

  return (
    <section className="mx-auto max-w-md text-center">
      <h1 className="font-semibold text-2xl">{copy.title}</h1>
      <p className="mt-3 text-neutral-600">{copy.body}</p>

      {display !== "checking" && display !== "unknown" && (
        <p className="mt-4 text-neutral-500 text-sm">
          {settled?.orderNumber
            ? `Pedido ${settled.orderNumber}`
            : orderId
              ? `Pedido ${orderId}`
              : null}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {orderId ? (
          <Link
            href={buildOrderPath(orderId, token)}
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Ver mi pedido
          </Link>
        ) : null}

        <Link href="/catalogo/" className="text-sm underline">
          Seguir comprando
        </Link>
      </div>
    </section>
  );
}

/** One order read that never throws — absent is an answer this page can use. */
async function readOrder(
  client: Awaited<ReturnType<typeof getBrowserClient>>,
  orderId: string,
  token: string,
) {
  try {
    return await client.orders.getPublicOrder({ orderId, token });
  } catch {
    return null;
  }
}

const MESSAGES: Record<Display, { title: string; body: string }> = {
  checking: {
    title: "Confirmando tu pago…",
    body: "Estamos verificando el resultado con la pasarela. No cierres esta ventana.",
  },
  approved: {
    title: "¡Pago confirmado!",
    body: "Recibimos tu pago y ya estamos preparando tu pedido.",
  },
  pending: {
    title: "Tu pago está en revisión",
    body: "La pasarela aún no confirma el resultado. Te avisaremos por correo en cuanto se resuelva; tu pedido queda guardado.",
  },
  failed: {
    title: "No pudimos procesar el pago",
    body: "Tu pedido sigue guardado. Puedes intentar de nuevo con otro medio de pago.",
  },
  unknown: {
    title: "No encontramos la referencia del pago",
    body: "El enlace de retorno llegó incompleto. Si ya pagaste, revisa tu correo o escríbenos con el número de pedido.",
  },
};
