"use client";

import type { PublicOrder } from "@bacano/sdk";
import { AlertCircle, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createWhatsAppUrl, whatsAppEnabled } from "@/config/store";
import {
  getOrderPaymentStatus,
  pollPublicOrder,
} from "@/features/commerce/checkout/payment-response";
import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

type PaymentResponseState = {
  message: string | null;
  order: PublicOrder | null;
  status: "checking" | "missing" | "approved" | "pending" | "failed" | "error";
  warning: string | null;
};
type PaymentSearchParams = {
  get: (key: string) => string | null;
};

export function PaymentResponseClient() {
  const searchParams = useSearchParams();
  const responseParams = useMemo(
    () => readPaymentResponseParams(searchParams),
    [searchParams],
  );
  const [state, setState] = useState<PaymentResponseState>({
    message: null,
    order: null,
    status: "checking",
    warning: null,
  });
  const { orderId, paymentSessionId, token, transactionId } = responseParams;
  const hasRequiredParams = Boolean(orderId && token);
  const displayState = hasRequiredParams
    ? state
    : {
        message:
          "Este enlace no trae los datos del pedido. Si acabas de pagar, tu pedido está registrado: escríbenos y lo revisamos.",
        order: null,
        status: "missing" as const,
        warning: null,
      };
  const orderPath = orderId
    ? `/pedido/?orderId=${encodeURIComponent(orderId)}${
        token ? `&token=${encodeURIComponent(token)}` : ""
      }`
    : null;
  const content = getPaymentResponseContent(displayState.status);

  useEffect(() => {
    let isCancelled = false;

    if (!orderId || !token) {
      return;
    }

    const currentOrderId = orderId;
    const currentToken = token;
    const currentPaymentSessionId = paymentSessionId;
    const currentTransactionId = transactionId;

    async function reconcileAndWait() {
      setState({
        message: null,
        order: null,
        status: "checking",
        warning: null,
      });

      try {
        const client = await getBacanoBrowserClient();
        const reconcileWarning =
          currentPaymentSessionId && currentTransactionId
            ? await reconcilePaymentSessionSafely({
                gatewayTransactionId: currentTransactionId,
                orderId: currentOrderId,
                paymentSessionId: currentPaymentSessionId,
                publicOrderToken: currentToken,
              })
            : null;

        const order = await pollPublicOrder({
          getOrder: () =>
            client.orders.getPublicOrder({
              orderId: currentOrderId,
              token: currentToken,
            }),
          shouldStop: () => isCancelled,
        });

        if (isCancelled || !order) return;

        const status = getOrderPaymentStatus(order);

        setState({
          message: null,
          order,
          status,
          warning: reconcileWarning,
        });
      } catch {
        if (isCancelled) return;

        const fallbackOrder = await getPublicOrderSafely(
          currentOrderId,
          currentToken,
        );
        if (isCancelled) return;

        // The API not answering says nothing about whether the card was
        // charged, so this is "in review", never "failed": the order exists and
        // its page will show the outcome once Bacano can be reached.
        setState({
          message: fallbackOrder
            ? null
            : "No pudimos consultar el estado ahora mismo. Si el pago se aprobó, lo verás en tu pedido en unos minutos.",
          order: fallbackOrder,
          status: fallbackOrder
            ? getOrderPaymentStatus(fallbackOrder)
            : "pending",
          warning: null,
        });
      }
    }

    void reconcileAndWait();

    return () => {
      isCancelled = true;
    };
  }, [orderId, paymentSessionId, token, transactionId]);

  return (
    <main className="container-page py-10 sm:py-14">
      <section className="mx-auto max-w-2xl rounded-lg border border-border bg-white p-7 text-center shadow-[0_22px_70px_rgba(0,0,0,0.08)]">
        <div
          className={`mx-auto grid size-14 place-items-center rounded-full ${content.iconClassName}`}
        >
          {content.icon}
        </div>
        <p className="mt-5 font-medium text-warning text-xs uppercase tracking-[0.16em]">
          Respuesta de pago
        </p>
        <h1 className="mt-2 font-normal text-3xl text-foreground">
          {content.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-accent text-base leading-7">
          {displayState.message ?? content.description}
        </p>
        {displayState.order?.orderNumber ? (
          <p className="mt-3 font-medium text-muted text-sm">
            Pedido {displayState.order.orderNumber}
          </p>
        ) : orderId ? (
          <p className="mt-3 font-medium text-muted text-xs">ID {orderId}</p>
        ) : null}
        {displayState.warning ? (
          <p className="mx-auto mt-4 max-w-xl rounded-md border border-warning-soft bg-warning-soft px-4 py-3 text-sm text-warning leading-6">
            {displayState.warning}
          </p>
        ) : null}
        <div className="mx-auto mt-6 grid max-w-sm gap-3">
          {orderPath ? (
            <Link href={orderPath} className="btn btn-cart w-full">
              Ver mi pedido
            </Link>
          ) : null}
          <Link href="/catalogo/" className="btn btn-secondary w-full">
            Seguir comprando
          </Link>
          {whatsAppEnabled ? (
            <a
              href={createWhatsAppUrl(
                orderId
                  ? `Hola, necesito ayuda con el pago de mi pedido ${displayState.order?.orderNumber ?? orderId}`
                  : undefined,
              )}
              className="text-muted text-sm underline"
            >
              Necesito ayuda
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}

async function reconcilePaymentSessionSafely({
  gatewayTransactionId,
  orderId,
  paymentSessionId,
  publicOrderToken,
}: {
  gatewayTransactionId: string;
  orderId: string;
  paymentSessionId: string;
  publicOrderToken: string;
}) {
  try {
    const client = await getBacanoBrowserClient();
    const result = await client.checkout.reconcilePaymentSession({
      gatewayTransactionId,
      orderId,
      paymentSessionId,
      publicOrderToken,
    });

    if (result.success) return null;

    return (
      result.errors?.join(", ") ??
      "Bacano recibio la respuesta de la pasarela, pero aun no pudo conciliarla."
    );
  } catch {
    return "Bacano aun no pudo conciliar la respuesta de la pasarela. Seguiremos consultando el estado del pedido.";
  }
}

async function getPublicOrderSafely(orderId: string, token: string) {
  try {
    const client = await getBacanoBrowserClient();
    return await client.orders.getPublicOrder({ orderId, token });
  } catch {
    return null;
  }
}

function readPaymentResponseParams(searchParams: PaymentSearchParams) {
  return {
    orderId:
      readQueryParam(searchParams, "orderId") ??
      readQueryParam(searchParams, "order_id") ??
      readQueryParam(searchParams, "order") ??
      readQueryParam(searchParams, "reference") ??
      readQueryParam(searchParams, "reference_id"),
    paymentSessionId:
      readQueryParam(searchParams, "paymentSessionId") ??
      readQueryParam(searchParams, "payment_session_id") ??
      readQueryParam(searchParams, "payment_session") ??
      readQueryParam(searchParams, "sessionId"),
    token:
      readQueryParam(searchParams, "token") ??
      readQueryParam(searchParams, "publicOrderToken") ??
      readQueryParam(searchParams, "public_order_token"),
    transactionId:
      readQueryParam(searchParams, "id") ??
      readQueryParam(searchParams, "transactionId") ??
      readQueryParam(searchParams, "transaction_id") ??
      readQueryParam(searchParams, "gatewayTransactionId") ??
      readQueryParam(searchParams, "gateway_transaction_id"),
  };
}

function readQueryParam(searchParams: PaymentSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();

  return value || null;
}

function getPaymentResponseContent(status: PaymentResponseState["status"]) {
  if (status === "approved") {
    return {
      description:
        "Bacano ya confirmo el pago. Puedes consultar el resumen actualizado de tu pedido.",
      icon: <CheckCircle2 size={30} strokeWidth={2.4} />,
      iconClassName: "bg-accent-soft text-accent",
      title: "Pago confirmado",
    };
  }

  if (status === "failed") {
    return {
      description:
        "La pasarela no aprobo este intento. Tu pedido sigue registrado y puedes intentar pagar nuevamente o contactarnos.",
      icon: <XCircle size={30} strokeWidth={2.4} />,
      iconClassName: "bg-danger-soft text-danger",
      title: "El pago no fue aprobado",
    };
  }

  if (status === "missing" || status === "error") {
    return {
      description:
        "No pudimos consultar el estado en este momento. Si acabas de pagar, escríbenos y revisamos tu pedido.",
      icon: <AlertCircle size={30} strokeWidth={2.4} />,
      iconClassName: "bg-warning-soft text-warning",
      title: "No encontramos la referencia de tu pago",
    };
  }

  if (status === "pending") {
    return {
      description:
        "La pasarela todavía no confirma el resultado final. Puede tardar unos minutos; tu pedido se actualiza solo.",
      icon: <AlertCircle size={30} strokeWidth={2.4} />,
      iconClassName: "bg-warning-soft text-warning",
      title: "Tu pago está en revisión",
    };
  }

  return {
    description:
      "La confirmacion final puede tardar unos minutos. Cuando la pasarela reporte el resultado, Bacano actualizará tu pedido automaticamente.",
    icon: <LoaderCircle size={30} strokeWidth={2.4} className="animate-spin" />,
    iconClassName: "bg-accent-soft text-accent",
    title: "Confirmando tu pago",
  };
}
