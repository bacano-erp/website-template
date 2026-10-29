import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderTrackingPageClient } from "@/features/commerce/checkout/OrderTrackingPageClient";

export const metadata: Metadata = {
  title: "Tu pedido",
  // The query string carries the token that opens this order. Indexing it
  // would publish that token in a search result.
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return (
    <Suspense
      fallback={<p className="container-page py-10 text-muted">Cargando…</p>}
    >
      <OrderTrackingPageClient />
    </Suspense>
  );
}
