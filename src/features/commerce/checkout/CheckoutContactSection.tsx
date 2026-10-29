import { useAuth, useClerk, useUser } from "@clerk/react";
import { CircleCheck, LogOut } from "lucide-react";
import { type InputHTMLAttributes, useState } from "react";
import { FormPhoneField, FormTextField } from "@/components/form";
import {
  cx,
  formFieldClass,
  formInputClass,
  formLabelClass,
} from "@/components/form/styles";
import { useBuyerAccounts } from "@/features/account/BuyerAccountsProvider";

import type { CheckoutFormState, CheckoutValidationErrors } from "./types";

export function CheckoutContactSection({
  form,
  onFieldChange,
  validationErrors,
}: {
  form: CheckoutFormState;
  onFieldChange: (field: keyof CheckoutFormState, value: string) => void;
  validationErrors: CheckoutValidationErrors;
}) {
  const accounts = useBuyerAccounts();

  if (accounts.loading || !accounts.enabled) {
    return (
      <CheckoutContactFields
        form={form}
        onFieldChange={onFieldChange}
        validationErrors={validationErrors}
      />
    );
  }

  return (
    <CheckoutContactSectionWithAuth
      form={form}
      onFieldChange={onFieldChange}
      validationErrors={validationErrors}
    />
  );
}

function CheckoutContactSectionWithAuth({
  form,
  onFieldChange,
  validationErrors,
}: {
  form: CheckoutFormState;
  onFieldChange: (field: keyof CheckoutFormState, value: string) => void;
  validationErrors: CheckoutValidationErrors;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (isLoaded && isSignedIn) {
    const identity =
      [form.firstName, form.lastName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ") ||
      user?.fullName ||
      form.email ||
      user?.primaryEmailAddress?.emailAddress ||
      "tu cuenta";
    const email = form.email || user?.primaryEmailAddress?.emailAddress;

    return (
      <section className="grid gap-4">
        <h2 className="font-medium text-foreground text-lg">
          Datos de contacto
        </h2>
        <div className="grid gap-4 rounded-md border border-border bg-white px-4 py-4 text-muted text-sm shadow-[0_14px_34px_rgba(0,0,0,0.04)] sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <CircleCheck aria-hidden="true" size={18} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid min-w-0 gap-1">
                <p className="font-medium text-foreground">
                  Compras como {identity}
                </p>
                {email ? <p className="truncate text-muted">{email}</p> : null}
              </div>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true);
                  try {
                    await signOut({
                      redirectUrl:
                        window.location.pathname + window.location.search,
                    });
                    onFieldChange("firstName", "");
                    onFieldChange("lastName", "");
                    onFieldChange("email", "");
                    onFieldChange("phone", "");
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
                className="inline-flex w-fit items-center gap-1.5 font-medium text-muted text-sm underline-offset-4 transition hover:text-warning hover:underline"
              >
                <LogOut aria-hidden="true" size={15} />
                {isSigningOut ? "Cerrando..." : "Cerrar sesion"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-border border-t pt-4 sm:grid-cols-2">
            <NativeCheckoutInput
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="next"
              errorMessage={validationErrors.firstName}
              id="checkout-first-name"
              label="Nombre *"
              name="firstName"
              value={form.firstName}
              onChange={(event) =>
                onFieldChange("firstName", event.target.value)
              }
            />
            <FormTextField
              autoComplete="family-name"
              autoCapitalize="words"
              enterKeyHint="next"
              errorMessage={validationErrors.lastName}
              id="checkout-last-name"
              label="Apellido *"
              name="lastName"
              value={form.lastName}
              onChange={(event) =>
                onFieldChange("lastName", event.target.value)
              }
            />
            <FormPhoneField
              autoComplete="tel"
              enterKeyHint="next"
              errorMessage={validationErrors.phone}
              id="checkout-phone"
              label="WhatsApp / Telefono *"
              name="phone"
              value={form.phone}
              onChange={(value) => onFieldChange("phone", value)}
            />
            <NativeCheckoutInput
              autoComplete="email"
              autoCapitalize="none"
              enterKeyHint="next"
              errorMessage={validationErrors.email}
              id="checkout-email"
              inputMode="email"
              label="Correo *"
              name="email"
              spellCheck={false}
              type="email"
              value={form.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
            />
            <p className="text-muted text-xs leading-5 sm:col-span-2">
              Usaremos estos datos para confirmar y coordinar tu entrega.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <CheckoutContactFields
      form={form}
      onFieldChange={onFieldChange}
      validationErrors={validationErrors}
    />
  );
}

function CheckoutContactFields({
  form,
  onFieldChange,
  validationErrors,
}: {
  form: CheckoutFormState;
  onFieldChange: (field: keyof CheckoutFormState, value: string) => void;
  validationErrors: CheckoutValidationErrors;
}) {
  return (
    <section className="grid gap-4">
      <h2 className="font-medium text-foreground text-lg">Datos de contacto</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <NativeCheckoutInput
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          errorMessage={validationErrors.firstName}
          id="checkout-first-name"
          label="Nombre *"
          name="firstName"
          value={form.firstName}
          onChange={(event) => onFieldChange("firstName", event.target.value)}
        />
        <FormTextField
          autoComplete="family-name"
          autoCapitalize="words"
          enterKeyHint="next"
          errorMessage={validationErrors.lastName}
          id="checkout-last-name"
          label="Apellido *"
          name="lastName"
          value={form.lastName}
          onChange={(event) => onFieldChange("lastName", event.target.value)}
        />
      </div>
      <FormPhoneField
        autoComplete="tel"
        enterKeyHint="next"
        errorMessage={validationErrors.phone}
        id="checkout-phone"
        label="WhatsApp / Telefono *"
        name="phone"
        value={form.phone}
        onChange={(value) => onFieldChange("phone", value)}
      />
      <p className="-mt-2 text-muted text-xs leading-5">
        Solo lo usaremos para coordinar tu pedido o entrega.
      </p>
      <NativeCheckoutInput
        autoComplete="email"
        autoCapitalize="none"
        enterKeyHint="next"
        errorMessage={validationErrors.email}
        id="checkout-email"
        inputMode="email"
        label="Correo *"
        name="email"
        spellCheck={false}
        type="email"
        value={form.email}
        onChange={(event) => onFieldChange("email", event.target.value)}
      />
    </section>
  );
}

type NativeCheckoutInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  errorMessage?: string;
  label: string;
};

function NativeCheckoutInput({
  errorMessage,
  label,
  ...inputProps
}: NativeCheckoutInputProps) {
  return (
    <label className={formFieldClass}>
      <span className={formLabelClass}>{label}</span>
      <input
        {...inputProps}
        aria-invalid={Boolean(errorMessage)}
        className={cx(
          formInputClass,
          errorMessage &&
            "border-danger hover:border-danger focus:border-danger focus:ring-danger/15",
        )}
      />
      {errorMessage ? (
        <span className="font-medium text-danger text-xs leading-4">
          {errorMessage}
        </span>
      ) : null}
    </label>
  );
}
