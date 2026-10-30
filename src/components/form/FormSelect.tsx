"use client";

import { ListBox } from "@heroui/react/list-box";
import { Select } from "@heroui/react/select";
import type { Key } from "react";
import { useRef, useState } from "react";

import {
  formFieldClass,
  formLabelClass,
  formSelectTriggerClass,
} from "./styles";

export type FormSelectOption = {
  label: string;
  value: string;
};

type PendingSelectValue = {
  sourceValue: string;
  value: string;
};

type FormSelectProps = {
  label: string;
  name: string;
  onValueChange?: (
    value: string,
    context: { form: HTMLFormElement | null; name: string },
  ) => void;
  options: FormSelectOption[];
  value: string;
};

const EMPTY_SELECT_KEY = "__empty__";

export function FormSelect({
  label,
  name,
  onValueChange,
  options,
  value,
}: FormSelectProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [pendingValue, setPendingValue] = useState<PendingSelectValue | null>(
    null,
  );
  const currentValue =
    pendingValue?.sourceValue === value ? pendingValue.value : value;

  function handleSelectionChange(key: Key | null) {
    const nextValue = selectKeyToValue(key);
    setPendingValue({
      sourceValue: value,
      value: nextValue,
    });

    onValueChange?.(nextValue, {
      form: hiddenInputRef.current?.form ?? null,
      name,
    });
  }

  return (
    <div className={formFieldClass}>
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        value={currentValue}
      />
      <span className={formLabelClass}>{label}</span>
      <Select
        aria-label={label}
        fullWidth
        selectedKey={valueToSelectKey(currentValue)}
        onSelectionChange={handleSelectionChange}
      >
        <Select.Trigger className={formSelectTriggerClass}>
          <Select.Value className="flex min-h-0 flex-1 items-center truncate text-left font-normal text-[15px] leading-[1.25]" />
          <Select.Indicator className="size-4 shrink-0 self-center text-muted" />
        </Select.Trigger>
        <Select.Popover className="z-[80] min-w-56 overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg">
          <ListBox
            aria-label={label}
            className="max-h-72 overflow-y-auto outline-none"
          >
            {options.map((option) => (
              <ListBox.Item
                key={option.value || EMPTY_SELECT_KEY}
                id={valueToSelectKey(option.value)}
                textValue={option.label}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 font-normal text-[14px] text-foreground outline-none transition hover:bg-surface-secondary data-[focused]:bg-surface-secondary data-[selected]:bg-accent-soft data-[selected]:font-medium data-[selected]:text-accent"
              >
                <span className="min-w-0 truncate">{option.label}</span>
                <ListBox.ItemIndicator className="grid size-4 shrink-0 place-items-center text-accent" />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}

function valueToSelectKey(value: string) {
  return value || EMPTY_SELECT_KEY;
}

function selectKeyToValue(key: Key | null) {
  const value = String(key ?? EMPTY_SELECT_KEY);
  return value === EMPTY_SELECT_KEY ? "" : value;
}
