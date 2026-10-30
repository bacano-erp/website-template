"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CartDrawer } from "./cart/CartDrawer";
import { CartProvider } from "./cart/CartProvider";

/**
 * The shopping session around the store: the local cart and its drawer.
 *
 * The cart is local until checkout has a contact (see CartProvider), and both
 * it and the drawer stay out of the preview, which renders content rather than
 * a shopping session.
 */
export function CommerceProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPreview =
    pathname === "/vista-previa" || pathname.startsWith("/vista-previa/");

  return (
    <CartProvider disabled={isPreview}>
      {children}
      {isPreview ? null : <CartDrawer />}
    </CartProvider>
  );
}
