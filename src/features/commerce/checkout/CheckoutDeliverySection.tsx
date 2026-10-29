"use client";

import type {
  CustomerAddress,
  WebsiteDeliveryOption,
  WebsiteFulfillmentFamily,
  WebsiteLocationOptions,
  WebsiteShippingQuote,
} from "@bacano/sdk";
import { ChevronDown, Store } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { FormAutocomplete, FormTextField } from "@/components/form";
import { storeConfig } from "@/config/store";
import {
  formatDeliveryOrderCountdown,
  formatEstimatedDeliveryDate,
  getEstimatedDeliveryDate,
  getStorePickupDayLabel,
} from "@/features/commerce/delivery-estimate";
import { CheckoutSavedAddressSelector } from "./CheckoutSavedAddressSelector";
import { DeliveryOptionCard } from "./DeliveryOptionCard";
import { formatQuoteAmount } from "./helpers";
import { ShippingQuoteCard } from "./ShippingQuoteCard";
import type { CheckoutFormState, CheckoutValidationErrors } from "./types";

/** Two placeholder rows while the real options load; keyed by slot, not index. */
const SKELETON_SLOTS = ["first", "second"] as const;

export function CheckoutDeliverySection({
  canQuoteShipping,
  deliveryError,
  deliveryLoading,
  deliveryOptions,
  form,
  hasCurrentShippingQuotes,
  locationError,
  locationOptions,
  municipalityOptions,
  onFieldChange,
  onFulfillmentFamilyChange,
  onSavedAddressSelect,
  onShippingQuoteSelect,
  selectedDeliveryOption,
  selectedFulfillmentFamily,
  selectedShippingQuoteId,
  separated = true,
  shippingError,
  shippingIsPending,
  shippingLoading,
  shippingQuotes,
  validationErrors,
}: {
  canQuoteShipping: boolean;
  deliveryError: string | null;
  deliveryLoading: boolean;
  deliveryOptions: WebsiteDeliveryOption[];
  form: CheckoutFormState;
  hasCurrentShippingQuotes: boolean;
  locationError: string | null;
  locationOptions: WebsiteLocationOptions | null;
  municipalityOptions: WebsiteLocationOptions["departments"][number]["municipalities"];
  onFieldChange: (field: keyof CheckoutFormState, value: string) => void;
  onFulfillmentFamilyChange: (value: WebsiteFulfillmentFamily) => void;
  onSavedAddressSelect: (address: CustomerAddress) => void;
  onShippingQuoteSelect: (quoteId: string) => void;
  selectedDeliveryOption: WebsiteDeliveryOption | null;
  selectedFulfillmentFamily: WebsiteFulfillmentFamily;
  selectedShippingQuoteId: string;
  separated?: boolean;
  shippingError: string | null;
  shippingIsPending: boolean;
  shippingLoading: boolean;
  shippingQuotes: WebsiteShippingQuote[];
  validationErrors: CheckoutValidationErrors;
}) {
  const selectedShippingQuote =
    shippingQuotes.find((quote) => quote.quoteId === selectedShippingQuoteId) ??
    null;

  return (
    <section
      className={
        separated ? "grid gap-4 border-border border-t pt-5" : "grid gap-4"
      }
    >
      <h2 className="font-medium text-foreground text-lg">Entrega</h2>
      {deliveryLoading ? (
        <DeliveryOptionsSkeleton />
      ) : deliveryError ? (
        <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-danger text-sm leading-6">
          {deliveryError}
        </p>
      ) : deliveryOptions.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {deliveryOptions.map((option) => {
            const isShipping = option.fulfillmentFamily === "SHIPPING";

            return (
              <DeliveryOptionCard
                key={option.id}
                option={option}
                selected={
                  selectedFulfillmentFamily === option.fulfillmentFamily
                }
                // The option's own label, as configured in Bacano: a store
                // renames "Envío" there, not in this file.
                detail={
                  isShipping ? (
                    <CheckoutDeliveryPromise quote={selectedShippingQuote} />
                  ) : (
                    <CheckoutPickupPromise />
                  )
                }
                onSelect={() =>
                  onFulfillmentFamilyChange(option.fulfillmentFamily)
                }
              />
            );
          })}
        </div>
      ) : deliveryOptions.length === 0 ? (
        <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-danger text-sm leading-6">
          No hay opciones de entrega disponibles para esta tienda.
        </p>
      ) : null}
      {validationErrors.delivery ? (
        <p className="font-medium text-danger text-xs">
          {validationErrors.delivery}
        </p>
      ) : null}

      {selectedDeliveryOption?.fulfillmentFamily === "PICKUP" ? (
        <SelectedPickupDetails option={selectedDeliveryOption} />
      ) : null}

      {selectedDeliveryOption?.fulfillmentFamily === "SHIPPING" ? (
        <div className="pt-2">
          <ShippingAddressFields
            canQuoteShipping={canQuoteShipping}
            form={form}
            hasCurrentShippingQuotes={hasCurrentShippingQuotes}
            locationError={locationError}
            locationOptions={locationOptions}
            municipalityOptions={municipalityOptions}
            selectedShippingQuoteId={selectedShippingQuoteId}
            shippingError={shippingError}
            shippingIsPending={shippingIsPending}
            shippingLoading={shippingLoading}
            shippingQuotes={shippingQuotes}
            validationErrors={validationErrors}
            selectedFulfillmentFamily={selectedFulfillmentFamily}
            onFieldChange={onFieldChange}
            onSavedAddressSelect={onSavedAddressSelect}
            onShippingQuoteSelect={onShippingQuoteSelect}
          />
        </div>
      ) : null}
    </section>
  );
}

function ShippingAddressFields({
  canQuoteShipping,
  form,
  hasCurrentShippingQuotes,
  locationError,
  locationOptions,
  municipalityOptions,
  onFieldChange,
  onSavedAddressSelect,
  onShippingQuoteSelect,
  selectedShippingQuoteId,
  shippingError,
  shippingIsPending,
  shippingLoading,
  shippingQuotes,
  validationErrors,
  selectedFulfillmentFamily,
}: {
  canQuoteShipping: boolean;
  form: CheckoutFormState;
  hasCurrentShippingQuotes: boolean;
  locationError: string | null;
  locationOptions: WebsiteLocationOptions | null;
  municipalityOptions: WebsiteLocationOptions["departments"][number]["municipalities"];
  onFieldChange: (field: keyof CheckoutFormState, value: string) => void;
  onSavedAddressSelect: (address: CustomerAddress) => void;
  onShippingQuoteSelect: (quoteId: string) => void;
  selectedShippingQuoteId: string;
  shippingError: string | null;
  shippingIsPending: boolean;
  shippingLoading: boolean;
  shippingQuotes: WebsiteShippingQuote[];
  validationErrors: CheckoutValidationErrors;
  selectedFulfillmentFamily: WebsiteFulfillmentFamily;
}) {
  const [hasSavedAddresses, setHasSavedAddresses] = useState(false);
  const [addressEntryMode, setAddressEntryMode] = useState<"saved" | "manual">(
    "saved",
  );
  const [showDeliveryInstructions, setShowDeliveryInstructions] =
    useState(false);
  const showManualAddressFields =
    !hasSavedAddresses || addressEntryMode === "manual";

  function clearShippingAddressFields() {
    onFieldChange("departmentId", "");
    onFieldChange("municipalityId", "");
    onFieldChange("address", "");
    onFieldChange("addressComplement", "");
    onFieldChange("notes", "");
  }

  return (
    <div className="grid gap-4">
      <CheckoutSavedAddressSelector
        addressEntryMode={addressEntryMode}
        form={form}
        selectedFulfillmentFamily={selectedFulfillmentFamily}
        onAddressEntryModeChange={setAddressEntryMode}
        onSavedAddressSelect={onSavedAddressSelect}
        onSavedAddressesChange={setHasSavedAddresses}
        onUseDifferentAddress={clearShippingAddressFields}
      />

      {showManualAddressFields ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <FormAutocomplete
              autoComplete="section-checkout shipping address-level1"
              errorMessage={validationErrors.departmentId}
              label="Departamento"
              name="departmentId"
              value={form.departmentId}
              placeholder={locationError ? "No disponible" : "Seleccionar"}
              options={
                locationOptions?.departments.map((department) => ({
                  label: department.departmentName,
                  value: department.departmentId,
                })) ?? []
              }
              onValueChange={(value) => onFieldChange("departmentId", value)}
            />
            <FormAutocomplete
              autoComplete="section-checkout shipping address-level2"
              errorMessage={validationErrors.municipalityId}
              label="Municipio"
              name="municipalityId"
              value={form.municipalityId}
              placeholder={
                form.departmentId ? "Seleccionar" : "Primero elige departamento"
              }
              options={municipalityOptions.map((municipality) => ({
                label: municipality.municipalityName,
                value: municipality.municipalityId,
              }))}
              disabled={!form.departmentId}
              onValueChange={(value) => onFieldChange("municipalityId", value)}
            />
          </div>
          {locationError ? (
            <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-danger text-sm leading-6">
              {locationError}
            </p>
          ) : null}
          <FormTextField
            autoComplete="section-checkout shipping address-line1"
            autoCapitalize="words"
            enterKeyHint="next"
            errorMessage={validationErrors.address}
            label="Direccion"
            name="address"
            value={form.address}
            onChange={(event) => onFieldChange("address", event.target.value)}
          />
          <button
            type="button"
            aria-expanded={showDeliveryInstructions}
            onClick={() => setShowDeliveryInstructions((current) => !current)}
            className="flex w-fit items-center gap-1.5 font-medium text-muted text-sm underline-offset-4 transition hover:text-foreground hover:underline"
          >
            <ChevronDown
              aria-hidden="true"
              size={17}
              className={`transition-transform ${
                showDeliveryInstructions ? "rotate-180" : ""
              }`}
            />
            Agregar indicaciones de entrega
          </button>
          {showDeliveryInstructions ? (
            <div className="grid gap-4 rounded-md border border-border bg-surface-secondary p-3 sm:grid-cols-2">
              <FormTextField
                autoComplete="section-checkout shipping address-line2"
                autoCapitalize="words"
                enterKeyHint="next"
                label="Apartamento / complemento"
                name="addressComplement"
                value={form.addressComplement}
                onChange={(event) =>
                  onFieldChange("addressComplement", event.target.value)
                }
              />
              <FormTextField
                autoComplete="off"
                enterKeyHint="done"
                label="Notas de entrega"
                name="deliveryNotes"
                value={form.notes}
                onChange={(event) => onFieldChange("notes", event.target.value)}
              />
            </div>
          ) : null}
        </>
      ) : null}

      <div className="grid gap-3">
        {shippingLoading || shippingIsPending ? (
          <ShippingQuotesSkeleton />
        ) : shippingError ? (
          <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-danger text-sm leading-6">
            {shippingError}
          </p>
        ) : hasCurrentShippingQuotes && shippingQuotes.length > 1 ? (
          <div className="grid gap-3">
            {shippingQuotes.map((quote) => (
              <ShippingQuoteCard
                key={quote.quoteId}
                quote={quote}
                selected={selectedShippingQuoteId === quote.quoteId}
                onSelect={() => onShippingQuoteSelect(quote.quoteId)}
              />
            ))}
          </div>
        ) : hasCurrentShippingQuotes ? null : canQuoteShipping ? (
          <p className="rounded-md border border-border bg-surface-secondary px-4 py-3 text-muted text-sm leading-6">
            No encontramos opciones de envio activas para esta direccion.
          </p>
        ) : null}
        {validationErrors.shippingQuote ? (
          <p className="font-medium text-danger text-xs">
            {validationErrors.shippingQuote}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CheckoutDeliveryPromise({
  quote,
}: {
  quote: WebsiteShippingQuote | null;
}) {
  const currentSecond = useSyncExternalStore(
    subscribeToCurrentSecond,
    readCurrentSecond,
    readServerSecond,
  );
  const now = currentSecond ? new Date(currentSecond * 1000) : null;
  const estimatedDate = now
    ? formatEstimatedDeliveryDate(getEstimatedDeliveryDate(now))
    : null;
  const countdown = now ? formatDeliveryOrderCountdown(now) : null;

  if (!estimatedDate || !countdown) return null;

  return (
    <>
      <span className="block font-normal text-muted text-xs leading-5">
        Recibelo antes del <span className="capitalize">{estimatedDate}</span>{" "}
        pidiendo en las proximas <StableCheckoutCountdown value={countdown} />
      </span>
      {quote ? (
        <span className="mt-0.5 block font-semibold text-accent text-xs">
          {quote.amount <= 0 ? "Envio gratis" : formatQuoteAmount(quote)}
        </span>
      ) : null}
    </>
  );
}

function CheckoutPickupPromise() {
  const currentSecond = useCurrentSecond();
  const now = currentSecond ? new Date(currentSecond * 1000) : null;
  const pickupDay = now ? getStorePickupDayLabel(now) : null;

  if (!pickupDay) return null;

  return (
    <>
      <span className="block font-normal text-muted text-xs leading-5">
        Puedes recogerlo {pickupDay} en tienda
      </span>
      <span className="mt-0.5 block font-semibold text-accent text-xs">
        Gratis
      </span>
    </>
  );
}

function SelectedPickupDetails({ option }: { option: WebsiteDeliveryOption }) {
  // Everything here comes from the pickup point configured in Bacano. Nothing
  // is hardcoded: a store with two branches would otherwise show one branch's
  // address for both.
  const pickup = option.pickupInfo;
  const address = pickup?.address ?? storeConfig.contact.addressLine;

  return (
    <article className="grid min-h-[120px] content-center gap-2 rounded-md border border-border bg-surface px-4 py-3 sm:px-5">
      <div className="flex items-start gap-3">
        <Store
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-accent"
          size={20}
        />
        <div className="min-w-0">
          <p className="font-medium text-[11px] text-muted">
            Recoger en tienda
          </p>
          <h3 className="mt-0.5 font-bold text-foreground text-sm leading-tight sm:text-base">
            {pickup?.label || option.label}
          </h3>
        </div>
      </div>

      {address ? (
        <address className="text-muted text-xs not-italic leading-[1.45] sm:text-sm">
          {address}
        </address>
      ) : null}
      {pickup?.schedule ? (
        <p className="text-muted text-xs leading-[1.45] sm:text-sm">
          {pickup.schedule}
        </p>
      ) : null}
      {pickup?.notes ? (
        <p className="text-muted text-xs leading-[1.45] sm:text-sm">
          {pickup.notes}
        </p>
      ) : null}
    </article>
  );
}

function useCurrentSecond() {
  return useSyncExternalStore(
    subscribeToCurrentSecond,
    readCurrentSecond,
    readServerSecond,
  );
}

function StableCheckoutCountdown({ value }: { value: string }) {
  const [hours, , minutes, , seconds] = value.split(" ");

  return (
    <>
      <strong
        aria-hidden="true"
        className="inline-grid grid-cols-[2ch_auto_2ch_auto_2ch_auto] items-baseline gap-x-0.5 whitespace-nowrap align-baseline font-semibold text-accent"
      >
        <span className="text-right tabular-nums">{hours}</span>
        <span>h</span>
        <span className="text-right tabular-nums">{minutes}</span>
        <span>min</span>
        <span className="text-right tabular-nums">{seconds}</span>
        <span>s</span>
      </strong>
      <span className="sr-only">{value}</span>
    </>
  );
}

function subscribeToCurrentSecond(onStoreChange: () => void) {
  const intervalId = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(intervalId);
}

function readCurrentSecond() {
  return Math.floor(Date.now() / 1000);
}

function readServerSecond() {
  return 0;
}

function DeliveryOptionsSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3 sm:grid-cols-2">
      {SKELETON_SLOTS.map((slot) => (
        <div
          key={slot}
          className="flex h-14 items-center gap-3 rounded-md border border-border bg-white px-3"
        >
          <div className="size-9 shrink-0 animate-pulse rounded-md bg-surface-secondary" />
          <div className="grid flex-1 gap-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-surface-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShippingQuotesSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3">
      {SKELETON_SLOTS.map((slot) => (
        <div
          key={slot}
          className="flex h-12 items-center gap-3 rounded-md border border-border bg-white px-3"
        >
          <div className="size-8 shrink-0 animate-pulse rounded-md bg-surface-secondary" />
          <div className="h-4 flex-1 animate-pulse rounded-full bg-surface-secondary" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-surface-secondary" />
        </div>
      ))}
    </div>
  );
}
