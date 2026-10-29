"use client";

import type {
  WebsiteCouponActionResult,
  WebsiteFreeShippingProgress,
  WebsiteFulfillmentFamily,
  WebsiteShippingQuote,
} from "@bacano/sdk";
import type { LocalCartItem } from "@/features/commerce/cart/local-cart";
import { formatMoneyCOP } from "@/lib/bacano/formatters";

import { CheckoutCouponSection } from "./CheckoutCouponSection";
import { FreeShippingProgressBar } from "./FreeShippingProgressBar";

export function CheckoutTotalsPanel({
  appliedCoupon,
  couponCode,
  couponLoading,
  discount,
  embedded = false,
  items,
  onApplyCoupon,
  onCouponCodeChange,
  onRemoveCoupon,
  selectedFulfillmentFamily,
  freeShippingProgress,
  shippingAmount,
  shippingQuote,
  shippingIsPending,
  shippingLoading,
  subtotal,
  total,
}: {
  appliedCoupon: WebsiteCouponActionResult | null;
  couponCode: string;
  couponLoading: boolean;
  discount: number;
  embedded?: boolean;
  items: LocalCartItem[];
  onApplyCoupon: () => void;
  onCouponCodeChange: (value: string) => void;
  onRemoveCoupon: () => void;
  selectedFulfillmentFamily: WebsiteFulfillmentFamily;
  freeShippingProgress: WebsiteFreeShippingProgress | null;
  shippingAmount: number | null;
  shippingQuote: WebsiteShippingQuote | null;
  shippingIsPending: boolean;
  shippingLoading: boolean;
  subtotal: number;
  total: number;
}) {
  const quoteHasFreeShippingProgress =
    selectedFulfillmentFamily === "SHIPPING" &&
    Boolean(shippingQuote?.freeShippingEligible) &&
    (Boolean(shippingQuote?.freeShippingApplied) ||
      shippingQuote?.freeShippingRemaining !== null);
  const cartHasFreeShippingProgress =
    selectedFulfillmentFamily === "SHIPPING" &&
    Boolean(freeShippingProgress?.enabled) &&
    (Boolean(freeShippingProgress?.thresholdReached) ||
      freeShippingProgress?.remaining !== null);
  const showFreeShippingProgress =
    quoteHasFreeShippingProgress || cartHasFreeShippingProgress;
  const freeShippingApplied = quoteHasFreeShippingProgress
    ? Boolean(shippingQuote?.freeShippingApplied)
    : Boolean(freeShippingProgress?.thresholdReached);
  const freeShippingRemaining =
    quoteHasFreeShippingProgress && shippingQuote
      ? shippingQuote.freeShippingRemaining
      : (freeShippingProgress?.remaining ?? null);
  const freeShippingThreshold =
    quoteHasFreeShippingProgress && shippingQuote
      ? shippingQuote.freeShippingThreshold
      : (freeShippingProgress?.threshold ?? null);
  const freeShippingEligibleSubtotal =
    quoteHasFreeShippingProgress && shippingQuote
      ? shippingQuote.freeShippingEligibleSubtotal
      : (freeShippingProgress?.eligibleSubtotal ?? null);
  const displayedFreeShippingProgress = showFreeShippingProgress
    ? {
        eligibleSubtotal: freeShippingEligibleSubtotal,
        currency:
          shippingQuote?.currency ?? freeShippingProgress?.currency ?? "COP",
        enabled: true,
        remaining: freeShippingRemaining,
        threshold: freeShippingThreshold,
        thresholdReached: freeShippingApplied,
      }
    : null;

  return (
    <section
      className={
        embedded
          ? "bg-transparent"
          : "rounded-lg border border-border bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)]"
      }
    >
      {items.length === 0 ? (
        <div>
          <h2 className="font-medium text-foreground text-lg">
            Total de compra
          </h2>
          <p className="mt-4 text-muted text-sm leading-6">
            Agrega productos para calcular tu pedido.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          <FreeShippingProgressBar progress={displayedFreeShippingProgress} />

          <CheckoutCouponSection
            appliedCoupon={appliedCoupon}
            couponCode={couponCode}
            couponLoading={couponLoading}
            disabled={items.length === 0}
            onApplyCoupon={onApplyCoupon}
            onCouponCodeChange={onCouponCodeChange}
            onRemoveCoupon={onRemoveCoupon}
          />

          <div className="grid gap-4">
            <h2 className="font-medium text-foreground text-lg">
              Total de compra
            </h2>
            <div className="grid gap-3">
              <SummaryRow label="Subtotal" value={subtotal} />
              {discount > 0 ? (
                <SummaryRow label="Descuento" value={discount} isDiscount />
              ) : null}
              {selectedFulfillmentFamily === "PICKUP" ? (
                <SummaryTextRow label="Entrega" value="Recoger en tienda" />
              ) : shippingLoading || shippingIsPending ? (
                <SummaryLoadingRow label="Envio" />
              ) : shippingAmount === null ? (
                <SummaryTextRow label="Envio" value="Se calcula en el pago" />
              ) : shippingQuote?.freeShippingApplied ? (
                <SummaryTextRow label="Envio" value="Gratis" tone="success" />
              ) : (
                <SummaryRow label="Envio" value={shippingAmount} />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-border border-t pt-4">
            <span className="font-medium text-foreground text-sm">Total</span>
            <span className="font-medium text-2xl text-foreground">
              {formatMoneyCOP(total)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryRow({
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
      <span className="font-normal text-muted">{label}</span>
      <span className="font-medium text-foreground">
        {isDiscount && value > 0 ? "-" : ""}
        {formatMoneyCOP(value)}
      </span>
    </div>
  );
}

function SummaryTextRow({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "success";
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-normal text-muted">{label}</span>
      <span
        className={`text-right font-medium ${
          tone === "success" ? "text-accent" : "text-muted"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryLoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-normal text-muted">{label}</span>
      <span
        aria-hidden="true"
        className="h-4 w-20 animate-pulse rounded-full bg-surface-secondary"
      />
      <span className="sr-only">{label} en calculo</span>
    </div>
  );
}
