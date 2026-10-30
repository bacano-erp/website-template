import type { InputHTMLAttributes, ReactNode } from "react";

import { cx } from "./styles";

type FormCheckboxRowProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
> & {
  inputClassName?: string;
  label: ReactNode;
  wrapperClassName?: string;
};

export function FormCheckboxRow({
  inputClassName,
  label,
  wrapperClassName,
  ...inputProps
}: FormCheckboxRowProps) {
  return (
    <label
      className={cx(
        "flex min-h-14 items-center justify-between gap-3 border-border border-t font-medium text-[15px] text-foreground",
        wrapperClassName,
      )}
    >
      {label}
      <input
        {...inputProps}
        type="checkbox"
        className={cx("size-5 accent-accent", inputClassName)}
      />
    </label>
  );
}
