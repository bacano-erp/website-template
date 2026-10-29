"use client";
/* eslint-disable @next/next/no-img-element -- product images come pre-sized from the Bacano CDN with a srcset, which next/image cannot pass under static export */

import type {
  ProductVariantLiveState,
  WebsiteCouponActionResult,
  WebsiteFreeShippingProgress,
  WebsiteFulfillmentFamily,
  WebsiteShippingQuote,
} from "@bacano/sdk";
import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LocalCartItem } from "@/features/commerce/cart/local-cart";
import { normalizePurchasableMaximum } from "@/features/commerce/cart/purchasable-quantity";
import { formatMoneyCOP } from "@/lib/bacano/formatters";
import { getProductVariantUrl } from "@/lib/bacano/urls";

import { CheckoutTotalsPanel } from "./CheckoutTotalsPanel";

export function CheckoutOrderReviewPanel({
  appliedCoupon,
  couponCode,
  couponLoading,
  disabled,
  discount,
  footer,
  items,
  isAvailabilityLoading,
  onApplyCoupon,
  onCouponCodeChange,
  onQuantityChange,
  onRemoveCoupon,
  onRemoveItem,
  selectedFulfillmentFamily,
  freeShippingProgress,
  shippingAmount,
  shippingQuote,
  shippingIsPending,
  shippingLoading,
  subtotal,
  total,
  variantLiveStateById,
}: {
  appliedCoupon: WebsiteCouponActionResult | null;
  couponCode: string;
  couponLoading: boolean;
  disabled: boolean;
  discount: number;
  footer?: ReactNode;
  items: LocalCartItem[];
  isAvailabilityLoading: boolean;
  onApplyCoupon: () => void;
  onCouponCodeChange: (value: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveCoupon: () => void;
  onRemoveItem: (itemId: string) => void;
  selectedFulfillmentFamily: WebsiteFulfillmentFamily;
  freeShippingProgress: WebsiteFreeShippingProgress | null;
  shippingAmount: number | null;
  shippingQuote: WebsiteShippingQuote | null;
  shippingIsPending: boolean;
  shippingLoading: boolean;
  subtotal: number;
  total: number;
  variantLiveStateById: ReadonlyMap<string, ProductVariantLiveState>;
}) {
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <aside className="grid content-start gap-5 rounded-lg border border-border bg-surface-secondary p-3 shadow-[0_18px_44px_rgba(0,0,0,0.05)] sm:p-5">
      <section className="grid gap-3 sm:gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-medium text-base text-foreground sm:text-lg">
            Resumen de tu compra
          </h2>
          <p className="text-muted text-sm">
            {itemCount} producto{itemCount === 1 ? "" : "s"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-md border border-border bg-white px-4 py-4 text-muted text-sm leading-6">
            Agrega productos para completar tu compra.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <CheckoutOrderReviewItem
                key={item.id}
                disabled={disabled}
                item={item}
                isAvailabilityLoading={isAvailabilityLoading}
                onQuantityChange={onQuantityChange}
                onRemoveItem={onRemoveItem}
                variantLiveState={variantLiveStateById.get(
                  item.productVariantId,
                )}
              />
            ))}
          </div>
        )}
      </section>

      <CheckoutTotalsPanel
        appliedCoupon={appliedCoupon}
        couponCode={couponCode}
        couponLoading={couponLoading}
        discount={discount}
        embedded
        items={items}
        selectedFulfillmentFamily={selectedFulfillmentFamily}
        freeShippingProgress={freeShippingProgress}
        shippingAmount={shippingAmount}
        shippingQuote={shippingQuote}
        shippingIsPending={shippingIsPending}
        shippingLoading={shippingLoading}
        subtotal={subtotal}
        total={total}
        onApplyCoupon={onApplyCoupon}
        onCouponCodeChange={onCouponCodeChange}
        onRemoveCoupon={onRemoveCoupon}
      />

      {footer ? <div className="grid gap-3">{footer}</div> : null}
    </aside>
  );
}

function CheckoutOrderReviewItem({
  disabled,
  item,
  isAvailabilityLoading,
  onQuantityChange,
  onRemoveItem,
  variantLiveState,
}: {
  disabled: boolean;
  item: LocalCartItem;
  isAvailabilityLoading: boolean;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  variantLiveState?: ProductVariantLiveState;
}) {
  const price = item.productVariant.pricing.currentPrice;
  const imageSrc = item.productVariant.product.imageSrc;
  const lineTotal = price === null ? null : price * item.quantity;
  const productHref = getProductVariantUrl(
    item.productVariant.product,
    item.productVariantId,
  );
  const maxPurchasableQuantity = normalizePurchasableMaximum(
    variantLiveState?.maxPurchasableQuantity,
  );
  const hasReachedQuantityLimit =
    maxPurchasableQuantity !== null && item.quantity >= maxPurchasableQuantity;

  return (
    <article className="grid grid-cols-[54px_minmax(0,1fr)] items-center gap-3 py-3 sm:grid-cols-[58px_minmax(0,1fr)_auto]">
      <Link
        href={productHref}
        className="relative aspect-square overflow-hidden rounded-md bg-warning-soft"
      >
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
          <span className="grid h-full place-items-center font-medium text-base text-warning">
            {item.productVariant.product.name.charAt(0)}
          </span>
        )}
      </Link>

      <div className="min-w-0">
        <Link
          href={productHref}
          className="font-normal text-foreground text-sm leading-5 transition hover:text-foreground"
        >
          {getProductSummaryLabel(item)}
        </Link>
        <p className="mt-1 text-muted text-xs">
          {price === null ? "Sin precio" : `${formatMoneyCOP(price)} c/u`}
        </p>
        {hasReachedQuantityLimit ? (
          <p
            className={
              maxPurchasableQuantity === 0 ||
              item.quantity > maxPurchasableQuantity
                ? "mt-1 font-semibold text-danger text-xs"
                : "mt-1 font-semibold text-accent text-xs"
            }
          >
            {maxPurchasableQuantity === 0
              ? "Agotado"
              : item.quantity > maxPurchasableQuantity
                ? `Disponible ahora: ${maxPurchasableQuantity}`
                : "Máximo disponible"}
          </p>
        ) : null}
        <div className="mt-2 grid w-[104px] grid-cols-[30px_1fr_30px] overflow-hidden rounded-md border border-border bg-white">
          <button
            type="button"
            disabled={disabled || item.quantity <= 1}
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            className="grid h-8 place-items-center border-border border-r text-muted transition hover:bg-surface-secondary disabled:opacity-35"
            aria-label="Reducir cantidad"
          >
            <Minus aria-hidden="true" size={13} />
          </button>
          <span className="grid h-8 place-items-center font-medium text-foreground text-sm">
            {item.quantity}
          </span>
          <button
            type="button"
            disabled={
              disabled || isAvailabilityLoading || hasReachedQuantityLimit
            }
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="grid h-8 place-items-center border-border border-l text-muted transition hover:bg-surface-secondary disabled:opacity-35"
            aria-label="Aumentar cantidad"
          >
            <Plus aria-hidden="true" size={13} />
          </button>
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-[1fr_auto] items-center gap-2 sm:col-span-1 sm:block sm:justify-items-end">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemoveItem(item.id)}
          className="order-2 grid size-8 place-items-center rounded-full text-danger transition hover:bg-danger-soft disabled:opacity-45 sm:ml-auto"
          aria-label="Eliminar producto"
        >
          <Trash2 aria-hidden="true" size={15} />
        </button>
        <p className="text-left font-medium text-foreground text-sm sm:mt-2 sm:text-right">
          {lineTotal === null ? "Sin precio" : formatMoneyCOP(lineTotal)}
        </p>
      </div>
    </article>
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
