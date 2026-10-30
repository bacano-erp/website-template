import type { ProductVariantPricing } from "@bacano/sdk";

import { hasCurrentPrice } from "@/lib/bacano/formatters";

export const LOCAL_CART_STORAGE_KEY = "bacano:local-cart:v1";

export type LocalCartVariantAttribute = {
  name: string;
  value: string;
};

export type LocalCartItemInput = {
  productVariantId: string;
  productId: string;
  productSlug?: string | null;
  productName: string;
  productImageSrc?: string | null;
  productImageSrcSet?: string | null;
  sku: string;
  pricing: ProductVariantPricing;
  variantAttributes?: LocalCartVariantAttribute[];
};

export type LocalCartItem = {
  id: string;
  productVariantId: string;
  quantity: number;
  productVariant: {
    sku: string;
    product: {
      id: string;
      imageSrc?: string | null;
      imageSrcSet?: string | null;
      name: string;
      slug?: string | null;
    };
    pricing: ProductVariantPricing;
    attributes: LocalCartVariantAttribute[];
  };
};

export type LocalCart = {
  id: "local-cart";
  items: LocalCartItem[];
  totals: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  status: "LOCAL";
  createdAt: string;
  updatedAt: string;
};

export function readLocalCart(): LocalCart | null {
  if (typeof window === "undefined") return null;

  try {
    const rawCart = window.localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    if (!rawCart) return null;

    return normalizeCart(JSON.parse(rawCart) as LocalCart);
  } catch {
    return null;
  }
}

export function writeLocalCart(cart: LocalCart | null) {
  if (typeof window === "undefined") return;

  // Storage can be unavailable (Safari private mode throws). The cart then
  // lives only in memory for this tab, which beats a page that throws.
  try {
    if (!cart || cart.items.length === 0) {
      window.localStorage.removeItem(LOCAL_CART_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // See above.
  }
}

export function addLocalCartItem(
  cart: LocalCart | null,
  input: LocalCartItemInput,
  quantity: number,
) {
  const safeQuantity = normalizeQuantity(quantity);
  const currentCart = cart ?? createEmptyCart();
  const existingItem = currentCart.items.find(
    (item) => item.productVariantId === input.productVariantId,
  );

  const nextItems = existingItem
    ? currentCart.items.map((item) =>
        item.id === existingItem.id
          ? {
              ...item,
              quantity: item.quantity + safeQuantity,
              productVariant: {
                ...item.productVariant,
                product: {
                  ...item.productVariant.product,
                  imageSrc:
                    item.productVariant.product.imageSrc ??
                    input.productImageSrc ??
                    null,
                  imageSrcSet:
                    item.productVariant.product.imageSrcSet ??
                    input.productImageSrcSet ??
                    null,
                  slug:
                    item.productVariant.product.slug ??
                    input.productSlug ??
                    null,
                },
                attributes:
                  item.productVariant.attributes?.length > 0
                    ? item.productVariant.attributes
                    : normalizeVariantAttributes(input.variantAttributes),
              },
            }
          : item,
      )
    : [
        ...currentCart.items,
        {
          id: input.productVariantId,
          productVariantId: input.productVariantId,
          quantity: safeQuantity,
          productVariant: {
            sku: input.sku,
            product: {
              id: input.productId,
              imageSrc: input.productImageSrc ?? null,
              imageSrcSet: input.productImageSrcSet ?? null,
              name: input.productName,
              slug: input.productSlug ?? null,
            },
            pricing: input.pricing,
            attributes: normalizeVariantAttributes(input.variantAttributes),
          },
        },
      ];

  return normalizeCart({
    ...currentCart,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  });
}

export function setLocalCartItemQuantity(
  cart: LocalCart | null,
  itemId: string,
  quantity: number,
) {
  if (!cart) return null;

  const nextItems =
    quantity <= 0
      ? cart.items.filter((item) => item.id !== itemId)
      : cart.items.map((item) =>
          item.id === itemId
            ? { ...item, quantity: normalizeQuantity(quantity) }
            : item,
        );

  if (nextItems.length === 0) return null;

  return normalizeCart({
    ...cart,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  });
}

export function removeLocalCartItem(cart: LocalCart | null, itemId: string) {
  if (!cart) return null;

  const nextItems = cart.items.filter((item) => item.id !== itemId);
  if (nextItems.length === 0) return null;

  return normalizeCart({
    ...cart,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  });
}

function createEmptyCart(): LocalCart {
  const now = new Date().toISOString();

  return {
    id: "local-cart",
    items: [],
    totals: {
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
    },
    status: "LOCAL",
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeCart(cart: LocalCart) {
  const items = (cart.items ?? [])
    .filter(
      (item) =>
        item.productVariantId &&
        item.quantity > 0 &&
        hasCurrentPrice(item.productVariant.pricing),
    )
    .map((item) => ({
      ...item,
      id: item.id || item.productVariantId,
      quantity: normalizeQuantity(item.quantity),
      productVariant: {
        ...item.productVariant,
        attributes: normalizeVariantAttributes(item.productVariant.attributes),
      },
    }));

  if (items.length === 0) return null;

  const subtotal = items.reduce((total, item) => {
    return (
      total + (item.productVariant.pricing.currentPrice ?? 0) * item.quantity
    );
  }, 0);

  return {
    id: "local-cart",
    items,
    totals: {
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
    },
    status: "LOCAL",
    createdAt: cart.createdAt || new Date().toISOString(),
    updatedAt: cart.updatedAt || new Date().toISOString(),
  } satisfies LocalCart;
}

function normalizeQuantity(quantity: number) {
  return Math.max(1, Math.floor(Number(quantity) || 1));
}

function normalizeVariantAttributes(
  attributes: LocalCartVariantAttribute[] | null | undefined,
) {
  return (attributes ?? [])
    .map((attribute) => ({
      name: attribute.name.trim(),
      value: attribute.value.trim(),
    }))
    .filter((attribute) => attribute.name && attribute.value);
}
