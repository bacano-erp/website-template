"use client";

import type { PublicOrder } from "@bacano/sdk";
import { MessageCircle, PackageCheck, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createWhatsAppUrl, whatsAppEnabled } from "@/config/store";

import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";
import { getBacanoStorageFileUrl } from "@/lib/bacano/media";

import { CheckoutSuccessView } from "./CheckoutSuccessView";
import { readOrderSuccessSnapshot } from "./order-success-storage";
import { getPaymentDisplayLabel } from "./payment-presentation";
import type {
  CheckoutPaymentSessionSummary,
  CheckoutSuccessSnapshot,
} from "./types";

export function OrderTrackingView({
  orderId,
  token,
}: {
  orderId: string;
  token?: string;
}) {
  const [snapshot, setSnapshot] = useState<
    CheckoutSuccessSnapshot | null | undefined
  >(undefined);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    async function loadOrder() {
      const localSnapshot = readOrderSuccessSnapshot(orderId);

      if (!token) {
        setSnapshot(localSnapshot);
        return;
      }

      try {
        const client = await getBacanoBrowserClient();
        const publicOrder = await client.orders.getPublicOrder({
          orderId,
          token,
        });

        setSnapshot(
          publicOrder
            ? mapPublicOrderToSnapshot(publicOrder, token, localSnapshot)
            : localSnapshot,
        );
        setLookupError(publicOrder ? null : "ORDER_NOT_FOUND");
      } catch {
        setSnapshot(localSnapshot);
        setLookupError("LOOKUP_FAILED");
      }
    }

    return () => window.clearTimeout(timeoutId);
  }, [orderId, token]);

  if (snapshot === undefined) {
    return (
      <main className="container-page py-10 sm:py-14">
        <section
          aria-busy="true"
          className="mx-auto grid max-w-3xl gap-6 overflow-hidden rounded-lg border border-border bg-white p-6 shadow-[0_22px_70px_rgba(0,0,0,0.08)] sm:p-8"
        >
          <div className="mx-auto size-44 animate-pulse rounded-full bg-surface-secondary" />
          <div className="mx-auto grid w-full max-w-xl justify-items-center gap-3">
            <div className="h-9 w-8/12 animate-pulse rounded-full bg-surface-secondary" />
            <div className="h-4 w-5/12 animate-pulse rounded-full bg-surface-secondary" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-surface-secondary" />
            <div className="h-4 w-10/12 animate-pulse rounded-full bg-surface-secondary" />
          </div>
        </section>
      </main>
    );
  }

  if (snapshot) {
    return <CheckoutSuccessView snapshot={snapshot} />;
  }

  return (
    <main className="container-page py-8 sm:py-12">
      <section className="mx-auto grid max-w-3xl gap-6 overflow-hidden rounded-lg border border-border bg-white p-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.08)] sm:p-8">
        <div className="relative mx-auto grid size-48 place-items-center">
          <div className="absolute inset-5 rounded-full bg-accent-soft" />
          <PackageCheck
            aria-hidden="true"
            className="relative size-28 text-accent"
            strokeWidth={1.5}
          />
        </div>
        <div>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 font-medium text-accent text-xs uppercase tracking-[0.12em]">
            <PackageSearch size={17} strokeWidth={2.3} />
            Seguimiento de pedido
          </div>
          <h1 className="mt-4 font-normal text-3xl text-foreground sm:text-4xl">
            No encontramos el pedido
          </h1>
          <p className="mt-3 font-medium text-muted text-sm">ID: {orderId}</p>
          <p className="mx-auto mt-4 max-w-xl text-accent text-base leading-7">
            {lookupError === "LOOKUP_FAILED"
              ? "No pudimos consultar el pedido en este momento. Inténtalo de nuevo en unos minutos con el enlace que recibiste al comprar."
              : "Este enlace no abre ningún pedido. Revisa que sea el que recibiste al finalizar la compra."}
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-sm gap-3">
          {whatsAppEnabled ? (
            <a href={createWhatsAppUrl()} className="btn btn-cart w-full">
              <MessageCircle size={18} strokeWidth={2.3} />
              Necesito ayuda
            </a>
          ) : null}
          <Link href="/catalogo/" className="btn btn-secondary w-full">
            Volver al catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}

function mapPublicOrderToSnapshot(
  order: PublicOrder,
  token: string,
  localSnapshot: CheckoutSuccessSnapshot | null,
): CheckoutSuccessSnapshot {
  const isPickup = order.fulfillmentFamily === "PICKUP";
  const deliveryLabel = isPickup
    ? (order.delivery.pickup?.label ??
      localSnapshot?.deliveryLabel ??
      "Recoger en tienda")
    : (order.delivery.shipping?.label ??
      localSnapshot?.deliveryLabel ??
      "Por confirmar");
  const rawPaymentLabel = order.payment.label ?? order.payment.method?.label;
  const paymentLabel =
    (rawPaymentLabel
      ? getPaymentDisplayLabel(rawPaymentLabel, order.payment.method?.label)
      : null) ??
    localSnapshot?.paymentLabel ??
    "Por confirmar";

  return {
    contactEmail: localSnapshot?.contactEmail,
    contactPhone: localSnapshot?.contactPhone,
    deliveryLabel,
    discount: order.totals.discount,
    items: order.items.map((item) => ({
      id: item.id,
      imageSrc: item.imageFileId
        ? getBacanoStorageFileUrl(item.imageFileId)
        : null,
      name: item.name,
      quantity: item.quantity,
      sku: item.sku,
    })),
    nextSteps: order.nextSteps,
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    paymentLabel,
    paymentMethodId:
      order.payment.initialPayment?.paymentMethodId ??
      order.payment.method?.id ??
      null,
    paymentNextAction: order.payment.nextAction,
    paymentSession: readPublicOrderPaymentSession(order),
    paymentStatus: order.paymentStatus,
    publicOrderToken: token,
    shippingAmount: isPickup ? 0 : (order.delivery.shipping?.amount ?? null),
    shippingIsFree: isPickup,
    status: order.status,
    subtotal: order.totals.subtotal,
    total: order.totals.totalWithDiscount ?? order.totals.total,
  };
}

function readPublicOrderPaymentSession(
  order: PublicOrder,
): CheckoutPaymentSessionSummary | null {
  const payment = order.payment as PublicOrder["payment"] & {
    session?: Record<string, unknown> | null;
  };
  const session = payment.session;
  if (!session) return null;

  return {
    amount: readNumber(session.amount),
    errorMessage: readString(session.errorMessage ?? session.error_message),
    gatewayTransactionId: readString(
      session.gatewayTransactionId ?? session.gateway_transaction_id,
    ),
    reference: readString(session.reference),
    status: readString(session.status),
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
