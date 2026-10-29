import { expect, test } from "@playwright/test";

import {
  allowsInitialPayment,
  requiresInitialPayment,
} from "../../src/features/commerce/checkout/payment-policy";

test("la política none no permite abonos", () => {
  const option = { initialPaymentPolicy: "none" } as const;

  expect(allowsInitialPayment(option)).toBe(false);
  expect(requiresInitialPayment(option)).toBe(false);
});

test("la política optional permite abonos sin exigirlos", () => {
  const option = { initialPaymentPolicy: "optional" } as const;

  expect(allowsInitialPayment(option)).toBe(true);
  expect(requiresInitialPayment(option)).toBe(false);
});

test("la política required permite y exige el abono", () => {
  const option = { initialPaymentPolicy: "required" } as const;

  expect(allowsInitialPayment(option)).toBe(true);
  expect(requiresInitialPayment(option)).toBe(true);
});
