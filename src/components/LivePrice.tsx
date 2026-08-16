"use client";

import { useProductLiveState } from "@bacano/sdk/react";
import { formatPrice } from "@/lib/bacano";

interface LivePriceProps {
  productVariantId: string;
  /** What the build baked. Rendered until the live answer arrives, and kept if it never does. */
  bakedCurrentPrice: number;
  bakedRegularPrice: number | null;
  bakedHasDiscount: boolean;
}

/**
 * The price, corrected against the ERP after first paint.
 *
 * The baked number is what crawlers index and what a shopper sees instantly,
 * so it stays in the HTML. But a static export is only as fresh as its last
 * build, and two things make a stale price worse than a stale page:
 *
 * The cart is authoritative. It re-validates against the ERP at submit, so a
 * shopper shown one number and charged another is a trust problem, not a
 * freshness problem.
 *
 * And a promotion ends because *time passed*. No row changes, so no rebuild is
 * triggered, and the page keeps advertising a finished sale until something
 * unrelated causes a publish. Reading the price live is the only thing that
 * fixes that — no publishing mechanism can.
 *
 * Falls back silently. If the request fails the shopper keeps the baked price,
 * which is what they would have seen anyway.
 */
export function LivePrice({
  productVariantId,
  bakedCurrentPrice,
  bakedRegularPrice,
  bakedHasDiscount,
}: LivePriceProps) {
  const { data } = useProductLiveState([productVariantId]);

  const live = data?.[0]?.pricing;
  const currentPrice = live?.currentPrice ?? bakedCurrentPrice;
  const regularPrice = live ? live.regularPrice : bakedRegularPrice;
  const hasDiscount = live ? live.hasDiscount : bakedHasDiscount;

  return (
    <p className="mt-4 text-xl">
      <span className="font-semibold">{formatPrice(currentPrice)}</span>
      {hasDiscount && regularPrice != null && (
        <span className="ml-2 text-base text-neutral-400 line-through">
          {formatPrice(regularPrice)}
        </span>
      )}
    </p>
  );
}
