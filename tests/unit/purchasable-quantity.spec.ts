import { expect, test } from "@playwright/test";

import {
  exceedsPurchasableMaximum,
  getRemainingPurchasableQuantity,
  normalizePurchasableMaximum,
} from "../../src/features/commerce/cart/purchasable-quantity";

test("calcula las unidades restantes descontando la misma variante del carrito", () => {
  expect(getRemainingPurchasableQuantity(4, 3)).toBe(1);
  expect(getRemainingPurchasableQuantity(4, 4)).toBe(0);
  expect(getRemainingPurchasableQuantity(4, 8)).toBe(0);
});

test("no inventa un limite cuando Bacano no entrega un maximo", () => {
  expect(getRemainingPurchasableQuantity(undefined, 2)).toBe(null);
  expect(getRemainingPurchasableQuantity(null, 2)).toBe(null);
});

test("normaliza el maximo publico sin aceptar valores invalidos", () => {
  expect(normalizePurchasableMaximum(3.9)).toBe(3);
  expect(normalizePurchasableMaximum(-2)).toBe(0);
  expect(normalizePurchasableMaximum(Number.NaN)).toBe(null);
});

test("detecta un carrito que supera la disponibilidad viva", () => {
  expect(exceedsPurchasableMaximum(2, 1)).toBe(true);
  expect(exceedsPurchasableMaximum(1, 1)).toBe(false);
  expect(exceedsPurchasableMaximum(8, undefined)).toBe(false);
});

test("trata una variante con maximo cero como agotada", () => {
  expect(getRemainingPurchasableQuantity(0, 0)).toBe(0);
  expect(exceedsPurchasableMaximum(1, 0)).toBe(true);
});
