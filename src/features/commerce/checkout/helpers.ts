import type {
  WebsiteCouponActionResult,
  WebsiteShippingQuote,
} from "@bacano/sdk";

import { formatMoneyCOP } from "@/lib/bacano/formatters";

import type {
  CheckoutFormState,
  CheckoutPaymentOption,
  CheckoutPaymentOptionMethod,
} from "./types";

export {
  getCheckoutFormValidationErrors,
  isValidCheckoutEmail,
  isValidCheckoutPhone,
} from "./contact-validation";

export const initialCheckoutForm: CheckoutFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  departmentId: "",
  municipalityId: "",
  address: "",
  addressComplement: "",
  notes: "",
};

export function getContactPayload(form: CheckoutFormState) {
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const fullName = [form.firstName, form.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const phone = form.phone.trim();

  return {
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    name: fullName || undefined,
    email: form.email.trim() || undefined,
    cellphone: phone || undefined,
    phone: phone || undefined,
  };
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "No pudimos completar la operacion.";
}

export function getCheckoutOptionErrorMessage(error: unknown, label: string) {
  const message = getErrorMessage(error);

  if (
    message.includes("not a valid json response from webhook") ||
    message.includes("Cannot POST") ||
    message.includes("404")
  ) {
    return `No pudimos cargar ${label}. El servicio de Bacano aun no esta disponible para esta opcion.`;
  }

  return `No pudimos cargar ${label}. ${message}`;
}

export function getCouponMessage(
  result: WebsiteCouponActionResult,
  fallback: string,
) {
  return result.message ?? result.errors?.join(", ") ?? fallback;
}

export function formatQuoteAmount(
  quote: Pick<WebsiteShippingQuote, "amount" | "currency">,
) {
  if (quote.amount <= 0) return "Sin costo";
  if (quote.currency && quote.currency !== "COP") {
    return `${quote.amount.toLocaleString("es-CO")} ${quote.currency}`;
  }
  return formatMoneyCOP(quote.amount);
}

export function sortPaymentOptions(options: CheckoutPaymentOption[]) {
  return [...options].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );
}

export function sortPaymentMethods(methods: CheckoutPaymentOptionMethod[]) {
  return [...methods].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );
}

export function getDefaultPaymentSelection(options: CheckoutPaymentOption[]) {
  const option = sortPaymentOptions(options)[0] ?? null;
  const method = option?.requiresPaymentMethod
    ? (sortPaymentMethods(option.methods)[0] ?? null)
    : null;

  return {
    mode: option?.mode ?? "",
    methodId: method?.paymentMethodId ?? "",
  };
}
