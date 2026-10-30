/* eslint-disable @next/next/no-img-element -- product images come pre-sized from the Bacano CDN with a srcset, which next/image cannot pass under static export */
import type {
  WebsiteCouponActionResult,
  WebsiteFulfillmentFamily,
  WebsiteShippingQuote,
} from "@bacano/sdk";
import Link from "next/link";
import type { LocalCartItem } from "@/features/commerce/cart/local-cart";
import { formatMoneyCOP } from "@/lib/bacano/formatters";

import { CheckoutCouponSection } from "./CheckoutCouponSection";

export function CheckoutSummary({
  appliedCoupon,
  couponCode,
  couponLoading,
  discount,
  items,
  onApplyCoupon,
  onCouponCodeChange,
  onRemoveCoupon,
  selectedFulfillmentFamily,
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
  items: LocalCartItem[];
  onApplyCoupon: () => void;
  onCouponCodeChange: (value: string) => void;
  onRemoveCoupon: () => void;
  selectedFulfillmentFamily: WebsiteFulfillmentFamily;
  shippingAmount: number | null;
  shippingQuote: WebsiteShippingQuote | null;
  shippingIsPending: boolean;
  shippingLoading: boolean;
  subtotal: number;
  total: number;
}) {
  return (
    <aside className="rounded-lg border border-border bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)] lg:self-start">
      <h2 className="font-medium text-foreground text-lg">
        Resumen del pedido
      </h2>
      {items.length === 0 ? (
        <div className="mt-5 grid gap-4 text-muted text-sm leading-6">
          <p>No hay productos en el carrito.</p>
          <Link href="/catalogo/" className="btn btn-primary">
            Ir al catalogo
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-5">
          {items.map((item) => (
            <CheckoutSummaryItem key={item.id} item={item} />
          ))}

          <CheckoutCouponSection
            appliedCoupon={appliedCoupon}
            couponCode={couponCode}
            couponLoading={couponLoading}
            disabled={items.length === 0}
            onApplyCoupon={onApplyCoupon}
            onCouponCodeChange={onCouponCodeChange}
            onRemoveCoupon={onRemoveCoupon}
          />

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
          <div className="flex items-center justify-between border-border border-t pt-4">
            <span className="font-medium text-foreground text-sm">Total</span>
            <span className="font-medium text-foreground text-xl">
              {formatMoneyCOP(total)}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

function CheckoutSummaryItem({ item }: { item: LocalCartItem }) {
  const price = item.productVariant.pricing.currentPrice;
  const imageSrc = item.productVariant.product.imageSrc;

  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 border-border border-b pb-4 text-sm">
      <div className="relative aspect-square overflow-hidden rounded-md bg-warning-soft">
        {imageSrc ? (
          // biome-ignore lint/performance/noImgElement: CDN srcset; next/image cannot pass one under static export
          <img
            referrerPolicy="no-referrer"
            src={imageSrc}
            srcSet={item.productVariant.product.imageSrcSet ?? undefined}
            alt={item.productVariant.product.name}
            loading="lazy"
            decoding="async"
            width={64}
            height={64}
            sizes="64px"
            className="absolute inset-0 size-full object-cover object-center"
          />
        ) : (
          <div className="grid h-full place-items-center font-medium text-base text-warning">
            {item.productVariant.product.name.charAt(0)}
          </div>
        )}
        <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-foreground px-1 font-medium text-[10px] text-white leading-5">
          {item.quantity}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-normal text-[13px] text-foreground leading-5">
          {getProductSummaryLabel(item)}
        </p>
        <p className="mt-1 font-normal text-muted text-xs">
          {price === null ? "Sin precio" : formatMoneyCOP(price)} c/u
        </p>
      </div>
      <p className="shrink-0 text-right font-medium text-[13px] text-foreground">
        {price === null ? "-" : formatMoneyCOP(price * item.quantity)}
      </p>
    </div>
  );
}

function getProductSummaryLabel(item: LocalCartItem) {
  const attributes = item.productVariant.attributes ?? [];
  const variantText = attributes
    .map((attribute) => `${attribute.name}: ${attribute.value}`)
    .join(" / ");

  return [item.productVariant.product.name, variantText]
    .filter(Boolean)
    .join(" - ");
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
