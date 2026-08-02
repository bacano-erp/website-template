import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "./providers";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Bacano Store";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s · ${siteName}` },
  description: `${siteName} — tienda en línea`,
  openGraph: { siteName, type: "website", url: siteUrl },
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
          <header className="border-b border-neutral-200">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold">
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

          <footer className="mt-16 border-t border-neutral-200">
            <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-500">
              © {new Date().getFullYear()} {siteName}
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
