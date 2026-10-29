import type { Metadata } from "next";
import { CheckoutView } from "@/features/commerce/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  // A shopper's session, not a page: nothing here is useful to a crawler.
  robots: { index: false, follow: false },
};

/**
 * The whole checkout runs in the browser: contact, delivery, shipping quote,
 * coupons, payment and confirmation, all read live from Bacano through the SDK.
 * See docs/comercio.md for the flow and what each step asks Bacano.
 */
export default function CheckoutPage() {
  return <CheckoutView mode="one-page" />;
}
