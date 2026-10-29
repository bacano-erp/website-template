import type { Metadata } from "next";
import { CartPage } from "@/features/commerce/cart/CartPage";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

/**
 * Entirely client-rendered. The cart belongs to the shopper, not to the build:
 * nothing here can be pre-rendered, and it must never be cached at the edge.
 */
export default function Page() {
  return <CartPage />;
}
