import { isPossiblePhoneNumber } from "react-phone-number-input";
import { z } from "zod";

import type { CheckoutFormState, CheckoutValidationErrors } from "./types";

const emailSchema = z.string().trim().email();
const phoneSchema = z
  .string()
  .trim()
  .refine((value) => isPossiblePhoneNumber(value));

const requiredMessage = "Este campo es requerido.";

function createCheckoutFormSchema(requiresShipping: boolean) {
  return z
    .object({
      firstName: z.string().trim().min(1, requiredMessage),
      lastName: z.string().trim().min(1, requiredMessage),
      email: z
        .string()
        .trim()
        .min(1, requiredMessage)
        .pipe(z.email("Ingresa un correo valido.")),
      phone: z
        .string()
        .trim()
        .min(1, requiredMessage)
        .refine((value) => isPossiblePhoneNumber(value), {
          message: "Ingresa un WhatsApp valido.",
        }),
      departmentId: z.string(),
      municipalityId: z.string(),
      address: z.string(),
      addressComplement: z.string(),
      notes: z.string(),
    })
    .superRefine((form, context) => {
      if (!requiresShipping) return;

      for (const field of [
        "departmentId",
        "municipalityId",
        "address",
      ] as const) {
        if (!form[field].trim()) {
          context.addIssue({
            code: "custom",
            message: requiredMessage,
            path: [field],
          });
        }
      }
    });
}

export function isValidCheckoutEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

export function isValidCheckoutPhone(value: string): boolean {
  return phoneSchema.safeParse(value).success;
}

export function getCheckoutFormValidationErrors(
  form: CheckoutFormState,
  { requiresShipping }: { requiresShipping: boolean },
): CheckoutValidationErrors {
  const result = createCheckoutFormSchema(requiresShipping).safeParse(form);
  if (result.success) return {};

  const errors: CheckoutValidationErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof CheckoutFormState] = issue.message;
    }
  }

  return errors;
}
