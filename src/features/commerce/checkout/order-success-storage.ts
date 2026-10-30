import type { CheckoutSuccessSnapshot } from "./types";

const ORDER_SUCCESS_STORAGE_PREFIX = "bacano:order-success:v1:";

export function getOrderSuccessPath(orderId: string, token?: string | null) {
  const search = new URLSearchParams({ orderId });
  if (token) search.set("token", token);
  return `/pedido/?${search}`;
}

export function saveOrderSuccessSnapshot(snapshot: CheckoutSuccessSnapshot) {
  if (typeof window === "undefined") return;

  const orderId = snapshot.orderId;
  if (!orderId) return;

  // Safari's private mode throws here. The order is already placed, so losing
  // the local copy only costs the instant success screen; the order page reads
  // it from Bacano instead.
  try {
    window.localStorage.setItem(
      getStorageKey(orderId),
      JSON.stringify({
        ...snapshot,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Nothing to do: see above.
  }
}

export function readOrderSuccessSnapshot(orderId: string) {
  if (typeof window === "undefined") return null;

  try {
    const rawSnapshot = window.localStorage.getItem(getStorageKey(orderId));
    if (!rawSnapshot) return null;
    return JSON.parse(rawSnapshot) as CheckoutSuccessSnapshot & {
      savedAt?: string;
    };
  } catch {
    return null;
  }
}

function getStorageKey(orderId: string) {
  return `${ORDER_SUCCESS_STORAGE_PREFIX}${orderId}`;
}
