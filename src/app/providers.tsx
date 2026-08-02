"use client";

import { ClerkProvider, useAuth } from "@clerk/react";
import { esES } from "@clerk/localizations";
import { BacanoProvider } from "@bacano/sdk/react";
import type { ReactNode } from "react";

const apiUrl = process.env.NEXT_PUBLIC_BACANO_API_URL!;
const websiteSlug = process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG!;
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;

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

export function Providers({ children }: { children: ReactNode }) {
  // @clerk/react (not @clerk/nextjs) on purpose: a static export has no server
  // middleware for Clerk to hook into, so auth is entirely client-side.
  return (
    <ClerkProvider publishableKey={clerkKey} localization={esES}>
      <BacanoWithAuth>{children}</BacanoWithAuth>
    </ClerkProvider>
  );
}
