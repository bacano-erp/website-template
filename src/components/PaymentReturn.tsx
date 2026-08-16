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

type State =
  | { status: "checking" }
  | { status: "unknown" }
  | { status: PaymentOutcome; orderNumber: string | null };

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
  const [state, setState] = useState<State>({ status: "checking" });

  const params = useMemo(
    () => readPaymentReturnParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const { orderId, token, paymentSessionId, gatewayTransactionId } = params;

  useEffect(() => {
    if (!orderId || !token) {
      setState({ status: "unknown" });
      return;
    }

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

      try {
        const order = await client.orders.waitForPayment({ orderId, token });
        if (cancelled) return;
        setState({
          status: readPaymentOutcome(order.paymentStatus),
          orderNumber: order.orderNumber,
        });
      } catch {
        // waitForPayment gives up after its timeout. That is not a failed
        // payment — it is an undecided one, and saying "failed" here would
        // tell a shopper whose card was charged that it was not.
        if (cancelled) return;

        try {
          const order = await client.orders.getPublicOrder({ orderId, token });
          if (cancelled) return;
          setState(
            order
              ? {
                  status: readPaymentOutcome(order.paymentStatus),
                  orderNumber: order.orderNumber,
                }
              : { status: "pending", orderNumber: null },
          );
        } catch {
          if (!cancelled) setState({ status: "pending", orderNumber: null });
        }
      }
    };

    void settle();

    return () => {
      cancelled = true;
    };
  }, [orderId, token, paymentSessionId, gatewayTransactionId]);

  const copy = MESSAGES[state.status];

  return (
    <section className="mx-auto max-w-md text-center">
      <h1 className="font-semibold text-2xl">{copy.title}</h1>
      <p className="mt-3 text-neutral-600">{copy.body}</p>

      {state.status !== "checking" && state.status !== "unknown" && (
        <p className="mt-4 text-neutral-500 text-sm">
          {"orderNumber" in state && state.orderNumber
            ? `Pedido ${state.orderNumber}`
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

const MESSAGES: Record<State["status"], { title: string; body: string }> = {
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
