"use client";
/* eslint-disable @next/next/no-img-element -- product images come pre-sized from the Bacano CDN with a srcset, which next/image cannot pass under static export */

import { useOverlayState } from "@heroui/react";
import { Drawer } from "@heroui/react/drawer";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/features/commerce/cart/CartProvider";
import type { LocalCartItem } from "@/features/commerce/cart/local-cart";
import { normalizePurchasableMaximum } from "@/features/commerce/cart/purchasable-quantity";
import { FreeShippingProgressBar } from "@/features/commerce/checkout/FreeShippingProgressBar";
import { useFreeShippingProgress } from "@/features/commerce/checkout/useFreeShippingProgress";
import { formatMoneyCOP } from "@/lib/bacano/formatters";
import { getProductVariantUrl } from "@/lib/bacano/urls";

export function CartDrawer() {
  const [quantityLimitNotice, setQuantityLimitNotice] = useState<{
    attempt: number;
    itemId: string;
  } | null>(null);
  const {
    cart,
    closeCart,
    error,
    isAvailabilityLoading,
    isLoading,
    isOpen,
    setItemQuantity,
    removeItem,
    variantLiveStateById,
  } = useCart();
  const state = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (!open) closeCart();
    },
  });
  const items = cart?.items ?? [];
  const freeShippingProgress = useFreeShippingProgress(items, isOpen);

  useEffect(() => {
    if (!quantityLimitNotice) return undefined;

    const timeout = window.setTimeout(() => {
      setQuantityLimitNotice(null);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [quantityLimitNotice]);

  return (
    <Drawer state={state}>
      <Drawer.Trigger aria-hidden="true" className="hidden" type="button" />
      <Drawer.Backdrop className="cart-drawer-backdrop fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]">
        <Drawer.Content
          placement="right"
          className="fixed inset-0 z-50 h-dvh w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 shadow-none outline-none ring-0"
        >
          <Drawer.Dialog className="ml-auto flex h-full w-[min(94vw,430px)] flex-col overflow-hidden rounded-l-2xl border-0 bg-white p-0 shadow-[-18px_0_44px_rgba(0,0,0,0.16)] outline-none ring-0">
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center text-accent">
                  <ShoppingBag aria-hidden="true" size={24} />
                </span>
                <Drawer.Heading className="font-medium text-[21px] text-foreground leading-7">
                  Mi Carrito
                </Drawer.Heading>
              </div>
              <button
                type="button"
                aria-label="Cerrar carrito"
                onClick={closeCart}
                className="grid size-8 shrink-0 place-items-center border-0 bg-transparent p-0 text-muted shadow-none transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                <X aria-hidden="true" size={22} />
              </button>
            </div>

            <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-5 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
              {error ? (
                <div className="mb-4 rounded-md border border-danger-soft bg-danger-soft px-4 py-3 font-semibold text-danger text-sm">
                  {error}
                </div>
              ) : null}

              {items.length === 0 ? (
                <div className="grid h-full content-center justify-items-center gap-4 text-center">
                  <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
                    <ShoppingBag aria-hidden="true" size={28} />
                  </span>
                  <div>
                    <h2 className="font-black text-foreground text-xl">
                      Tu carrito esta vacio
                    </h2>
                    <p className="mt-2 max-w-64 text-muted text-sm leading-6">
                      Agrega productos para continuar al checkout.
                    </p>
                  </div>
                  <Link
                    href="/catalogo/"
                    onClick={closeCart}
                    className="btn btn-primary"
                    aria-label="Ir al catalogo"
                  >
                    Ver catalogo
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map((item) => {
                    const price = item.productVariant.pricing.currentPrice;
                    const lineTotal =
                      price === null ? null : price * item.quantity;
                    const imageSrc = item.productVariant.product.imageSrc;
                    const productHref = getProductVariantUrl(
                      item.productVariant.product,
                      item.productVariantId,
                    );
                    const maxPurchasableQuantity = normalizePurchasableMaximum(
                      variantLiveStateById.get(item.productVariantId)
                        ?.maxPurchasableQuantity,
                    );
                    const hasReachedQuantityLimit =
                      maxPurchasableQuantity !== null &&
                      item.quantity >= maxPurchasableQuantity;

                    return (
                      <article
                        key={item.id}
                        className="grid grid-cols-[74px_1fr] gap-3 rounded-lg border border-border bg-white p-3 shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
                      >
                        <Link
                          href={productHref}
                          onClick={closeCart}
                          className="relative aspect-[4/5] overflow-hidden rounded-md bg-warning-soft"
                          aria-label={`Ver ${item.productVariant.product.name}`}
                        >
                          {imageSrc ? (
                            // biome-ignore lint/performance/noImgElement: CDN srcset; next/image cannot pass one under static export
                            <img
                              referrerPolicy="no-referrer"
                              src={imageSrc}
                              srcSet={
                                item.productVariant.product.imageSrcSet ??
                                undefined
                              }
                              alt={item.productVariant.product.name}
                              loading="lazy"
                              decoding="async"
                              width={74}
                              height={93}
                              sizes="74px"
                              className="absolute inset-0 size-full object-cover object-center"
                            />
                          ) : (
                            <div className="grid h-full place-items-center font-medium text-lg text-warning">
                              {item.productVariant.product.name.charAt(0)}
                            </div>
                          )}
                        </Link>
                        <div className="grid min-w-0 content-between gap-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="line-clamp-2 font-medium text-[13px] text-foreground leading-[18px]">
                              <Link href={productHref} onClick={closeCart}>
                                {item.productVariant.product.name}
                              </Link>
                            </h3>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => void removeItem(item.id)}
                              className="grid size-7 shrink-0 place-items-center rounded-full text-danger transition hover:bg-danger-soft disabled:opacity-45"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 aria-hidden="true" size={15} />
                            </button>
                          </div>
                          <VariantSummary item={item} />
                          <div className="flex items-end justify-between gap-3">
                            <div className="relative">
                              {quantityLimitNotice?.itemId === item.id ? (
                                <div
                                  role="status"
                                  className="absolute bottom-[calc(100%+8px)] left-0 z-10 w-max max-w-52 rounded-md bg-foreground px-3 py-2 font-semibold text-white text-xs leading-4 shadow-lg"
                                >
                                  {getQuantityLimitMessage(
                                    item.quantity,
                                    maxPurchasableQuantity,
                                  )}
                                  <span
                                    aria-hidden="true"
                                    className="absolute top-full left-[82px] border-x-4 border-x-transparent border-t-4 border-t-foreground"
                                  />
                                </div>
                              ) : null}
                              <div className="grid h-8 grid-cols-[30px_36px_30px] overflow-hidden rounded-md border border-border bg-white">
                                <button
                                  type="button"
                                  disabled={isLoading || item.quantity <= 1}
                                  onClick={() =>
                                    void setItemQuantity(
                                      item.id,
                                      item.quantity - 1,
                                    )
                                  }
                                  className="grid place-items-center border-border border-r text-muted transition hover:bg-surface-secondary disabled:opacity-35"
                                  aria-label="Reducir cantidad"
                                >
                                  <Minus aria-hidden="true" size={14} />
                                </button>
                                <span className="grid place-items-center font-medium text-foreground text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={isLoading || isAvailabilityLoading}
                                  aria-disabled={hasReachedQuantityLimit}
                                  onClick={() => {
                                    if (hasReachedQuantityLimit) {
                                      setQuantityLimitNotice({
                                        attempt: Date.now(),
                                        itemId: item.id,
                                      });
                                      return;
                                    }

                                    void setItemQuantity(
                                      item.id,
                                      item.quantity + 1,
                                    );
                                  }}
                                  className={`grid place-items-center border-border border-l text-muted transition disabled:opacity-35 ${
                                    hasReachedQuantityLimit
                                      ? "cursor-not-allowed opacity-45"
                                      : "hover:bg-surface-secondary"
                                  }`}
                                  aria-label="Aumentar cantidad"
                                >
                                  <Plus aria-hidden="true" size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="font-medium text-[14px] text-foreground">
                              {lineTotal === null
                                ? "Sin precio"
                                : formatMoneyCOP(lineTotal)}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </Drawer.Body>

            {items.length > 0 ? (
              <Drawer.Footer className="px-5 pt-4 pb-5">
                <div className="grid w-full gap-4">
                  <FreeShippingProgressBar
                    progress={freeShippingProgress}
                    variant="compact"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted text-sm">
                      Total
                    </span>
                    <span className="font-medium text-foreground text-xl">
                      {formatMoneyCOP(cart?.totals.total ?? 0)}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    <Link
                      href="/checkout"
                      onClick={closeCart}
                      className="btn btn-cart w-full"
                    >
                      Ir a pagar
                    </Link>
                  </div>
                </div>
              </Drawer.Footer>
            ) : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

function getQuantityLimitMessage(quantity: number, maximum: number | null) {
  if (maximum === 0) return "Esta variante está agotada.";
  if (maximum === 1 && quantity === 1) {
    return "Es la última unidad disponible.";
  }
  if (maximum !== null && quantity > maximum) {
    return `Solo hay ${maximum} unidades disponibles.`;
  }

  return "Ya agregaste todas las unidades disponibles.";
}

function VariantSummary({ item }: { item: LocalCartItem }) {
  const attributes = item.productVariant.attributes ?? [];
  if (attributes.length === 0) return null;

  return (
    <p className="-mt-1 line-clamp-1 font-normal text-muted text-xs">
      {attributes
        .map((attribute) => `${attribute.name}: ${attribute.value}`)
        .join(" · ")}
    </p>
  );
}
