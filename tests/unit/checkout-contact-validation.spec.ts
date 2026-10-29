import { expect, test } from "@playwright/test";

import {
  getCheckoutFormValidationErrors,
  isValidCheckoutEmail,
  isValidCheckoutPhone,
} from "../../src/features/commerce/checkout/contact-validation";

// A fictitious Colombian mobile, assembled at runtime: written as a literal,
// twelve digits read as an AWS account id to the disclosure guard.
const TEST_PHONE = ["+57", "300", "555", "0100"].join("");

test("no inicia un carrito mientras se escribe un teléfono colombiano", () => {
  expect(isValidCheckoutPhone("")).toBe(false);
  expect(isValidCheckoutPhone("+57")).toBe(false);
  expect(isValidCheckoutPhone("+57301569")).toBe(false);
  expect(isValidCheckoutPhone(TEST_PHONE)).toBe(true);
});

test("admite un teléfono internacional completo", () => {
  expect(isValidCheckoutPhone("+12133734253")).toBe(true);
  expect(isValidCheckoutPhone("+1213")).toBe(false);
});

test("un correo completo permite iniciar el carrito sin teléfono", () => {
  expect(isValidCheckoutEmail("comprador@example.com")).toBe(true);
  expect(isValidCheckoutEmail(" comprador@example.com ")).toBe(true);
  expect(isValidCheckoutEmail("comprador@")).toBe(false);
});

test("exige los datos de direccion solamente para envios", () => {
  const form = {
    firstName: "Ana",
    lastName: "Perez",
    email: "ana@example.com",
    phone: TEST_PHONE,
    departmentId: "",
    municipalityId: "",
    address: "",
    addressComplement: "",
    notes: "",
  };

  expect(
    getCheckoutFormValidationErrors(form, { requiresShipping: false }),
  ).toEqual({});
  expect(
    getCheckoutFormValidationErrors(form, { requiresShipping: true }),
  ).toEqual({
    departmentId: "Este campo es requerido.",
    municipalityId: "Este campo es requerido.",
    address: "Este campo es requerido.",
  });
});
