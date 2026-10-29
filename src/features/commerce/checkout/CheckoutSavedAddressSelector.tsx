"use client";

import type { CustomerAddress, WebsiteFulfillmentFamily } from "@bacano/sdk";
import { useAuth } from "@clerk/react";
import { CheckCircle2, Loader2, MapPin, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useBuyerAccounts } from "@/features/account/BuyerAccountsProvider";
import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

import type { CheckoutFormState } from "./types";

type CheckoutSavedAddressSelectorProps = {
  addressEntryMode: "saved" | "manual";
  form: CheckoutFormState;
  selectedFulfillmentFamily: WebsiteFulfillmentFamily;
  onAddressEntryModeChange: (mode: "saved" | "manual") => void;
  onSavedAddressSelect: (address: CustomerAddress) => void;
  onSavedAddressesChange: (hasAddresses: boolean) => void;
  onUseDifferentAddress: () => void;
};

export function CheckoutSavedAddressSelector(
  props: CheckoutSavedAddressSelectorProps,
) {
  const accounts = useBuyerAccounts();

  if (accounts.loading || !accounts.enabled) return null;

  return <CheckoutSavedAddressSelectorInner {...props} />;
}

function CheckoutSavedAddressSelectorInner({
  addressEntryMode,
  form,
  onAddressEntryModeChange,
  onSavedAddressSelect,
  onSavedAddressesChange,
  onUseDifferentAddress,
  selectedFulfillmentFamily,
}: CheckoutSavedAddressSelectorProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const didApplyDefaultRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let isCancelled = false;

    async function loadAddresses() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const client = await getBacanoBrowserClient();
        const nextAddresses = await client.profile.getAddresses();

        if (isCancelled) return;

        setAddresses(nextAddresses);
        onSavedAddressesChange(nextAddresses.length > 0);
        setSelectedAddressId((current) => {
          if (nextAddresses.some((address) => address.id === current)) {
            return current;
          }

          return getPreferredAddress(nextAddresses)?.id ?? "";
        });
      } catch {
        if (!isCancelled) {
          setAddresses([]);
          setSelectedAddressId("");
          onSavedAddressesChange(false);
          setLoadError("No pudimos cargar tus direcciones guardadas.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAddresses();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, onSavedAddressesChange]);

  useEffect(() => {
    if (
      didApplyDefaultRef.current ||
      addressEntryMode !== "saved" ||
      selectedFulfillmentFamily !== "SHIPPING" ||
      addresses.length === 0 ||
      hasCanonicalShippingAddress(form)
    ) {
      return;
    }

    const preferredAddress = getPreferredAddress(addresses);
    if (!preferredAddress) return;

    didApplyDefaultRef.current = true;
    onSavedAddressSelect(preferredAddress);
  }, [
    addressEntryMode,
    addresses,
    form,
    onSavedAddressSelect,
    selectedFulfillmentFamily,
  ]);

  if (!isLoaded || !isSignedIn || selectedFulfillmentFamily !== "SHIPPING") {
    return null;
  }

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        className="flex items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2 text-muted text-sm"
      >
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Cargando direcciones guardadas...
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-danger text-sm leading-6">
        {loadError}
      </p>
    );
  }

  if (addresses.length === 0) return null;

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <MapPin aria-hidden="true" className="size-4 text-accent" />
        <p className="font-medium text-foreground text-sm">
          Usar una direccion guardada
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {addresses.map((address) => {
          const selected =
            addressEntryMode === "saved" && selectedAddressId === address.id;

          return (
            <button
              key={address.id}
              type="button"
              className={`grid gap-1 rounded-md border p-3 text-left text-sm transition ${
                selected
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border bg-white text-muted hover:border-accent"
              }`}
              onClick={() => {
                setSelectedAddressId(address.id);
                onAddressEntryModeChange("saved");
                onSavedAddressSelect(address);
              }}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-medium">{getAddressLabel(address)}</span>
                {selected ? (
                  <CheckCircle2
                    aria-label="Direccion seleccionada"
                    className="size-4 shrink-0 text-accent"
                  />
                ) : null}
              </span>
              <span>{address.line1}</span>
              {address.line2 ? (
                <span className="text-muted text-xs">{address.line2}</span>
              ) : null}
              <span className="text-muted text-xs">
                {[address.municipalityName, address.departmentName]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-1 inline-flex items-center gap-1.5 justify-self-start font-medium text-accent text-sm underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        onClick={() => {
          onAddressEntryModeChange("manual");
          onUseDifferentAddress();
        }}
      >
        <Truck aria-hidden="true" className="size-4" />
        Usar una direccion diferente
      </button>
    </div>
  );
}

function getPreferredAddress(addresses: CustomerAddress[]) {
  return addresses.find((address) => address.isPrimary) ?? addresses[0] ?? null;
}

function getAddressLabel(address: CustomerAddress) {
  if (address.label?.trim()) return address.label;
  if (address.isPrimary || address.type === "PRIMARY") {
    return "Direccion principal";
  }
  return "Direccion de envio";
}

function hasCanonicalShippingAddress(form: CheckoutFormState) {
  return Boolean(
    form.departmentId.trim() &&
      form.municipalityId.trim() &&
      form.address.trim(),
  );
}
