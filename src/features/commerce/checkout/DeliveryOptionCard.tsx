import type { WebsiteDeliveryOption } from "@bacano/sdk";
import { CircleCheck, Store, Truck } from "lucide-react";
import type { ReactNode } from "react";

export function DeliveryOptionCard({
  detail,
  onSelect,
  option,
  selected,
  title,
}: {
  detail?: ReactNode;
  onSelect: () => void;
  option: WebsiteDeliveryOption;
  selected: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[112px] items-start gap-4 rounded-md border bg-white px-4 py-4 text-left shadow-[0_10px_26px_rgba(0,0,0,0.04)] transition ${
        selected
          ? "border-accent bg-accent-soft shadow-[0_14px_30px_color-mix(in_oklab,var(--accent)_13%,transparent)] ring-2 ring-accent/15"
          : "border-border hover:border-accent hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)]"
      }`}
      aria-pressed={selected}
    >
      <span
        className={`grid size-11 shrink-0 place-items-center self-center rounded-md ${
          selected
            ? "bg-accent-soft text-accent"
            : "bg-surface-secondary text-foreground"
        }`}
      >
        {option.fulfillmentFamily === "PICKUP" ? (
          <Store size={22} strokeWidth={1.9} />
        ) : (
          <Truck size={22} strokeWidth={1.9} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 block font-semibold text-[17px] text-accent leading-5">
            {title ?? option.label}
          </span>
          {selected ? (
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[11px] text-accent leading-5">
              <CircleCheck aria-hidden="true" size={14} />
              Seleccionado
            </span>
          ) : null}
        </span>
        {detail ? (
          <span className="mt-1.5 block text-muted text-sm leading-5">
            {detail}
          </span>
        ) : null}
      </span>
    </button>
  );
}
