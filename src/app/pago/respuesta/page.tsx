import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentReturn } from "@/components/PaymentReturn";

export const metadata: Metadata = {
  title: "Respuesta de pago",
  // Never indexed: every URL here belongs to one shopper's transaction, and
  // the token in the query string is what grants access to that order.
  robots: { index: false, follow: false },
};

/**
 * The return URL handed to the payment gateway.
 *
 * Keep the path stable. It is baked into payment sessions that may already be
 * in flight, and a shopper mid-payment cannot be told the address moved.
 */
export default function PaymentResponsePage() {
  return (
    // `useSearchParams` needs a Suspense boundary to prerender under
    // `output: export`; without it the build fails rather than the page.
    <Suspense fallback={<p className="text-neutral-600">Cargando…</p>}>
      <PaymentReturn />
    </Suspense>
  );
}
