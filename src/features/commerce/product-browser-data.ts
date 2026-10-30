"use client";

import type {
  BacanoClient,
  Product,
  ProductVariantLiveState,
} from "@bacano/sdk";
import { getProductDetailVariants } from "@bacano/sdk";

import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

type ProductRecommendations = Awaited<
  ReturnType<BacanoClient["catalog"]["getProductRecommendations"]>
>;

type CacheEntry<T> =
  | { expiresAt: number; value: T; promise?: never }
  | { expiresAt: number; promise: Promise<T>; value?: never };

const recommendationsCache = new Map<
  string,
  CacheEntry<ProductRecommendations>
>();
const liveStateCache = new Map<string, CacheEntry<ProductVariantLiveState[]>>();
const MAX_LIVE_VARIANTS_PER_REQUEST = 100;

export async function getProductRecommendationsFromBrowser(
  productId: string,
  limit: number,
) {
  return getCachedValue(
    recommendationsCache,
    `${productId}:${limit}`,
    60_000,
    async () => {
      const client = await getBacanoBrowserClient();
      return client.catalog.getProductRecommendations({ productId, limit });
    },
  );
}

export function mergeProductLiveState(
  product: Product,
  liveState: ProductVariantLiveState[],
) {
  const stateByVariant = new Map(
    liveState.map((state) => [state.productVariantId, state]),
  );
  const mergeVariantPricing = (variant: Product["variants"][number]) => {
    const state = stateByVariant.get(variant.id);
    return state ? { ...variant, pricing: state.pricing } : variant;
  };

  return {
    product: {
      ...product,
      variants: product.variants.map(mergeVariantPricing),
      detailVariants:
        getProductDetailVariants(product).map(mergeVariantPricing),
    },
    availability: liveState.map((state) => ({
      productVariantId: state.productVariantId,
      inStock: state.inStock,
      label: state.availabilityLabel,
      maxPurchasableQuantity: state.maxPurchasableQuantity,
    })),
  };
}

export async function getProductLiveStateFromBrowser(
  variantIds: string[],
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
) {
  const uniqueIds = [...new Set(variantIds)].sort();
  if (uniqueIds.length === 0) return [];

  const groups = Array.from(
    { length: Math.ceil(uniqueIds.length / MAX_LIVE_VARIANTS_PER_REQUEST) },
    (_, index) =>
      uniqueIds.slice(
        index * MAX_LIVE_VARIANTS_PER_REQUEST,
        (index + 1) * MAX_LIVE_VARIANTS_PER_REQUEST,
      ),
  );
  const client = await getBacanoBrowserClient();
  const results = await Promise.all(
    groups.map((ids) => {
      const cacheKey = ids.join(",");
      if (forceRefresh) liveStateCache.delete(cacheKey);

      return getCachedValue(liveStateCache, cacheKey, 15_000, () =>
        client.catalog.getProductLiveState(ids),
      );
    }),
  );

  return results.flat();
}

function getCachedValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
) {
  const cached = cache.get(key);
  if (cached?.promise) return cached.promise;
  if (cached && cached.expiresAt > Date.now())
    return Promise.resolve(cached.value);
  if (cached) cache.delete(key);

  const promise = load()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, { promise, expiresAt: Date.now() + ttlMs });
  return promise;
}
