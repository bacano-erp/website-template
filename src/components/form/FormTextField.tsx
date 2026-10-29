"use client";

import { Input, type InputProps } from "@heroui/react/input";
import type { ReactNode } from "react";

import { cx, formFieldClass, formInputClass, formLabelClass } from "./styles";

type FormTextFieldProps = Omit<InputProps, "className" | "errorMessage"> & {
  children?: ReactNode;
  errorMessage?: string;
  hideLabel?: boolean;
  label: string;
  startContent?: ReactNode;
};

export function FormTextField({
  children,
  errorMessage,
  hideLabel,
  label,
  startContent,
  ...inputProps
}: FormTextFieldProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the label wraps its field; Biome cannot see into the component
    <label className={formFieldClass}>
      <span className={hideLabel ? "sr-only" : formLabelClass}>{label}</span>
      {startContent ? (
        <span className="relative block">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">
            {startContent}
          </span>
          <Input
            {...inputProps}
            fullWidth
            aria-invalid={Boolean(errorMessage)}
            className={cx(
              formInputClass,
              "pl-11",
              errorMessage &&
                "border-danger hover:border-danger focus:border-danger focus:ring-danger/15",
            )}
          />
        </span>
      ) : (
        <Input
          {...inputProps}
          fullWidth
          aria-invalid={Boolean(errorMessage)}
          className={cx(
            formInputClass,
            errorMessage &&
              "border-danger hover:border-danger focus:border-danger focus:ring-danger/15",
          )}
        />
      )}
      {errorMessage ? (
        <span className="font-medium text-danger text-xs leading-4">
          {errorMessage}
        </span>
      ) : null}
      {children}
    </label>
  );
}
