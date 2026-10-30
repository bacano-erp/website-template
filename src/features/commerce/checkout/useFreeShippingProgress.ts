"use client";

import type { WebsiteFreeShippingProgress } from "@bacano/sdk";
import { useEffect, useMemo, useState } from "react";
import type { LocalCartItem } from "@/features/commerce/cart/local-cart";
import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

export function useFreeShippingProgress(
  items: LocalCartItem[],
  enabled = true,
) {
  const [result, setResult] = useState<{
    progress: WebsiteFreeShippingProgress | null;
    signature: string;
  } | null>(null);
  const signature = useMemo(
    () =>
      items
        .map((item) => `${item.productVariantId}:${item.quantity}`)
        .sort()
        .join("|"),
    [items],
  );
  const requestItems = useMemo(
    () =>
      items.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      })),
    [items],
  );

  useEffect(() => {
    if (!enabled || requestItems.length === 0) {
      return;
    }

    let isCancelled = false;

    async function loadProgress() {
      try {
        const client = await getBacanoBrowserClient();
        const nextProgress = await client.checkout.getFreeShippingProgress({
          items: requestItems,
        });

        if (!isCancelled) {
          setResult({ progress: nextProgress, signature });
        }
      } catch {
        if (!isCancelled) {
          setResult({ progress: null, signature });
        }
      }
    }

    void loadProgress();

    return () => {
      isCancelled = true;
    };
  }, [enabled, requestItems, signature]);

  if (!enabled || result?.signature !== signature) return null;
  return result.progress;
}
