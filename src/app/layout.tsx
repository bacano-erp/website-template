import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { requireSiteUrl } from "@/lib/site-url";
import { Providers } from "./providers";
import "./globals.css";

// A missing name is cosmetic, so it has a default. A missing URL is not — see
// `requireSiteUrl`, which stops the build rather than publish canonical tags
// pointing at localhost.
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Bacano Store";
const siteUrl = requireSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s · ${siteName}` },
  description: `${siteName} — tienda en línea`,
  openGraph: { siteName, type: "website", url: siteUrl },
  // Canonical URLs, absolute via metadataBase. Without these a store reachable
  // on more than one hostname — the Bacano subdomain and the customer's own
  // domain both stay live after a custom domain is attached — asks search
  // engines to pick which one is real, and they do not always pick the one you
  // would. Each page overrides `canonical` with its own path.
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
