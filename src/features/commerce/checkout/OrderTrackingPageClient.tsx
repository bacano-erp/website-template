"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createWhatsAppUrl, whatsAppEnabled } from "@/config/store";

import { OrderTrackingView } from "@/features/commerce/checkout/OrderTrackingView";

export function OrderTrackingPageClient() {
  const searchParams = useSearchParams();
  const orderId =
    searchParams.get("orderId") ??
    searchParams.get("order_id") ??
    searchParams.get("order") ??
    searchParams.get("reference") ??
    searchParams.get("reference_id");
  const token =
    searchParams.get("token") ??
    searchParams.get("publicOrderToken") ??
    searchParams.get("public_order_token") ??
    undefined;

  if (orderId) {
    return <OrderTrackingView orderId={orderId} token={token} />;
  }

  return (
    <main className="container-page py-8 sm:py-12">
      <section className="mx-auto grid max-w-3xl gap-6 overflow-hidden rounded-lg border border-border bg-white p-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.08)] sm:p-8">
        <div>
          <h1 className="mt-4 font-normal text-3xl text-foreground sm:text-4xl">
            No encontramos el pedido
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-accent text-base leading-7">
            Abre el enlace que recibiste al finalizar la compra o escribenos
            para ayudarte a consultar el estado.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-sm gap-3">
          {whatsAppEnabled ? (
            <a href={createWhatsAppUrl()} className="btn btn-cart w-full">
              <MessageCircle size={18} strokeWidth={2.3} />
              Necesito ayuda
            </a>
          ) : null}
          <Link href="/catalogo/" className="btn btn-secondary w-full">
            Volver al catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}
