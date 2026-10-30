import type { PublicOrder } from "@bacano/sdk";
import { expect, test } from "@playwright/test";

import {
  getOrderPaymentStatus,
  pollPublicOrder,
} from "../../src/features/commerce/checkout/payment-response";

test("termina de consultar cuando Bacano permite reintentar el pago", async () => {
  let calls = 0;
  const order = createOrder("RETRY_PAYMENT", "PENDING");

  const result = await pollPublicOrder({
    getOrder: async () => {
      calls += 1;
      return order;
    },
    intervalMs: 1,
    timeoutMs: 10,
    wait: async () => undefined,
  });

  expect(result).toBe(order);
  if (!result) throw new Error("expected an order");
  expect(getOrderPaymentStatus(result)).toBe("failed");
  expect(calls).toBe(1);
});

test("continua mientras esta pendiente y termina cuando el pago queda aprobado", async () => {
  let calls = 0;
  const pending = createOrder("WAIT_FOR_PAYMENT", "PENDING");
  const paid = createOrder("NONE", "PAID");

  const result = await pollPublicOrder({
    getOrder: async () => {
      calls += 1;
      return calls === 1 ? pending : paid;
    },
    intervalMs: 1,
    timeoutMs: 10,
    wait: async () => undefined,
  });

  expect(result).toBe(paid);
  if (!result) throw new Error("expected an order");
  expect(getOrderPaymentStatus(result)).toBe("approved");
  expect(calls).toBe(2);
});

test("deja de consultar cuando la API falla varias veces seguidas", async () => {
  // A shopper who may already have paid must reach a verdict, not watch a
  // spinner for the whole timeout while nothing answers.
  let calls = 0;

  await expect(
    pollPublicOrder({
      getOrder: async () => {
        calls += 1;
        throw new Error("gateway caido");
      },
      intervalMs: 1,
      timeoutMs: 1000,
      wait: async () => undefined,
    }),
  ).rejects.toThrow("gateway caido");
  expect(calls).toBe(3);
});

test("un fallo aislado no corta la espera de un pago pendiente", async () => {
  let calls = 0;
  const paid = createOrder("NONE", "PAID");

  const result = await pollPublicOrder({
    getOrder: async () => {
      calls += 1;
      if (calls === 1) throw new Error("timeout");
      return calls === 2 ? createOrder("WAIT_FOR_PAYMENT", "PENDING") : paid;
    },
    intervalMs: 1,
    timeoutMs: 1000,
    wait: async () => undefined,
  });

  expect(result).toBe(paid);
  expect(calls).toBe(3);
});

function createOrder(
  nextAction: PublicOrder["payment"]["nextAction"],
  paymentStatus: PublicOrder["paymentStatus"],
) {
  return {
    payment: { nextAction, session: null },
    paymentStatus,
  } as PublicOrder;
}
