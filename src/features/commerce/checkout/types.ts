import type {
  CheckoutResult,
  PublicOrder,
  WebsitePaymentMode,
  WebsitePaymentOption,
  WebsitePaymentOptionMethod,
} from "@bacano/sdk";

export type CheckoutFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  municipalityId: string;
  address: string;
  addressComplement: string;
  notes: string;
};

export type CheckoutValidationField =
  | keyof CheckoutFormState
  | "delivery"
  | "shippingQuote"
  | "payment"
  | "initialPayment"
  | "legal";

export type CheckoutValidationErrors = Partial<
  Record<CheckoutValidationField, string>
>;

export type CheckoutPaymentMode = WebsitePaymentMode;
export type CheckoutPaymentOption = WebsitePaymentOption;
export type CheckoutPaymentOptionMethod = WebsitePaymentOptionMethod;

export type CheckoutSuccessItem = {
  id: string;
  imageSrc?: string | null;
  name: string;
  quantity: number;
  sku?: string | null;
};

export type CheckoutSuccessSnapshot = {
  contactEmail?: string;
  contactPhone?: string;
  deliveryLabel: string;
  discount: number;
  items: CheckoutSuccessItem[];
  nextSteps?: string[];
  orderId: string | null;
  orderNumber: string | null;
  paymentLabel: string;
  paymentMethodId?: string | null;
  paymentNextAction?: PublicOrder["payment"]["nextAction"] | null;
  paymentSession?: CheckoutPaymentSessionSummary | null;
  paymentStatus?: string | null;
  publicOrderToken?: string | null;
  result?: CheckoutResult;
  shippingAmount: number | null;
  shippingIsFree?: boolean;
  status?: string | null;
  subtotal: number;
  total: number;
};

export type CheckoutPaymentSessionSummary = {
  amount?: number | null;
  errorMessage?: string | null;
  gatewayTransactionId?: string | null;
  reference?: string | null;
  status?: string | null;
};
