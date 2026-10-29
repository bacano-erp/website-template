"use client";

import type { WebsiteCouponActionResult } from "@bacano/sdk";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { FormTextField } from "@/components/form";

export function CheckoutCouponSection({
  appliedCoupon,
  couponCode,
  couponLoading,
  disabled,
  onApplyCoupon,
  onCouponCodeChange,
  onRemoveCoupon,
}: {
  appliedCoupon: WebsiteCouponActionResult | null;
  couponCode: string;
  couponLoading: boolean;
  disabled: boolean;
  onApplyCoupon: () => void;
  onCouponCodeChange: (value: string) => void;
  onRemoveCoupon: () => void;
}) {
  const [isOpen, setIsOpen] = useState(
    Boolean(appliedCoupon?.couponId || couponCode),
  );
  const isExpanded = isOpen || Boolean(appliedCoupon?.couponId);

  return (
    <div className="border-border border-y py-4">
      <button
        type="button"
        aria-controls="checkout-coupon-content"
        aria-expanded={isExpanded}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left font-medium text-accent text-sm transition hover:text-accent"
      >
        <span>¿Tienes un cupón de descuento?</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded ? (
        <div id="checkout-coupon-content" className="mt-3">
          {appliedCoupon?.couponId ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">
                {appliedCoupon.code}
              </span>
              <button
                type="button"
                disabled={couponLoading}
                onClick={onRemoveCoupon}
                className="font-medium text-danger transition hover:text-danger disabled:opacity-50"
              >
                Quitar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <FormTextField
                  id="checkout-coupon"
                  hideLabel
                  label="Código de cupón"
                  placeholder="Código"
                  type="text"
                  value={couponCode}
                  onChange={(event) => onCouponCodeChange(event.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={couponLoading || disabled}
                onClick={onApplyCoupon}
                className="h-10 rounded-md border border-accent px-3 font-medium text-accent text-sm transition hover:bg-accent-soft disabled:opacity-50"
              >
                {couponLoading ? "..." : "Aplicar"}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
