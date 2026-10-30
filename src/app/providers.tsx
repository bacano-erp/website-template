"use client";

import { BacanoWebsiteGate } from "@bacano/sdk/react";
import { I18nProvider } from "@heroui/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { storeConfig } from "@/config/store";
import { BuyerAccountsProvider } from "@/features/account/BuyerAccountsProvider";
import { CartDrawer } from "@/features/commerce/cart/CartDrawer";
import { CartProvider } from "@/features/commerce/cart/CartProvider";
import { getBacanoEnv } from "@/lib/bacano/env";

/**
 * Bacano's "site under construction" screen, switched on per website in the
 * platform, never in this repository.
 *
 * Outside everything else on purpose: while the screen is active nothing below
 * it mounts, so Clerk and the SDK never initialise and no measurement fires.
 * The exported HTML keeps the catalogue inside a `<noscript>` while the gate
 * checks the configuration, so crawlers and visitors without JavaScript still
 * see the store. A failure to read the configuration opens the site rather
 * than taking it down. See STOREFRONT_CONSTRUCTION.md in @bacano/sdk.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <BacanoWebsiteGate config={getBacanoEnv()}>
      <StorefrontProviders>{children}</StorefrontProviders>
    </BacanoWebsiteGate>
  );
}

/**
 * The store, below the gate.
 *
 * `BuyerAccountsProvider` mounts the SDK, measurement and — only when Bacano's
 * public configuration carries a Clerk key and the route needs it — Clerk.
 * Buyer accounts are opt-in per website, so most stores have no key and run
 * guest-only; nothing here waits on a Clerk that will never load.
 *
 * The cart is local until checkout has a contact (see CartProvider), and both
 * it and the drawer stay out of the preview, which renders content rather than
 * a shopping session.
 */
function StorefrontProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPreview =
    pathname === "/vista-previa" || pathname.startsWith("/vista-previa/");

  return (
    <I18nProvider locale={storeConfig.locale}>
      <BuyerAccountsProvider>
        <CartProvider disabled={isPreview}>
          {children}
          {isPreview ? null : <CartDrawer />}
        </CartProvider>
      </BuyerAccountsProvider>
    </I18nProvider>
  );
}
