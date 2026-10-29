import { expect, test } from "@playwright/test";

import {
  getPaymentDisplayLabel,
  getPaymentPresentation,
} from "../../src/features/commerce/checkout/payment-presentation";

test("presenta Wompi como pago en linea y muestra los medios disponibles", () => {
  expect(
    getPaymentPresentation({
      methodLabel: "WOMPI",
      optionLabel: "Paga en la web y recibe tu pedido",
    }),
  ).toEqual({
    badges: ["PSE", "Visa", "Mastercard", "Amex", "Nequi", "DaviPlata"],
    description: "Paga de forma segura sin salir del proceso de compra.",
    title: "Pago en linea",
  });
  expect(getPaymentDisplayLabel("Pago anticipado", "Wompi")).toBe(
    "Pago en linea",
  );
});

test("conserva la informacion comercial de otros metodos de pago", () => {
  expect(
    getPaymentPresentation({
      methodDescription: "Paga al recibir tu pedido.",
      methodLabel: "Efectivo",
      optionLabel: "Pago contraentrega",
    }),
  ).toEqual({
    badges: [],
    description: "Paga al recibir tu pedido.",
    title: "Efectivo",
  });
});
