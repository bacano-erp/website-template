import type { WebsiteFreeShippingProgress } from "@bacano/sdk";

import { formatMoneyCOP } from "@/lib/bacano/formatters";

export function FreeShippingProgressBar({
  progress,
  variant = "default",
}: {
  progress: WebsiteFreeShippingProgress | null;
  variant?: "default" | "compact";
}) {
  const canShow =
    Boolean(progress?.enabled) &&
    (Boolean(progress?.thresholdReached) || progress?.remaining !== null);

  if (!canShow || !progress) return null;

  const percent = progress.thresholdReached
    ? 100
    : progress.threshold && progress.eligibleSubtotal !== null
      ? Math.min(100, (progress.eligibleSubtotal / progress.threshold) * 100)
      : 0;

  return (
    <div
      className={`grid gap-2 rounded-md border border-accent-soft bg-accent-soft ${
        variant === "compact" ? "px-3 py-2.5" : "p-3"
      }`}
    >
      {progress.thresholdReached ? (
        <p className="font-medium text-accent text-sm leading-5">
          Tu pedido ya tiene envio gratis.
        </p>
      ) : progress.remaining !== null ? (
        <p className="text-muted text-sm leading-5">
          Te faltan <strong>{formatMoneyCOP(progress.remaining)}</strong> para
          envio gratis.
        </p>
      ) : (
        <p className="text-muted text-sm leading-5">
          Agrega productos para alcanzar el envio gratis.
        </p>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
