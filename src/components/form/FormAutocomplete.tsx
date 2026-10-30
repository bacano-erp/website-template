"use client";

import { Autocomplete } from "@heroui/react/autocomplete";
import { ListBox } from "@heroui/react/list-box";
import { SearchField } from "@heroui/react/search-field";
import type { Key } from "react";

import {
  cx,
  formFieldClass,
  formLabelClass,
  formSelectTriggerClass,
} from "./styles";

export type FormAutocompleteOption = {
  label: string;
  value: string;
};

type FormAutocompleteProps = {
  autoComplete?: string;
  disabled?: boolean;
  errorMessage?: string;
  label: string;
  name: string;
  onValueChange?: (
    value: string,
    context: { form: HTMLFormElement | null; name: string },
  ) => void;
  options: FormAutocompleteOption[];
  placeholder?: string;
  value: string;
};

export function FormAutocomplete({
  autoComplete,
  disabled,
  errorMessage,
  label,
  name,
  onValueChange,
  options,
  placeholder = "Seleccionar",
  value,
}: FormAutocompleteProps) {
  function handleSelectionChange(key: Key | null) {
    const nextValue = key ? String(key) : "";
    onValueChange?.(nextValue, {
      form: null,
      name,
    });
  }

  return (
    <div className={formFieldClass}>
      <span className={formLabelClass}>{label}</span>
      <Autocomplete
        aria-label={label}
        autoComplete={autoComplete}
        fullWidth
        isDisabled={disabled}
        isInvalid={Boolean(errorMessage)}
        name={name}
        placeholder={placeholder}
        selectedKey={value || null}
        onSelectionChange={handleSelectionChange}
      >
        <Autocomplete.Trigger
          className={cx(
            formSelectTriggerClass,
            errorMessage &&
              "border-danger hover:border-danger focus-visible:border-danger focus-visible:ring-danger/15",
          )}
        >
          <Autocomplete.Value className="flex min-h-0 min-w-0 flex-1 items-center truncate text-left font-normal text-base leading-[1.25] sm:text-[14px]" />
          <Autocomplete.Indicator className="size-4 shrink-0 self-center text-muted" />
        </Autocomplete.Trigger>
        <Autocomplete.Popover className="z-[80] w-[var(--trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg">
          <Autocomplete.Filter filter={filterOption}>
            <SearchField
              aria-label={`Buscar ${label.toLocaleLowerCase("es-CO")}`}
              className="border-border border-b p-2"
              fullWidth
            >
              <SearchField.Group className="relative flex h-10 items-center rounded-md border border-border bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
                <SearchField.SearchIcon className="ml-3 size-4 shrink-0 text-muted" />
                <SearchField.Input
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 font-normal text-base text-foreground outline-none placeholder:text-muted sm:text-[14px]"
                  placeholder={`Buscar ${label.toLocaleLowerCase("es-CO")}`}
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <SearchField.ClearButton className="mr-1 grid size-8 shrink-0 place-items-center text-muted" />
              </SearchField.Group>
            </SearchField>
            <ListBox
              aria-label={label}
              className="max-h-72 overflow-y-auto p-1 outline-none"
            >
              {options.map((option) => (
                <ListBox.Item
                  key={option.value}
                  id={option.value}
                  textValue={option.label}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 font-normal text-[15px] text-foreground outline-none transition hover:bg-surface-secondary data-[focused]:bg-surface-secondary data-[selected]:bg-accent-soft data-[selected]:font-medium data-[selected]:text-accent"
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  <ListBox.ItemIndicator className="grid size-4 shrink-0 place-items-center text-accent" />
                </ListBox.Item>
              ))}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
      {errorMessage ? (
        <span className="font-medium text-danger text-xs leading-4">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}

function filterOption(text: string, query: string) {
  return normalizeSearchText(text).includes(normalizeSearchText(query));
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .trim();
}
