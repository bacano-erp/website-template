import type { Metadata } from "next";
import Link from "next/link";
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
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <Providers>
          <header className="border-neutral-200 border-b">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="font-semibold text-lg">
                {siteName}
              </Link>
              <div className="flex items-center gap-6 text-sm">
                <Link href="/catalogo/" className="hover:underline">
                  Catálogo
                </Link>
                <Link href="/carrito/" className="hover:underline">
                  Carrito
                </Link>
              </div>
            </nav>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

          <footer className="mt-16 border-neutral-200 border-t">
            <div className="mx-auto max-w-5xl px-4 py-8 text-neutral-500 text-sm">
              © {new Date().getFullYear()} {siteName}
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
