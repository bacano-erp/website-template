"use client";

import { BacanoProvider } from "@bacano/sdk/react";
import { esES } from "@clerk/localizations";
import { ClerkProvider, useAuth } from "@clerk/react";
import type { ReactNode } from "react";

const apiUrl = process.env.NEXT_PUBLIC_BACANO_API_URL!;
const websiteSlug = process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG!;

// `||` not `??`, and the emptiness matters: buyer accounts are opt-in, so
// Bacano provisions most stores with no Clerk key at all and the build receives
// this variable as an empty string. Treating "" as configured is what broke
// every one of those stores.
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const buyerAuthEnabled = clerkKey.length > 0;

/**
 * Wires Bacano to Clerk.
 *
 * The SDK never sees a password and never stores a token: it calls
 * `getAccessToken` before each request, so Clerk keeps ownership of the session
 * and of refreshing it. See AUTHENTICATION.md in @bacano/sdk.
 */
function BacanoWithAuth({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  return (
    <BacanoProvider
      config={{
        apiUrl,
        websiteSlug,
        getAccessToken: () => getToken(),
      }}
    >
      {children}
    </BacanoProvider>
  );
}

/**
 * The same store with no buyer accounts: anonymous browsing, cart and checkout.
 *
 * No `getAccessToken` at all, rather than one that resolves to null. The SDK
 * calls it before every request, so a store with no auth must not be asking an
 * uninitialised Clerk for a token it can never produce.
 */
function BacanoAnonymous({ children }: { children: ReactNode }) {
  return (
    <BacanoProvider config={{ apiUrl, websiteSlug }}>{children}</BacanoProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  // Buyer auth is optional, and its absence is the common case.
  //
  // This used to mount ClerkProvider unconditionally. With an empty
  // publishable key Clerk never initialises — `window.Clerk` is simply never
  // defined — so `getToken` never becomes usable and every SDK request waits
  // on it forever. Nothing throws: stock and cart sit in their loading state
  // for the life of the page, the console stays clean, and the storefront
  // looks like it is merely slow.
  //
  // The branch is here rather than inside a component because hooks cannot be
  // conditional: `useAuth` must not run in a tree with no ClerkProvider above
  // it.
  //
  // @clerk/react (not @clerk/nextjs) on purpose: a static export has no server
  // middleware for Clerk to hook into, so auth is entirely client-side.
  if (!buyerAuthEnabled) {
    return <BacanoAnonymous>{children}</BacanoAnonymous>;
  }

  return (
    <ClerkProvider publishableKey={clerkKey} localization={esES}>
      <BacanoWithAuth>{children}</BacanoWithAuth>
    </ClerkProvider>
  );
}
