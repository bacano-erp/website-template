import { browserSiteUrl } from "@/lib/site-url";

/**
 * The trip through the payment gateway, and getting the shopper back.
 *
 * A hosted payment redirect takes the shopper out of the site and returns them
 * to `/pago/respuesta/`, where two things are true at once: the order exists,
 * and its payment status is not settled yet. Everything here exists to make
 * that moment survivable.
 */

/**
 * Where `createPaymentSession` should send the shopper back to.
 *
 * Runs in the browser, so it can fall back to the origin the shopper is
 * actually on rather than guessing — see `browserSiteUrl`. Never localhost in a
 * published store: a gateway sent there loses a shopper who has already paid.
 */
export function buildPaymentReturnUrl(): string {
  return `${browserSiteUrl()}/pago/respuesta/`;
}

/** The order page for a public (guest) order. */
export function buildOrderPath(orderId: string, token?: string | null): string {
  const search = new URLSearchParams({ orderId });
  if (token) search.set("token", token);
  return `/pedido/?${search}`;
}

/**
 * The parameters a gateway hands back, under whichever names it happens to use.
 *
 * Providers disagree about this, and a storefront that only reads `orderId`
 * loses the order for every provider that calls it `reference`. Reading the
 * known aliases costs nothing and turns a dead end into a working return.
 */
export interface PaymentReturnParams {
  orderId: string | null;
  token: string | null;
  paymentSessionId: string | null;
  gatewayTransactionId: string | null;
}

export function readPaymentReturnParams(
  params: URLSearchParams,
): PaymentReturnParams {
  const read = (...names: string[]): string | null => {
    for (const name of names) {
      const value = params.get(name);
      if (value) return value;
    }
    return null;
  };

  return {
    orderId: read("orderId", "order_id", "order", "reference", "reference_id"),
    token: read("token", "publicOrderToken", "public_order_token"),
    paymentSessionId: read(
      "paymentSessionId",
      "payment_session_id",
      "payment_session",
      "sessionId",
    ),
    gatewayTransactionId: read(
      "id",
      "transactionId",
      "transaction_id",
      "x_transaction_id",
    ),
  };
}

/**
 * The shopper's own copy of what they just bought.
 *
 * The order lives in the ERP, but reaching it needs the token that came back
 * in the URL — and shoppers close tabs, lose the redirect, or return from
 * their bank an hour later. Keeping the pair locally means "where is my
 * order?" has an answer that does not depend on the URL surviving.
 *
 * Guest orders only. A signed-in buyer has `client.orders.list()`.
 */
const ORDER_STORAGE_PREFIX = "bacano:order:v1:";

export interface StoredOrderReference {
  orderId: string;
  token: string | null;
  savedAt: string;
}

export function saveOrderReference(
  orderId: string,
  token: string | null,
): void {
  if (typeof window === "undefined" || !orderId) return;

  try {
    window.localStorage.setItem(
      `${ORDER_STORAGE_PREFIX}${orderId}`,
      JSON.stringify({
        orderId,
        token,
        savedAt: new Date().toISOString(),
      } satisfies StoredOrderReference),
    );
  } catch {
    // Private browsing and full quotas both throw here. The order is already
    // placed; losing this copy costs convenience, not money.
  }
}

export function readOrderReference(
  orderId: string,
): StoredOrderReference | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(
      `${ORDER_STORAGE_PREFIX}${orderId}`,
    );
    return raw ? (JSON.parse(raw) as StoredOrderReference) : null;
  } catch {
    return null;
  }
}

/**
 * What the shopper is told, derived from the order rather than the gateway.
 *
 * The gateway's answer describes one attempt; the order describes the purchase.
 * Bacano reconciles them, so this reads the order — a shopper whose card was
 * charged must not be told the payment failed because a redirect carried a
 * stale status.
 */
export type PaymentOutcome = "approved" | "pending" | "failed";

export function readPaymentOutcome(paymentStatus: string): PaymentOutcome {
  const status = paymentStatus.toUpperCase();

  if (["PAID", "APPROVED", "CAPTURED", "COMPLETED"].includes(status)) {
    return "approved";
  }

  if (
    ["DECLINED", "REJECTED", "FAILED", "CANCELLED", "VOIDED"].includes(status)
  ) {
    return "failed";
  }

  // Everything else — PENDING, IN_PROGRESS, an unknown provider status — is
  // pending on purpose. Cash on delivery and bank transfer live here for their
  // whole life, and so does a card still being reviewed.
  return "pending";
}
