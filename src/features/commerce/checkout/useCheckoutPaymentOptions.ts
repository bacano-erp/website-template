"use client";

import type { WebsiteDeliveryOption } from "@bacano/sdk";
import { useEffect, useMemo, useState } from "react";

import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

import {
  getCheckoutOptionErrorMessage,
  getDefaultPaymentSelection,
  sortPaymentOptions,
} from "./helpers";
import type { CheckoutPaymentMode, CheckoutPaymentOption } from "./types";

export function useCheckoutPaymentOptions(
  selectedDeliveryOption: WebsiteDeliveryOption | null,
) {
  const [paymentOptions, setPaymentOptions] = useState<CheckoutPaymentOption[]>(
    [],
  );
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<
    CheckoutPaymentMode | ""
  >("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");

  useEffect(() => {
    if (!selectedDeliveryOption) {
      return;
    }

    let isCancelled = false;
    const fulfillmentFamily = selectedDeliveryOption.fulfillmentFamily;

    async function loadPaymentOptions() {
      setPaymentsLoading(true);
      setPaymentError(null);
      setPaymentOptions([]);
      setSelectedPaymentMode("");
      setSelectedPaymentMethodId("");

      try {
        const client = await getBacanoBrowserClient();
        const options = await client.checkout.getPaymentOptions({
          fulfillmentFamily,
        });

        if (isCancelled) return;

        setPaymentOptions(options);
        const defaultSelection = getDefaultPaymentSelection(options);
        setSelectedPaymentMode(defaultSelection.mode);
        setSelectedPaymentMethodId(defaultSelection.methodId);
      } catch (caught) {
        if (!isCancelled) {
          setPaymentError(
            getCheckoutOptionErrorMessage(caught, "las opciones de pago"),
          );
        }
      } finally {
        if (!isCancelled) {
          setPaymentsLoading(false);
        }
      }
    }

    void loadPaymentOptions();

    return () => {
      isCancelled = true;
    };
  }, [selectedDeliveryOption]);

  const enabledPaymentOptions = useMemo(
    () => sortPaymentOptions(paymentOptions),
    [paymentOptions],
  );
  const visiblePaymentOptions = selectedDeliveryOption
    ? enabledPaymentOptions
    : [];
  const selectedPaymentOption = selectedDeliveryOption
    ? (visiblePaymentOptions.find(
        (option) => option.mode === selectedPaymentMode,
      ) ?? null)
    : null;
  const selectedPaymentMethod =
    selectedPaymentOption?.methods.find(
      (method) => method.paymentMethodId === selectedPaymentMethodId,
    ) ?? null;

  return {
    enabledPaymentOptions: visiblePaymentOptions,
    paymentError: selectedDeliveryOption ? paymentError : null,
    paymentOptions: selectedDeliveryOption ? paymentOptions : [],
    paymentsLoading: selectedDeliveryOption ? paymentsLoading : false,
    selectedPaymentMethod,
    selectedPaymentMethodId: selectedDeliveryOption
      ? selectedPaymentMethodId
      : "",
    selectedPaymentMode: selectedDeliveryOption ? selectedPaymentMode : "",
    selectedPaymentOption,
    setSelectedPaymentMethodId,
    setSelectedPaymentMode,
  };
}
