import type { InputHTMLAttributes, ReactNode } from "react";

type FormOptionChipProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
> & {
  count?: number;
  label: ReactNode;
};

export function FormOptionChip({
  count,
  label,
  ...inputProps
}: FormOptionChipProps) {
  return (
    <label className="group cursor-pointer">
      <input {...inputProps} className="peer sr-only" type="checkbox" />
      <span className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-border bg-white px-3 font-normal text-[14px] text-foreground transition group-hover:border-border group-hover:bg-surface-secondary peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-medium peer-checked:text-accent">
        <span className="min-w-0 truncate">{label}</span>
        {typeof count === "number" ? (
          <span className="font-medium text-[11px] text-muted peer-checked:text-accent">
            {count}
          </span>
        ) : null}
      </span>
    </label>
  );
}
