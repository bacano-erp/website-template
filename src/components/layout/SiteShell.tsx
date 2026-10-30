"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { storeConfig } from "@/config/store";
import { CartButton } from "@/features/commerce/cart/CartButton";
import { CheckoutHeader } from "@/features/commerce/checkout/CheckoutHeader";

/** Routes whose view draws its own <main> and page width. */
const FULL_VIEW_ROUTES = [
  "/carrito",
  "/checkout",
  "/pago/respuesta",
  "/pedido",
];

const matches = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

/**
 * The frame around every page.
 *
 * Checkout gets a header of its own — the store's name and that the purchase
 * is safe, no navigation — because every link out of it is a way to abandon the
 * purchase. Everywhere else, the store's header with the cart.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (matches(pathname, "/checkout")) {
    return (
      <>
        <CheckoutHeader />
        {children}
      </>
    );
  }

  const ownsLayout = FULL_VIEW_ROUTES.some((route) => matches(pathname, route));

  return (
    <>
      <header className="border-border border-b">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold text-foreground text-lg">
            {storeConfig.name}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/catalogo/" className="hover:underline">
              Catálogo
            </Link>
            <CartButton />
          </div>
        </nav>
      </header>

      {ownsLayout ? (
        children
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
      )}

      <footer className="mt-16 border-border border-t">
        <div className="mx-auto max-w-5xl px-4 py-8 text-muted text-sm">
          © {new Date().getFullYear()} {storeConfig.name}
        </div>
      </footer>
    </>
  );
}
