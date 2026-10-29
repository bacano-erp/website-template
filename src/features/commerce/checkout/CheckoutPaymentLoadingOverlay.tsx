"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";

type CheckoutPaymentLoadingOverlayProps = {
  visible: boolean;
};

export function CheckoutPaymentLoadingOverlay({
  visible,
}: CheckoutPaymentLoadingOverlayProps) {
  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="checkout-payment-loading"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-payment-loading-title"
      aria-describedby="checkout-payment-loading-description"
    >
      <div className="checkout-payment-loading__content" aria-live="polite">
        <div className="checkout-payment-loading__mascot" aria-hidden="true">
          <LoaderCircle
            aria-hidden="true"
            className="relative size-28 animate-spin text-accent"
            strokeWidth={1.5}
          />
        </div>

        <p className="checkout-payment-loading__eyebrow">Pago seguro</p>
        <h2 id="checkout-payment-loading-title">Estamos preparando tu pago</h2>
        <p id="checkout-payment-loading-description">
          En un momento te llevaremos a la pasarela. No cierres esta ventana.
        </p>

        <div className="checkout-payment-loading__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
