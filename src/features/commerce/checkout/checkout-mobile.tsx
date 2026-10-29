import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import type {
  CheckoutValidationErrors,
  CheckoutValidationField,
} from "./types";

/**
 * The phone checkout's step-by-step behaviour: scrolling to the step or field
 * that needs attention, and keeping the focused field above the keyboard.
 */

export function scrollToCheckoutSection(field: CheckoutValidationField) {
  const targetId =
    field === "legal"
      ? "checkout-legal-section"
      : field === "payment" || field === "initialPayment"
        ? "checkout-payment-section"
        : field === "delivery" ||
            field === "departmentId" ||
            field === "municipalityId" ||
            field === "address" ||
            field === "shippingQuote"
          ? "checkout-delivery-section"
          : "checkout-contact-section";

  window.requestAnimationFrame(() => {
    const invalidControl = document.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    const target = invalidControl ?? document.getElementById(targetId);

    target?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    invalidControl?.focus({ preventScroll: true });
  });
}

export function getFirstValidationError(
  errors: CheckoutValidationErrors,
): CheckoutValidationField | null {
  const firstError = Object.keys(errors)[0] as
    | CheckoutValidationField
    | undefined;
  return firstError ?? null;
}

export function scrollToMobileCheckoutStep(targetId: string) {
  window.requestAnimationFrame(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();

    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  });
}

export function keepFocusedFieldAboveKeyboard(
  target: HTMLInputElement | HTMLTextAreaElement,
) {
  if (document.activeElement !== target) return;

  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
  const rect = target.getBoundingClientRect();
  const safeTop = viewportTop + 20;
  const safeBottom = viewportBottom - 28;

  if (rect.bottom > safeBottom) {
    window.scrollBy({
      behavior: "smooth",
      top: rect.bottom - safeBottom + 16,
    });
    return;
  }

  if (rect.top < safeTop) {
    window.scrollBy({
      behavior: "smooth",
      top: rect.top - safeTop - 12,
    });
  }
}

export function MobileCheckoutContinueButton({
  children,
  disabled = false,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 sm:hidden">
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex min-h-12 w-full items-center justify-between rounded-md bg-foreground px-5 font-medium text-base text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:bg-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-warning/35 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {children}
        <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2} />
      </button>
    </div>
  );
}

export function MobileCheckoutPendingSection({ title }: { title: string }) {
  return (
    <section
      aria-label={`${title}, paso pendiente`}
      className="border-border border-t py-5 sm:hidden"
    >
      <h2 className="font-medium text-lg text-muted">{title}</h2>
    </section>
  );
}
