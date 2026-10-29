"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";

import {
  cx,
  formLabelClass,
  formQuantityButtonClass,
  formQuantityInputClass,
  formQuantityStepperClass,
} from "./styles";

type FormQuantityStepperProps = {
  disabled?: boolean;
  label: string;
  max?: number;
  min?: number;
  onValueChange: (value: number) => void;
  value: number;
  wrapperClassName?: string;
};

export function FormQuantityStepper({
  disabled,
  label,
  max,
  min = 1,
  onValueChange,
  value,
  wrapperClassName,
}: FormQuantityStepperProps) {
  const inputId = useId();
  const normalizedValue = clampQuantity(value, min, max);
  const canDecrease = !disabled && normalizedValue > min;
  const canIncrease =
    !disabled && (typeof max !== "number" || normalizedValue < max);

  function setQuantity(nextValue: number) {
    onValueChange(clampQuantity(nextValue, min, max));
  }

  return (
    <div className={cx("grid gap-2", wrapperClassName)}>
      <label className={formLabelClass} htmlFor={inputId}>
        {label}
      </label>
      <div className={formQuantityStepperClass}>
        <button
          type="button"
          disabled={!canDecrease}
          onClick={() => setQuantity(normalizedValue - 1)}
          className={cx(formQuantityButtonClass, "border-border border-r")}
          aria-label="Reducir cantidad"
        >
          <Minus aria-hidden="true" size={16} />
        </button>
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          value={normalizedValue}
          disabled={disabled}
          onChange={(event) => setQuantity(Number(event.target.value) || min)}
          className={formQuantityInputClass}
          aria-label={label}
        />
        <button
          type="button"
          disabled={!canIncrease}
          onClick={() => setQuantity(normalizedValue + 1)}
          className={cx(formQuantityButtonClass, "border-border border-l")}
          aria-label="Aumentar cantidad"
        >
          <Plus aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}

function clampQuantity(value: number, min: number, max?: number) {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : min;
  const minValue = Math.max(min, safeValue);

  return typeof max === "number" ? Math.min(max, minValue) : minValue;
}
