"use client";

import { Dropdown } from "@heroui/react/dropdown";
import { Check, ChevronDown } from "lucide-react";
import type { Key, ReactNode } from "react";

import { cx } from "./styles";

export type InlineOptionMenuOption = {
  label: string;
  value: string;
};

type InlineOptionMenuProps = {
  ariaLabel?: string;
  className?: string;
  icon?: ReactNode;
  label: string;
  onValueChange: (value: string) => void;
  options: InlineOptionMenuOption[];
  value: string;
};

export function InlineOptionMenu({
  ariaLabel,
  className,
  icon,
  label,
  onValueChange,
  options,
  value,
}: InlineOptionMenuProps) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  function handleAction(key: Key) {
    onValueChange(String(key));
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        type="button"
        className={cx(
          "inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-white px-3.5 font-normal text-[13px] text-foreground outline-none transition hover:border-border hover:bg-surface-secondary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15",
          className,
        )}
        aria-label={ariaLabel ?? label}
      >
        {icon ? (
          <span className="grid size-4 shrink-0 place-items-center text-muted">
            {icon}
          </span>
        ) : null}
        <span className="text-muted">{label}</span>
        <span className="font-medium text-foreground">
          {selectedOption?.label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
        />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom end"
        className="z-[80] min-w-52 overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg"
      >
        <Dropdown.Menu
          aria-label={ariaLabel ?? label}
          selectionMode="single"
          selectedKeys={new Set([selectedOption?.value ?? value])}
          onAction={handleAction}
          className="outline-none"
        >
          {options.map((option) => (
            <Dropdown.Item
              key={option.value}
              id={option.value}
              textValue={option.label}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 font-normal text-[14px] text-foreground outline-none transition hover:bg-surface-secondary data-[focused]:bg-surface-secondary data-[selected]:bg-accent-soft data-[selected]:font-medium data-[selected]:text-accent"
            >
              <span>{option.label}</span>
              <Dropdown.ItemIndicator className="grid size-4 shrink-0 place-items-center text-accent">
                <Check aria-hidden="true" size={15} />
              </Dropdown.ItemIndicator>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
