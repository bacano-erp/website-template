import type { WebsitePaymentOption } from "@bacano/sdk";

type InitialPaymentPolicySource = Pick<
  WebsitePaymentOption,
  "initialPaymentPolicy"
>;

export function allowsInitialPayment(option: InitialPaymentPolicySource) {
  return (
    option.initialPaymentPolicy === "optional" ||
    option.initialPaymentPolicy === "required"
  );
}

export function requiresInitialPayment(option: InitialPaymentPolicySource) {
  return option.initialPaymentPolicy === "required";
}
