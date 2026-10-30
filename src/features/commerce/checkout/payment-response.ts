import type { PublicOrder } from "@bacano/sdk";

export type OrderPaymentStatus = "approved" | "pending" | "failed";

type PollPublicOrderOptions = {
  getOrder: () => Promise<PublicOrder | null>;
  intervalMs?: number;
  timeoutMs?: number;
  /**
   * Lookups that may fail in a row before giving up. A pending order is worth
   * waiting for — the gateway confirms asynchronously — but an API that does
   * not answer will not start answering in the next minute, and a shopper who
   * may already have paid must not watch a spinner meanwhile.
   */
  maxConsecutiveErrors?: number;
  shouldStop?: () => boolean;
  wait?: (milliseconds: number) => Promise<void>;
};

export async function pollPublicOrder({
  getOrder,
  intervalMs = 1500,
  timeoutMs = 45000,
  maxConsecutiveErrors = 3,
  shouldStop = () => false,
  wait = delay,
}: PollPublicOrderOptions): Promise<PublicOrder | null> {
  const attempts = Math.max(1, Math.ceil(timeoutMs / intervalMs) + 1);
  let lastOrder: PublicOrder | null = null;
  let lastError: unknown = null;
  let consecutiveErrors = 0;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (shouldStop()) return null;

    try {
      const order = await getOrder();
      lastError = null;
      consecutiveErrors = 0;

      if (order) {
        lastOrder = order;
      }

      if (order && getOrderPaymentStatus(order) !== "pending") {
        return order;
      }
    } catch (error) {
      lastError = error;
      consecutiveErrors += 1;
      if (consecutiveErrors >= maxConsecutiveErrors) break;
    }

    if (attempt < attempts - 1) {
      await wait(intervalMs);
    }
  }

  if (lastOrder) return lastOrder;
  throw lastError ?? new Error("No pudimos consultar el estado del pago.");
}

export function getOrderPaymentStatus(order: PublicOrder): OrderPaymentStatus {
  switch (order.payment.nextAction) {
    case "NONE":
      return order.paymentStatus === "PAID" ? "approved" : "pending";
    case "RETRY_PAYMENT":
      return "failed";
    case "CREATE_PAYMENT_SESSION":
    case "WAIT_FOR_PAYMENT":
    case "PAY_ON_DELIVERY":
    case "PAY_AT_PICKUP":
    case "WAIT_FOR_ORDER_CONFIRMATION":
      return "pending";
  }

  const sessionStatus = order.payment.session?.status?.toLowerCase() ?? null;

  if (order.paymentStatus === "PAID" || sessionStatus === "approved") {
    return "approved";
  }

  if (
    ["declined", "error", "expired", "cancelled"].includes(sessionStatus ?? "")
  ) {
    return "failed";
  }

  return "pending";
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}
