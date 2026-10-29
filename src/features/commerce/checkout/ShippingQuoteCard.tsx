import type { WebsiteShippingQuote } from "@bacano/sdk";
import { Truck } from "lucide-react";

import { formatQuoteAmount } from "./helpers";

export function ShippingQuoteCard({
  onSelect,
  quote,
  selected,
}: {
  onSelect: () => void;
  quote: WebsiteShippingQuote;
  selected: boolean;
}) {
  const showBaseAmount =
    quote.freeShippingApplied && quote.baseAmount > quote.amount;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-md border bg-white px-3 py-2.5 text-left transition ${
        selected
          ? "border-accent shadow-[0_14px_30px_color-mix(in_oklab,var(--accent)_12%,transparent)] ring-2 ring-accent/20"
          : "border-border hover:border-accent"
      }`}
      aria-pressed={selected}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-md ${
            selected
              ? "bg-accent-soft text-accent"
              : "bg-surface-secondary text-foreground"
          }`}
        >
          <Truck size={20} strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block font-medium text-foreground text-sm leading-5">
            {quote.label || quote.serviceName}
          </span>
          {quote.estimatedDelivery ? (
            <span className="mt-1 block text-muted text-sm leading-5">
              {quote.estimatedDelivery}
            </span>
          ) : null}
        </span>
      </span>
      <span className="grid shrink-0 justify-items-end gap-0.5">
        {showBaseAmount ? (
          <span className="font-medium text-muted text-xs line-through">
            {formatQuoteAmount({
              amount: quote.baseAmount,
              currency: quote.currency,
            })}
          </span>
        ) : null}
        <span className="font-medium text-base text-foreground">
          {quote.amount <= 0 ? "Gratis" : formatQuoteAmount(quote)}
        </span>
      </span>
    </button>
  );
}
