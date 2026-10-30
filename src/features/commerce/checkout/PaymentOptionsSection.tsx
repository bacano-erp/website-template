import {
  Banknote,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Image from "next/image";

import { formatMoneyCOP } from "@/lib/bacano/formatters";

import { sortPaymentMethods, sortPaymentOptions } from "./helpers";
import { allowsInitialPayment, requiresInitialPayment } from "./payment-policy";
import { getPaymentPresentation } from "./payment-presentation";
import type {
  CheckoutPaymentOption,
  CheckoutPaymentOptionMethod,
} from "./types";

/** Two placeholder rows while the real options load; keyed by slot, not index. */
const SKELETON_SLOTS = ["first", "second"] as const;

export function PaymentOptionsSection({
  error,
  initialPaymentAmount,
  loading,
  onInitialPaymentAmountChange,
  onSelectMethod,
  onSelectOption,
  options,
  selectedMethodId,
  selectedMode,
  validationError,
  variant = "default",
}: {
  error: string | null;
  initialPaymentAmount: string;
  loading: boolean;
  onInitialPaymentAmountChange: (value: string) => void;
  onSelectMethod: (method: CheckoutPaymentOptionMethod) => void;
  onSelectOption: (option: CheckoutPaymentOption) => void;
  options: CheckoutPaymentOption[];
  selectedMethodId: string;
  selectedMode: string;
  validationError?: string;
  variant?: "default" | "friendly";
}) {
  const sortedOptions = sortPaymentOptions(options);
  const isFriendly = variant === "friendly";

  return (
    <section
      className={
        isFriendly ? "grid gap-4" : "grid gap-4 border-border border-t pt-5"
      }
    >
      {isFriendly ? (
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-foreground">
            <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent">
              <ShieldCheck aria-hidden="true" size={19} strokeWidth={2.2} />
            </span>
            <h2 className="font-medium text-foreground text-lg">
              <span className="sm:hidden">Medio de pago</span>
              <span className="hidden sm:inline">Pago</span>
            </h2>
          </div>
          <p className="text-muted text-sm leading-6 sm:hidden">
            El pago se realiza despues de confirmar tu pedido.
          </p>
          <p className="hidden text-muted text-sm leading-6 sm:block">
            Todas las transacciones son seguras y estan encriptadas.
          </p>
        </div>
      ) : (
        <h2 className="font-medium text-foreground text-lg">Metodo de pago</h2>
      )}
      {loading ? (
        <PaymentOptionsSkeleton />
      ) : error ? (
        <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-danger text-sm leading-6">
          {error}
        </p>
      ) : sortedOptions.length > 0 ? (
        isFriendly ? (
          <FriendlyPaymentOptions
            options={sortedOptions}
            initialPaymentAmount={initialPaymentAmount}
            selectedMethodId={selectedMethodId}
            selectedMode={selectedMode}
            onInitialPaymentAmountChange={onInitialPaymentAmountChange}
            onSelectMethod={onSelectMethod}
            onSelectOption={onSelectOption}
          />
        ) : (
          <div className="grid gap-3">
            {sortedOptions.map((option) => (
              <PaymentOptionCard
                key={option.id}
                option={option}
                selected={selectedMode === option.mode}
                initialPaymentAmount={initialPaymentAmount}
                selectedMethodId={selectedMethodId}
                onInitialPaymentAmountChange={onInitialPaymentAmountChange}
                onSelectOption={() => onSelectOption(option)}
                onSelectMethod={onSelectMethod}
              />
            ))}
          </div>
        )
      ) : (
        <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-danger text-sm leading-6">
          No hay opciones de pago disponibles para esta entrega.
        </p>
      )}
      {validationError ? (
        <p className="font-medium text-danger text-xs">{validationError}</p>
      ) : null}
    </section>
  );
}

function FriendlyPaymentOptions({
  initialPaymentAmount,
  onInitialPaymentAmountChange,
  onSelectMethod,
  onSelectOption,
  options,
  selectedMethodId,
  selectedMode,
}: {
  initialPaymentAmount: string;
  onInitialPaymentAmountChange: (value: string) => void;
  onSelectMethod: (method: CheckoutPaymentOptionMethod) => void;
  onSelectOption: (option: CheckoutPaymentOption) => void;
  options: CheckoutPaymentOption[];
  selectedMethodId: string;
  selectedMode: string;
}) {
  const choices = options.reduce<FriendlyPaymentChoice[]>((result, option) => {
    const methods = sortPaymentMethods(option.methods);

    if (option.requiresPaymentMethod) {
      for (const method of methods) result.push({ method, option });
      return result;
    }

    result.push({ method: null, option });
    return result;
  }, []);
  const hasSingleChoice = choices.length === 1;

  return (
    <div className="grid gap-3">
      {choices.map(({ method, option }) => {
        const selected = method
          ? selectedMode === option.mode &&
            selectedMethodId === method.paymentMethodId
          : selectedMode === option.mode;
        const content = getFriendlyPaymentContent(option, method);
        const key = method?.paymentMethodId ?? option.id;
        const isConfirmedSingleChoice = hasSingleChoice && selected;

        return (
          <div key={key} className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectOption(option);
                if (method) onSelectMethod(method);
              }}
              className={`flex w-full items-start gap-3 rounded-md border px-4 py-4 text-left transition ${
                selected
                  ? `border-accent-soft bg-accent-soft sm:border-accent sm:shadow-[0_14px_30px_color-mix(in_oklab,var(--accent)_10%,transparent)] sm:ring-2 sm:ring-accent/15 ${
                      isConfirmedSingleChoice
                        ? "pointer-events-none sm:pointer-events-auto"
                        : ""
                    }`
                  : "border-border bg-white hover:border-accent"
              }`}
              aria-pressed={selected}
              aria-disabled={isConfirmedSingleChoice || undefined}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-md ${
                  selected
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-secondary text-foreground"
                }`}
              >
                {content.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 font-medium text-foreground text-sm leading-5">
                  <span>{content.title}</span>
                  {selected ? (
                    <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[11px] text-accent">
                      <CheckCircle2 aria-hidden="true" size={14} />
                      Seleccionado
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-muted text-xs leading-5 sm:mt-1 sm:text-sm">
                  {selected && content.title === "Pago en linea"
                    ? "Paga de forma segura al confirmar tu pedido."
                    : content.description}
                </span>
                {content.badges.length > 0 ? (
                  <span
                    className="mt-2 -ml-[52px] flex w-[calc(100%+52px)] flex-nowrap justify-between gap-1 sm:ml-0 sm:w-auto sm:justify-start sm:gap-1.5"
                    role="img"
                    aria-label="Medios disponibles"
                  >
                    {content.badges.map((badge) => (
                      <PaymentMethodLogo key={badge} name={badge} />
                    ))}
                  </span>
                ) : null}
                <PaymentRequirementLabel option={option} />
              </span>
            </button>
            {selected ? (
              <InitialPaymentField
                amount={initialPaymentAmount}
                option={option}
                onAmountChange={onInitialPaymentAmountChange}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type FriendlyPaymentChoice = {
  method: CheckoutPaymentOptionMethod | null;
  option: CheckoutPaymentOption;
};

const PAYMENT_METHOD_LOGOS = {
  Amex: {
    alt: "American Express",
    height: 35,
    src: "/images/payment-methods/amex.png",
    width: 60,
  },
  Visa: {
    alt: "Visa",
    height: 14,
    src: "/images/payment-methods/visa.png",
    width: 43,
  },
  Mastercard: {
    alt: "Mastercard",
    height: 22,
    src: "/images/payment-methods/mastercard.svg",
    width: 36,
  },
  PSE: {
    alt: "PSE",
    height: 24,
    src: "/images/payment-methods/pse.jpg",
    width: 24,
  },
  Nequi: {
    alt: "Nequi",
    height: 16,
    src: "/images/payment-methods/nequi.svg",
    width: 48,
  },
  DaviPlata: {
    alt: "DaviPlata",
    height: 1008,
    src: "/images/payment-methods/daviplata.png",
    width: 1875,
  },
} as const;

function PaymentMethodLogo({
  name,
}: {
  name: keyof typeof PAYMENT_METHOD_LOGOS;
}) {
  const logo = PAYMENT_METHOD_LOGOS[name];
  const needsMoreVisualWeight =
    name === "PSE" || name === "Amex" || name === "DaviPlata";

  return (
    <span
      className={`grid h-7 w-11 shrink-0 place-items-center overflow-hidden rounded border border-border bg-white sm:h-8 sm:w-14 sm:p-1 ${
        needsMoreVisualWeight ? "p-0.5" : "p-1"
      }`}
    >
      <Image
        referrerPolicy="no-referrer"
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        className={
          name === "Amex"
            ? "max-h-6 max-w-full scale-[1.3] object-contain"
            : needsMoreVisualWeight
              ? "max-h-6 w-auto max-w-full object-contain"
              : "max-h-4 w-auto max-w-full object-contain sm:max-h-6"
        }
      />
    </span>
  );
}

function PaymentOptionsSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3">
      {SKELETON_SLOTS.map((slot) => (
        <div
          key={slot}
          className="flex items-start gap-3 rounded-md border border-border bg-white p-4"
        >
          <div className="mt-1 size-4 animate-pulse rounded-full bg-surface-secondary" />
          <div className="size-10 shrink-0 animate-pulse rounded-md bg-surface-secondary" />
          <div className="grid flex-1 gap-2">
            <div className="h-4 w-40 animate-pulse rounded-full bg-surface-secondary" />
            <div className="h-4 w-8/12 animate-pulse rounded-full bg-surface-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentOptionCard({
  initialPaymentAmount,
  onInitialPaymentAmountChange,
  onSelectMethod,
  onSelectOption,
  option,
  selected,
  selectedMethodId,
}: {
  initialPaymentAmount: string;
  onInitialPaymentAmountChange: (value: string) => void;
  onSelectMethod: (method: CheckoutPaymentOptionMethod) => void;
  onSelectOption: () => void;
  option: CheckoutPaymentOption;
  selected: boolean;
  selectedMethodId: string;
}) {
  const methods = sortPaymentMethods(option.methods);
  const optionContent = getPaymentPresentation({
    optionDescription: option.description,
    optionLabel: option.label,
  });

  return (
    <div
      className={`rounded-md border bg-white transition ${
        selected
          ? "border-accent shadow-[0_14px_30px_color-mix(in_oklab,var(--accent)_10%,transparent)] ring-2 ring-accent/15"
          : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={onSelectOption}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-pressed={selected}
      >
        <input
          type="radio"
          name="paymentMode"
          checked={selected}
          readOnly
          className="mt-1 accent-accent"
        />
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-md ${
            selected
              ? "bg-accent-soft text-accent"
              : "bg-surface-secondary text-foreground"
          }`}
        >
          {getPaymentModeIcon(option.mode)}
        </span>
        <span className="min-w-0">
          <span className="block font-medium text-foreground text-sm leading-5">
            {optionContent.title}
          </span>
          {optionContent.description ? (
            <span className="mt-1 block text-muted text-sm leading-5">
              {optionContent.description}
            </span>
          ) : null}
          <PaymentRequirementLabel option={option} />
        </span>
      </button>

      {selected && option.requiresPaymentMethod ? (
        <div className="grid gap-2 border-border border-t px-4 pt-3 pb-4">
          {methods.length > 0 ? (
            methods.map((method) => {
              const methodContent = getPaymentPresentation({
                methodDescription: method.description,
                methodInstructions: method.instructions,
                methodLabel: method.label,
                optionDescription: option.description,
                optionLabel: option.label,
              });

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onSelectMethod(method)}
                  className={`flex items-start gap-3 rounded-md border px-3 py-3 text-left transition ${
                    selectedMethodId === method.paymentMethodId
                      ? "border-accent bg-accent-soft"
                      : "border-border hover:border-accent"
                  }`}
                  aria-pressed={selectedMethodId === method.paymentMethodId}
                >
                  <input
                    type="radio"
                    name={`paymentMethod-${option.mode}`}
                    checked={selectedMethodId === method.paymentMethodId}
                    readOnly
                    className="mt-1 accent-accent"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground text-sm">
                      {methodContent.title}
                    </span>
                    <span className="mt-1 block text-muted text-sm leading-5">
                      {methodContent.description}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="rounded-md bg-surface-secondary px-3 py-2 text-muted text-sm">
              Esta opcion aun no tiene metodos configurados.
            </p>
          )}
        </div>
      ) : null}

      {selected ? (
        <div className="px-4 pb-4">
          <InitialPaymentField
            amount={initialPaymentAmount}
            option={option}
            onAmountChange={onInitialPaymentAmountChange}
          />
        </div>
      ) : null}
    </div>
  );
}

function PaymentRequirementLabel({
  option,
}: {
  option: CheckoutPaymentOption;
}) {
  if (!allowsInitialPayment(option)) return null;

  const minCopy =
    option.minInitialAmount !== null
      ? ` Minimo ${formatMoneyCOP(option.minInitialAmount)}.`
      : "";

  return (
    <span className="mt-2 block font-medium text-accent text-xs">
      {requiresInitialPayment(option)
        ? `Requiere abono inicial.${minCopy}`
        : `Permite abono inicial.${minCopy}`}
    </span>
  );
}

function InitialPaymentField({
  amount,
  onAmountChange,
  option,
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  option: CheckoutPaymentOption;
}) {
  if (!allowsInitialPayment(option)) return null;

  return (
    <label className="grid gap-2 rounded-md border border-accent-soft bg-accent-soft p-3 text-sm">
      <span className="font-medium text-foreground">
        {requiresInitialPayment(option) ? "Abono inicial" : "Abono opcional"}
      </span>
      <input
        autoComplete="off"
        inputMode="numeric"
        name="initialPaymentAmount"
        type="number"
        min={option.minInitialAmount ?? 0}
        step={1000}
        value={amount}
        onChange={(event) => onAmountChange(event.currentTarget.value)}
        className="h-11 rounded-md border border-border bg-white px-3 font-medium text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 sm:text-sm"
        placeholder={
          option.suggestedInitialAmount !== null
            ? String(option.suggestedInitialAmount)
            : "Valor del abono"
        }
      />
      <span className="text-muted text-xs leading-5">
        {option.suggestedInitialAmount !== null
          ? `Sugerido: ${formatMoneyCOP(option.suggestedInitialAmount)}. `
          : ""}
        {option.minInitialAmount !== null
          ? `Minimo: ${formatMoneyCOP(option.minInitialAmount)}.`
          : "Bacano validara el valor al confirmar el pedido."}
      </span>
    </label>
  );
}

function getPaymentModeIcon(mode: string) {
  if (mode === "cash_on_delivery") {
    return <Banknote size={21} strokeWidth={2} />;
  }
  if (mode === "pay_later") {
    return <WalletCards size={21} strokeWidth={2} />;
  }
  return <CreditCard size={21} strokeWidth={2} />;
}

function getFriendlyPaymentContent(
  option: CheckoutPaymentOption,
  method: CheckoutPaymentOptionMethod | null,
) {
  const presentation = getPaymentPresentation({
    methodDescription: method?.description,
    methodInstructions: method?.instructions,
    methodLabel: method?.label,
    optionDescription: option.description,
    optionLabel: option.label,
  });

  return {
    ...presentation,
    icon: getPaymentModeIcon(option.mode),
  };
}
