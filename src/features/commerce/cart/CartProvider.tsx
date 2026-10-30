"use client";

import type {
  Cart as BacanoCart,
  CheckoutResult,
  ProductVariantLiveState,
  WebsiteFulfillmentFamily,
  WebsiteGuestContact,
} from "@bacano/sdk";
import { useMarketing } from "@bacano/sdk/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addLocalCartItem,
  type LocalCart,
  type LocalCartItem,
  type LocalCartItemInput,
  readLocalCart,
  removeLocalCartItem,
  setLocalCartItemQuantity,
  writeLocalCart,
} from "@/features/commerce/cart/local-cart";
import {
  exceedsPurchasableMaximum,
  normalizePurchasableMaximum,
} from "@/features/commerce/cart/purchasable-quantity";
import { createSerializedTaskQueue } from "@/features/commerce/cart/serialized-task-queue";
import { getProductLiveStateFromBrowser } from "@/features/commerce/product-browser-data";
import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";
import { getPrimaryImage } from "@/lib/bacano/formatters";

type CartContextValue = {
  cart: LocalCart | null;
  checkoutDraft: CheckoutDraft | null;
  error: string | null;
  isLoading: boolean;
  isAvailabilityLoading: boolean;
  isOpen: boolean;
  itemCount: number;
  variantLiveStateById: ReadonlyMap<string, ProductVariantLiveState>;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  refreshAvailability: (forceRefresh?: boolean) => Promise<void>;
  addVariant: (
    item: LocalCartItemInput,
    quantity: number,
    maxPurchasableQuantity?: number,
  ) => Promise<void>;
  setItemQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  startCheckout: (
    contact: WebsiteGuestContact,
    fulfillmentFamily?: WebsiteFulfillmentFamily,
  ) => Promise<CheckoutDraft>;
  submitCheckout: (
    contact?: WebsiteGuestContact,
    fulfillmentFamily?: WebsiteFulfillmentFamily,
  ) => Promise<CheckoutResult>;
};

export type CheckoutDraft = {
  orderId: string;
  status: string;
  total: number;
  itemCount: number;
  contact: WebsiteGuestContact;
  updatedAt: string;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  disabled = false,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  const marketing = useMarketing();
  const availabilityRequestIdRef = useRef(0);
  const lastBeginCheckoutOrderRef = useRef<string | null>(null);
  const checkoutStartQueueRef = useRef(createSerializedTaskQueue());
  const [cart, setCart] = useState<LocalCart | null>(null);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [variantLiveStateById, setVariantLiveStateById] = useState<
    ReadonlyMap<string, ProductVariantLiveState>
  >(new Map());

  const itemCount = useMemo(
    () =>
      cart?.items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      ) ?? 0,
    [cart],
  );

  const refreshCartLiveState = useCallback(
    async (cartSnapshot: LocalCart | null, forceRefresh = false) => {
      const variantIds = [
        ...new Set(
          (cartSnapshot?.items ?? []).map((item) => item.productVariantId),
        ),
      ];

      if (variantIds.length === 0) {
        setVariantLiveStateById(new Map());
        return new Map<string, ProductVariantLiveState>();
      }

      const requestId = ++availabilityRequestIdRef.current;
      setIsAvailabilityLoading(true);

      try {
        const liveState = await getProductLiveStateFromBrowser(variantIds, {
          forceRefresh,
        });
        const nextState = new Map(
          liveState.map((state) => [state.productVariantId, state]),
        );

        if (availabilityRequestIdRef.current === requestId) {
          setVariantLiveStateById(nextState);
        }

        return nextState;
      } catch {
        if (availabilityRequestIdRef.current === requestId) {
          setVariantLiveStateById(new Map());
        }
        return null;
      } finally {
        if (availabilityRequestIdRef.current === requestId) {
          setIsAvailabilityLoading(false);
        }
      }
    },
    [],
  );

  const openCart = useCallback(() => {
    const currentCart = readLocalCart();
    setCart(currentCart);
    setIsOpen(true);
    void refreshCartLiveState(currentCart, true);
    if (currentCart) {
      marketing.track({
        eventName: "view_cart",
        value: currentCart.totals.total,
        items: currentCart.items.map(toMarketingItem),
      });
    }
  }, [marketing, refreshCartLiveState]);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const clearCart = useCallback(() => {
    writeLocalCart(null);
    setCart(null);
    setCheckoutDraft(null);
    setVariantLiveStateById(new Map());
    setIsOpen(false);
  }, []);

  const isLoading = isHydrating || isSubmitting;

  const refreshCart = useCallback(async () => {
    setError(null);
    setCart(readLocalCart());
  }, []);

  const refreshAvailability = useCallback(
    async (forceRefresh = false) => {
      await refreshCartLiveState(readLocalCart(), forceRefresh);
    },
    [refreshCartLiveState],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!disabled) setCart(readLocalCart());
      setIsHydrating(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    if (
      !cart?.items.some(
        (item) =>
          !item.productVariant.product.imageSrc ||
          !item.productVariant.product.slug,
      )
    ) {
      return;
    }

    const cartSnapshot = cart;
    let isCancelled = false;

    async function hydrateMissingProductDetails() {
      try {
        const client = await getBacanoBrowserClient();
        const productIds = [
          ...new Set(
            cartSnapshot.items
              .filter(
                (item) =>
                  !item.productVariant.product.imageSrc ||
                  !item.productVariant.product.slug,
              )
              .map((item) => item.productVariant.product.id),
          ),
        ];
        const productDetails = new Map<
          string,
          { imageSrc: string | null; slug: string | null }
        >();

        await Promise.all(
          productIds.map(async (productId) => {
            const product = await client.catalog.getProduct(productId);
            if (!product) return;

            productDetails.set(productId, {
              imageSrc: getPrimaryImage(product),
              slug: product.slug,
            });
          }),
        );

        if (isCancelled) return;

        let didHydrate = false;
        const nextCart = {
          ...cartSnapshot,
          items: cartSnapshot.items.map((item) => {
            const details = productDetails.get(item.productVariant.product.id);
            if (!details) return item;

            const imageSrc =
              item.productVariant.product.imageSrc ?? details.imageSrc;
            const slug = item.productVariant.product.slug ?? details.slug;
            if (
              imageSrc === item.productVariant.product.imageSrc &&
              slug === item.productVariant.product.slug
            ) {
              return item;
            }

            didHydrate = true;
            return {
              ...item,
              productVariant: {
                ...item.productVariant,
                product: {
                  ...item.productVariant.product,
                  imageSrc,
                  slug,
                },
              },
            };
          }),
        };

        if (didHydrate) {
          writeLocalCart(nextCart);
          setCart(nextCart);
        }
      } catch {
        // Missing thumbnails should never block cart usage.
      }
    }

    void hydrateMissingProductDetails();

    return () => {
      isCancelled = true;
    };
  }, [cart, disabled]);

  const addVariant = useCallback(
    async (
      item: LocalCartItemInput,
      quantity: number,
      maxPurchasableQuantity?: number,
    ) => {
      setError(null);

      try {
        const currentCart = readLocalCart();
        const currentQuantity =
          currentCart?.items.find(
            (cartItem) => cartItem.productVariantId === item.productVariantId,
          )?.quantity ?? 0;
        const maximum = normalizePurchasableMaximum(maxPurchasableQuantity);

        if (
          maximum !== null &&
          currentQuantity + Math.max(1, Math.floor(quantity)) > maximum
        ) {
          throw new Error(
            maximum === 0
              ? "Esta variante está agotada."
              : `Máximo disponible: ${maximum} unidades.`,
          );
        }

        const nextCart = addLocalCartItem(currentCart, item, quantity);
        writeLocalCart(nextCart);
        setCart(nextCart);
        setCheckoutDraft(null);
        setIsOpen(true);
        void refreshCartLiveState(nextCart, true);
        marketing.track({
          eventName: "add_to_cart",
          value: (item.pricing.currentPrice ?? 0) * quantity,
          items: [
            {
              itemId: item.productVariantId,
              itemName: item.productName,
              sku: item.sku,
              price: item.pricing.currentPrice,
              quantity,
              itemVariant: item.variantAttributes
                ?.map((attribute) => attribute.value)
                .join(" / "),
            },
          ],
        });
      } catch (caught) {
        setError(getErrorMessage(caught));
        setIsOpen(true);
        throw caught;
      }
    },
    [marketing, refreshCartLiveState],
  );

  const setItemQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      setError(null);

      try {
        const previousCart = readLocalCart();
        const previousItem = previousCart?.items.find(
          (item) => item.id === cartItemId,
        );
        const maximum = normalizePurchasableMaximum(
          previousItem
            ? variantLiveStateById.get(previousItem.productVariantId)
                ?.maxPurchasableQuantity
            : undefined,
        );
        const isIncreasing =
          previousItem !== undefined && quantity > previousItem.quantity;
        if (isIncreasing && maximum !== null && quantity > maximum) {
          setError(`Máximo disponible: ${maximum} unidades.`);
          return;
        }
        const nextCart = setLocalCartItemQuantity(
          previousCart,
          cartItemId,
          quantity,
        );
        writeLocalCart(nextCart);
        setCart(nextCart);
        setCheckoutDraft(null);
        if (previousItem && previousItem.quantity !== quantity) {
          marketing.track({
            eventName:
              quantity > previousItem.quantity
                ? "add_to_cart"
                : "remove_from_cart",
            items: [
              toMarketingItem({
                ...previousItem,
                quantity: Math.abs(quantity - previousItem.quantity),
              }),
            ],
          });
        }
      } catch (caught) {
        setError(getErrorMessage(caught));
      }
    },
    [marketing, variantLiveStateById],
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      setError(null);

      try {
        const previousCart = readLocalCart();
        const removedItem = previousCart?.items.find(
          (item) => item.id === cartItemId,
        );
        const nextCart = removeLocalCartItem(previousCart, cartItemId);
        writeLocalCart(nextCart);
        setCart(nextCart);
        setCheckoutDraft(null);
        if (removedItem) {
          marketing.track({
            eventName: "remove_from_cart",
            items: [toMarketingItem(removedItem)],
          });
        }
      } catch (caught) {
        setError(getErrorMessage(caught));
      }
    },
    [marketing],
  );

  const startCheckoutUnserialized = useCallback(
    async (
      contact: WebsiteGuestContact,
      fulfillmentFamily: WebsiteFulfillmentFamily = "SHIPPING",
    ) => {
      setError(null);
      setIsSubmitting(true);

      try {
        const currentCart = readLocalCart();
        if (!currentCart || currentCart.items.length === 0) {
          throw new Error("Tu carrito esta vacio.");
        }

        const liveState = await refreshCartLiveState(currentCart);
        if (liveState) {
          const invalidItem = currentCart.items.find((item) =>
            exceedsPurchasableMaximum(
              item.quantity,
              liveState.get(item.productVariantId)?.maxPurchasableQuantity,
            ),
          );

          if (invalidItem) {
            const maximum =
              liveState.get(invalidItem.productVariantId)
                ?.maxPurchasableQuantity ?? 0;
            throw new Error(
              maximum === 0
                ? `${invalidItem.productVariant.product.name} está agotado.`
                : `Ajusta ${invalidItem.productVariant.product.name}. Máximo disponible: ${maximum} unidades.`,
            );
          }
        }

        const normalizedContact = normalizeContact(contact);
        if (!normalizedContact.email && !normalizedContact.phone) {
          throw new Error(
            "Dejanos un correo o WhatsApp para confirmar tu pedido.",
          );
        }

        const client = await getBacanoBrowserClient();

        const bacanoCart = await client.cart.startCheckout({
          contact: normalizedContact,
          fulfillmentFamily,
          items: currentCart.items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
          marketingAttribution: marketing.getAttribution() ?? undefined,
        });

        const draft = createCheckoutDraft(bacanoCart, normalizedContact);
        setCheckoutDraft(draft);
        if (lastBeginCheckoutOrderRef.current !== bacanoCart.id) {
          lastBeginCheckoutOrderRef.current = bacanoCart.id;
          marketing.track({
            eventName: "begin_checkout",
            value: currentCart.totals.total,
            items: currentCart.items.map(toMarketingItem),
          });
        }
        return draft;
      } catch (caught) {
        const message = getErrorMessage(caught);
        setError(message);
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [marketing, refreshCartLiveState],
  );

  const startCheckout = useCallback(
    (
      contact: WebsiteGuestContact,
      fulfillmentFamily: WebsiteFulfillmentFamily = "SHIPPING",
    ) =>
      checkoutStartQueueRef.current(() =>
        startCheckoutUnserialized(contact, fulfillmentFamily),
      ),
    [startCheckoutUnserialized],
  );

  const submitCheckout = useCallback(
    async (
      contact?: WebsiteGuestContact,
      fulfillmentFamily: WebsiteFulfillmentFamily = "SHIPPING",
    ) => {
      setError(null);
      setIsSubmitting(true);

      try {
        const normalizedContact = normalizeContact(
          contact ?? checkoutDraft?.contact ?? {},
        );
        if (!normalizedContact.email && !normalizedContact.phone) {
          throw new Error(
            "Dejanos un correo o WhatsApp para confirmar tu pedido.",
          );
        }

        const client = await getBacanoBrowserClient();
        const result = await client.checkout.submit({
          contact: normalizedContact,
          fulfillmentFamily,
          marketingAttribution: marketing.getAttribution() ?? undefined,
        });

        if (result.success) {
          writeLocalCart(null);
          setCart(null);
          setCheckoutDraft(null);
          setIsOpen(false);
        }
        return result;
      } catch (caught) {
        const message = getErrorMessage(caught);
        setError(message);
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [checkoutDraft, marketing],
  );

  const value: CartContextValue = {
    cart,
    checkoutDraft,
    error,
    isAvailabilityLoading,
    isLoading,
    isOpen,
    itemCount,
    variantLiveStateById,
    openCart,
    closeCart,
    clearCart,
    refreshCart,
    refreshAvailability,
    addVariant,
    setItemQuantity,
    removeItem,
    startCheckout,
    submitCheckout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No fue posible sincronizar el carrito.";
}

function normalizeContact(contact: WebsiteGuestContact) {
  return {
    firstName: contact.firstName?.trim() || undefined,
    lastName: contact.lastName?.trim() || undefined,
    name: contact.name?.trim() || undefined,
    email: contact.email?.trim() || undefined,
    cellphone: contact.cellphone?.trim() || undefined,
    phone: contact.phone?.trim() || undefined,
    address: contact.address,
  };
}

function createCheckoutDraft(
  cart: BacanoCart,
  contact: WebsiteGuestContact,
): CheckoutDraft {
  return {
    orderId: cart.id,
    status: cart.status,
    total: cart.totals.total,
    itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
    contact,
    updatedAt: cart.updatedAt,
  };
}

function toMarketingItem(item: LocalCartItem) {
  return {
    itemId: item.productVariantId,
    itemName: item.productVariant.product.name,
    sku: item.productVariant.sku,
    price: item.productVariant.pricing.currentPrice,
    quantity: item.quantity,
    itemVariant: item.productVariant.attributes
      .map((attribute) => attribute.value)
      .join(" / "),
  };
}
