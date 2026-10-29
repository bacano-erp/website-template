"use client";

import { CreditCard, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

import { CheckoutPaymentLoadingOverlay } from "./CheckoutPaymentLoadingOverlay";

type PublicPaymentSessionActionProps = {
  orderId: string;
  paymentMethodId: string;
  publicOrderToken: string;
};

export function PublicPaymentSessionAction({
  orderId,
  paymentMethodId,
  publicOrderToken,
}: PublicPaymentSessionActionProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const returnUrl = getPublicPaymentReturnUrl(orderId, publicOrderToken);

  async function openPaymentSession() {
    setError(null);
    setLoading(true);
    setRedirecting(false);

    try {
      const client = await getBacanoBrowserClient();
      const session = await client.checkout.createPaymentSession({
        orderId,
        paymentMethodId,
        publicOrderToken,
        returnUrl,
      });

      if (
        !session.success ||
        session.integrationMode !== "redirect" ||
        !session.redirectUrl
      ) {
        setError(
          session.errors?.join(", ") ??
            "No pudimos iniciar el checkout seguro de pago.",
        );
        return;
      }

      setRedirecting(true);
      try {
        window.location.assign(session.redirectUrl);
      } catch (caught) {
        setRedirecting(false);
        throw caught;
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos iniciar la pasarela de pago.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CheckoutPaymentLoadingOverlay visible={loading || redirecting} />

      <section className="grid gap-3 rounded-lg border border-accent-soft bg-accent-soft p-4">
        <button
          type="button"
          className="btn btn-cart w-full"
          disabled={loading || redirecting}
          onClick={openPaymentSession}
        >
          {loading || redirecting ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <CreditCard size={18} />
          )}
          Intentar pago
        </button>

        {error ? (
          <p className="rounded-md border border-danger-soft bg-danger-soft px-3 py-2 font-medium text-danger text-sm leading-6">
            {error}
          </p>
        ) : null}
      </section>
    </>
  );
}

function getPublicPaymentReturnUrl(orderId: string, publicOrderToken: string) {
  const url = new URL("/pago/respuesta", window.location.origin);
  url.searchParams.set("orderId", orderId);
  url.searchParams.set("token", publicOrderToken);
  return url.toString();
}
