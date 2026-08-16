import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetail } from "@/components/OrderDetail";

export const metadata: Metadata = {
  title: "Tu pedido",
  // The query string carries the token that opens this order. Indexing it
  // would publish that token in a search result.
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return (
    <Suspense fallback={<p className="text-neutral-600">Cargando…</p>}>
      <OrderDetail />
    </Suspense>
  );
}
