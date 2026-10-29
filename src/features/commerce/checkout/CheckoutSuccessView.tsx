import {
  AlertCircle,
  CheckCircle2,
  CircleCheck,
  Clock3,
  CreditCard,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { createWhatsAppUrl, whatsAppEnabled } from "@/config/store";

import { formatMoneyCOP } from "@/lib/bacano/formatters";
import { CheckoutPostPurchaseAccountPrompt } from "./CheckoutPostPurchaseAccountPrompt";
import { PublicPaymentSessionAction } from "./PublicPaymentSessionAction";
import type { CheckoutSuccessSnapshot } from "./types";

export function CheckoutSuccessView({
  snapshot,
}: {
  snapshot: CheckoutSuccessSnapshot;
}) {
  const orderNumber = snapshot.orderNumber;
  const state = getCheckoutDisplayState(snapshot);
  const nextSteps = snapshot.nextSteps?.length
    ? snapshot.nextSteps
    : state.defaultSteps;
  const canCreatePaymentSession =
    (snapshot.paymentNextAction === "CREATE_PAYMENT_SESSION" ||
      snapshot.paymentNextAction === "RETRY_PAYMENT") &&
    Boolean(
      snapshot.orderId && snapshot.publicOrderToken && snapshot.paymentMethodId,
    );

  return (
    <main className="container-page py-8 sm:py-12">
      <section className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_22px_70px_rgba(0,0,0,0.08)]">
        <div className="grid gap-8 bg-accent-soft px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-xs uppercase tracking-[0.12em] ${state.badgeClassName}`}
            >
              {state.icon}
              {state.badge}
            </div>
            <h1 className="mt-5 max-w-2xl font-normal text-4xl text-foreground leading-tight sm:text-5xl">
              {state.title}
            </h1>
            <p className="mt-4 max-w-2xl text-accent text-base leading-7">
              {state.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SuccessMetric
                label="Pedido"
                value={orderNumber ? `#${orderNumber}` : state.orderFallback}
              />
              <SuccessMetric
                label="Total"
                value={formatMoneyCOP(snapshot.total)}
              />
            </div>
          </div>

          <div className="relative mx-auto grid size-64 place-items-center">
            <div className="absolute inset-4 rounded-full bg-white/70" />
            <div className="absolute bottom-7 h-7 w-40 rounded-full bg-foreground/10 blur-md" />
            <CircleCheck
              aria-hidden="true"
              className="relative size-28 text-accent"
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            <h2 className="font-medium text-foreground text-xl">
              Resumen del pedido
            </h2>
            <div className="grid gap-3">
              {snapshot.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-md border border-border bg-white p-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-warning-soft">
                    {item.imageSrc ? (
                      <Image
                        referrerPolicy="no-referrer"
                        src={item.imageSrc}
                        alt={item.name}
                        fill
                        sizes="58px"
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="grid h-full place-items-center font-medium text-sm text-warning">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium text-foreground text-sm leading-5">
                      {item.name}
                    </p>
                    <p className="mt-1 text-muted text-xs">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium text-foreground text-sm">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-4 rounded-lg border border-border bg-surface-secondary p-4 sm:grid-cols-3">
              <SuccessDetail
                icon={<Truck size={22} strokeWidth={2.2} />}
                label="Entrega"
                value={snapshot.deliveryLabel}
              />
              <SuccessDetail
                icon={<CreditCard size={22} strokeWidth={2.2} />}
                label="Pago"
                value={snapshot.paymentLabel}
              />
              <SuccessDetail
                icon={<MessageCircle size={22} strokeWidth={2.2} />}
                label="Contacto"
                value={
                  snapshot.contactPhone ?? snapshot.contactEmail ?? "Registrado"
                }
              />
            </div>
          </div>

          <aside className="grid gap-5 rounded-lg border border-border bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)] lg:self-start">
            <h2 className="font-medium text-foreground text-lg">
              Detalle de pago
            </h2>
            <div className="grid gap-3">
              <TotalRow label="Subtotal" value={snapshot.subtotal} />
              {snapshot.discount > 0 ? (
                <TotalRow
                  label="Descuento"
                  value={snapshot.discount}
                  isDiscount
                />
              ) : null}
              {snapshot.shippingAmount === null ? (
                <TextRow label="Envio" value="Por confirmar" />
              ) : snapshot.shippingIsFree ? (
                <TextRow label="Envio" value="Gratis" />
              ) : (
                <TotalRow label="Envio" value={snapshot.shippingAmount} />
              )}
            </div>
            <div className="flex items-center justify-between border-border border-t pt-4">
              <span className="font-medium text-foreground text-sm">Total</span>
              <span className="font-medium text-2xl text-foreground">
                {formatMoneyCOP(snapshot.total)}
              </span>
            </div>

            <div className="grid gap-3 border-border border-t pt-5">
              {nextSteps.map((step, index) => (
                <NextStep
                  key={step}
                  icon={
                    state.kind === "rejected" ? (
                      <AlertCircle size={20} strokeWidth={2.2} />
                    ) : index === 0 ? (
                      <PackageCheck size={20} strokeWidth={2.2} />
                    ) : (
                      <MessageCircle size={20} strokeWidth={2.2} />
                    )
                  }
                  text={step}
                />
              ))}
            </div>

            {canCreatePaymentSession &&
            snapshot.orderId &&
            snapshot.publicOrderToken &&
            snapshot.paymentMethodId ? (
              <PublicPaymentSessionAction
                orderId={snapshot.orderId}
                paymentMethodId={snapshot.paymentMethodId}
                publicOrderToken={snapshot.publicOrderToken}
              />
            ) : null}

            <CheckoutPostPurchaseAccountPrompt />

            <div className="grid gap-3 pt-2">
              <Link href="/catalogo/" className="btn btn-cart w-full">
                <ShoppingBag size={18} strokeWidth={2.3} />
                Seguir comprando
              </Link>
              {whatsAppEnabled ? (
                <a
                  href={createWhatsAppUrl()}
                  className="btn btn-secondary w-full"
                >
                  Necesito ayuda
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SuccessMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-accent-soft bg-white px-4 py-3">
      <p className="font-medium text-muted text-xs uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 font-medium text-foreground text-lg">{value}</p>
    </div>
  );
}

function SuccessDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-muted text-xs uppercase tracking-[0.1em]">
          {label}
        </span>
        <span className="mt-1 block font-medium text-foreground text-sm leading-5">
          {value}
        </span>
      </span>
    </div>
  );
}

function TotalRow({
  isDiscount = false,
  label,
  value,
}: {
  isDiscount?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">
        {isDiscount && value > 0 ? "-" : ""}
        {formatMoneyCOP(value)}
      </span>
    </div>
  );
}

function TextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-muted">{value}</span>
    </div>
  );
}

function NextStep({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 text-accent text-sm leading-6">
      <span className="mt-0.5 text-accent">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

type CheckoutDisplayState = {
  badge: string;
  badgeClassName: string;
  defaultSteps: string[];
  description: string;
  icon: ReactNode;
  kind: "confirmed" | "pending" | "rejected";
  orderFallback: string;
  title: string;
};

function getCheckoutDisplayState(
  snapshot: CheckoutSuccessSnapshot,
): CheckoutDisplayState {
  const paymentStatus = normalizeStatus(snapshot.paymentStatus);
  const orderStatus = normalizeStatus(snapshot.status);
  const nextAction = snapshot.paymentNextAction ?? null;
  const sessionStatus = normalizeStatus(snapshot.paymentSession?.status);
  const isRejected = [
    "declined",
    "error",
    "cancelled",
    "canceled",
    "expired",
    "voided",
  ].includes(sessionStatus);
  const isPaid = ["paid", "partial"].includes(paymentStatus);
  const isConfirmed =
    isPaid ||
    (Boolean(snapshot.orderNumber) &&
      ["confirmed", "completed", "paid"].includes(orderStatus));

  if (isRejected) {
    return {
      badge: "Pago no confirmado",
      badgeClassName: "text-danger",
      defaultSteps: [
        "No pudimos confirmar el pago con la pasarela.",
        "Puedes intentar pagar de nuevo o escribirnos para ayudarte.",
      ],
      description:
        "Tu pedido quedo registrado, pero el pago no fue aprobado. Si crees que hubo un error, escribenos y revisamos el caso contigo.",
      icon: <XCircle size={18} strokeWidth={2.4} />,
      kind: "rejected",
      orderFallback: "Pago pendiente",
      title: "No pudimos confirmar el pago",
    };
  }

  if (nextAction === "RETRY_PAYMENT") {
    return {
      badge: "Pago por reintentar",
      badgeClassName: "text-danger",
      defaultSteps: [
        "La pasarela necesita un nuevo intento de pago.",
        "Puedes volver a intentar desde el enlace del pedido o escribirnos para ayudarte.",
      ],
      description:
        "Tu pedido sigue registrado, pero el pago necesita un nuevo intento antes de confirmarse.",
      icon: <XCircle size={18} strokeWidth={2.4} />,
      kind: "rejected",
      orderFallback: "Pago pendiente",
      title: "Intenta pagar de nuevo",
    };
  }

  if (nextAction === "PAY_ON_DELIVERY") {
    return {
      badge: "Pago contraentrega",
      badgeClassName: "text-accent",
      defaultSteps: [
        "Pagaras cuando recibas tu pedido.",
        "Te contactaremos para confirmar disponibilidad y coordinar la entrega.",
      ],
      description:
        "Tu pedido fue recibido correctamente. El pago se realizará al momento de la entrega.",
      icon: <PackageCheck size={18} strokeWidth={2.4} />,
      kind: "confirmed",
      orderFallback: "Recibido",
      title: "Pedido recibido",
    };
  }

  if (nextAction === "PAY_AT_PICKUP") {
    return {
      badge: "Pago al recoger",
      badgeClassName: "text-accent",
      defaultSteps: [
        "Pagaras cuando recojas tu pedido.",
        "Te avisaremos cuando el pedido este listo para recoger.",
      ],
      description:
        "Tu pedido fue recibido correctamente. El pago se realizará al recoger en tienda.",
      icon: <PackageCheck size={18} strokeWidth={2.4} />,
      kind: "confirmed",
      orderFallback: "Recibido",
      title: "Pedido recibido",
    };
  }

  if (nextAction === "WAIT_FOR_ORDER_CONFIRMATION") {
    return {
      badge: "Pedido recibido",
      badgeClassName: "text-accent",
      defaultSteps: [
        "Confirmaremos disponibilidad y preparacion del pedido.",
        "Te avisaremos por WhatsApp o correo cualquier novedad.",
      ],
      description:
        "Ya recibimos tu pedido. Bacano lo mantendra en seguimiento mientras se completa la confirmacion.",
      icon: <Clock3 size={18} strokeWidth={2.4} />,
      kind: "pending",
      orderFallback: "En proceso",
      title: "Pedido en confirmacion",
    };
  }

  if (nextAction === "CREATE_PAYMENT_SESSION") {
    return {
      badge: "Pago pendiente",
      badgeClassName: "text-accent",
      defaultSteps: [
        "Tu pedido necesita abrir una sesion segura de pago.",
        "Si la ventana de pago no se abrió, vuelve al checkout o escribenos para ayudarte.",
      ],
      description:
        "Tu pedido fue recibido y tiene un pago pendiente por iniciar en pasarela.",
      icon: <CreditCard size={18} strokeWidth={2.4} />,
      kind: "pending",
      orderFallback: "Pago pendiente",
      title: "Continua con el pago",
    };
  }

  if (!snapshot.paymentSession && snapshot.orderNumber) {
    return {
      badge: "Pedido recibido",
      badgeClassName: "text-accent",
      defaultSteps: [
        "Confirmaremos disponibilidad y preparacion del pedido.",
        "Te avisaremos por WhatsApp o correo para coordinar los siguientes pasos.",
      ],
      description:
        "Tu pedido fue recibido correctamente. Si elegiste pagar al recibir o al recoger, el pago queda pendiente hasta ese momento.",
      icon: <PackageCheck size={18} strokeWidth={2.4} />,
      kind: "confirmed",
      orderFallback: "Recibido",
      title: "Pedido recibido",
    };
  }

  if (!isConfirmed) {
    return {
      badge: "Pedido en seguimiento",
      badgeClassName: "text-accent",
      defaultSteps: [
        "Bacano esta actualizando el estado final del pedido.",
        "Te avisaremos por WhatsApp o correo cualquier novedad.",
      ],
      description:
        "Tu pedido fue iniciado correctamente. La confirmacion final puede tardar unos minutos.",
      icon: <Clock3 size={18} strokeWidth={2.4} />,
      kind: "pending",
      orderFallback: "En seguimiento",
      title: "Estamos revisando tu pedido",
    };
  }

  return {
    badge: "Compra confirmada",
    badgeClassName: "text-accent",
    defaultSteps: [
      "Confirmaremos disponibilidad y preparacion del pedido.",
      "Te avisaremos por WhatsApp o correo cualquier novedad.",
    ],
    description:
      "Ya tenemos tu pedido confirmado y lo estamos preparando. Te contactaremos por WhatsApp o correo para los siguientes pasos.",
    icon: <CheckCircle2 size={18} strokeWidth={2.4} />,
    kind: "confirmed",
    orderFallback: "En proceso",
    title: "Gracias por tu compra",
  };
}

function normalizeStatus(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}
