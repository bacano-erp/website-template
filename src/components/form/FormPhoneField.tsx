"use client";

import PhoneInput from "react-phone-number-input";

import { formFieldClass, formLabelClass } from "./styles";

type FormPhoneFieldProps = {
  autoComplete?: string;
  disabled?: boolean;
  enterKeyHint?:
    | "done"
    | "enter"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  errorMessage?: string;
  id?: string;
  label: string;
  name?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
};

export function FormPhoneField({
  autoComplete = "tel",
  disabled,
  enterKeyHint,
  errorMessage,
  id,
  label,
  name,
  onChange,
  placeholder = "WhatsApp / Telefono",
  required,
  value,
}: FormPhoneFieldProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the label wraps its field; Biome cannot see into the component
    <label className={formFieldClass}>
      <span className={formLabelClass}>{label}</span>
      <PhoneInput
        aria-invalid={Boolean(errorMessage)}
        autoComplete={autoComplete}
        className={`bacano-phone-input ${
          errorMessage ? "bacano-phone-input-error" : ""
        }`}
        countryCallingCodeEditable={false}
        defaultCountry="CO"
        disabled={disabled}
        enterKeyHint={enterKeyHint}
        international
        id={id}
        limitMaxLength
        name={name}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        placeholder={placeholder}
        required={required}
        value={value}
      />
      {errorMessage ? (
        <span className="font-medium text-danger text-xs leading-4">
          {errorMessage}
        </span>
      ) : null}
    </label>
  );
}
