type PaymentPresentationInput = {
  optionLabel: string;
  optionDescription?: string | null;
  methodLabel?: string | null;
  methodDescription?: string | null;
  methodInstructions?: string | null;
};

export type PaymentPresentation = {
  badges: PaymentBrand[];
  description: string;
  title: string;
};

export type PaymentBrand =
  | "Amex"
  | "Visa"
  | "Mastercard"
  | "PSE"
  | "Nequi"
  | "DaviPlata";

export function getPaymentPresentation({
  methodDescription,
  methodInstructions,
  methodLabel,
  optionDescription,
  optionLabel,
}: PaymentPresentationInput): PaymentPresentation {
  const providerText = [
    optionLabel,
    optionDescription,
    methodLabel,
    methodDescription,
    methodInstructions,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (providerText.includes("wompi")) {
    return {
      badges: ["PSE", "Visa", "Mastercard", "Amex", "Nequi", "DaviPlata"],
      description: "Paga de forma segura sin salir del proceso de compra.",
      title: "Pago en linea",
    };
  }

  return {
    badges: [],
    description:
      methodInstructions ??
      methodDescription ??
      optionDescription ??
      "Selecciona esta opcion para continuar.",
    title: methodLabel ?? optionLabel,
  };
}

export function getPaymentDisplayLabel(
  optionLabel: string,
  methodLabel?: string | null,
) {
  const presentation = getPaymentPresentation({
    methodLabel,
    optionLabel,
  });

  if (presentation.title === "Pago en linea") {
    return presentation.title;
  }

  return methodLabel ? `${optionLabel} - ${methodLabel}` : optionLabel;
}
