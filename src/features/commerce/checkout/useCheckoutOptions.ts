"use client";

import type {
  WebsiteDeliveryOption,
  WebsiteFulfillmentFamily,
  WebsiteLocationOptions,
} from "@bacano/sdk";
import { useEffect, useMemo, useState } from "react";

import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";

import { getCheckoutOptionErrorMessage } from "./helpers";

export function useCheckoutOptions() {
  const [locationOptions, setLocationOptions] =
    useState<WebsiteLocationOptions | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<
    WebsiteDeliveryOption[]
  >([]);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [selectedFulfillmentFamily, setSelectedFulfillmentFamily] =
    useState<WebsiteFulfillmentFamily>("SHIPPING");

  useEffect(() => {
    let isCancelled = false;

    async function loadCheckoutOptions() {
      setDeliveryLoading(true);
      setLocationError(null);
      setDeliveryError(null);

      try {
        const client = await getBacanoBrowserClient();
        const [locationsResult, deliveryResult] = await Promise.allSettled([
          client.checkout.getLocationOptions(),
          client.checkout.getDeliveryOptions(),
        ]);

        if (isCancelled) return;

        if (locationsResult.status === "fulfilled") {
          setLocationOptions(locationsResult.value);
        } else {
          setLocationOptions(null);
          setLocationError(
            getCheckoutOptionErrorMessage(
              locationsResult.reason,
              "las ubicaciones",
            ),
          );
        }

        if (deliveryResult.status === "fulfilled") {
          setDeliveryOptions(deliveryResult.value);
          setSelectedFulfillmentFamily((current) => {
            const enabledOptions = deliveryResult.value.filter(
              (option) => option.isEnabled,
            );
            if (enabledOptions.length === 0) return current;
            return enabledOptions.some(
              (option) => option.fulfillmentFamily === current,
            )
              ? current
              : enabledOptions[0].fulfillmentFamily;
          });
        } else {
          setDeliveryOptions([]);
          setDeliveryError(
            getCheckoutOptionErrorMessage(
              deliveryResult.reason,
              "las opciones de entrega",
            ),
          );
        }
      } catch (caught) {
        if (!isCancelled) {
          setLocationOptions(null);
          setDeliveryOptions([]);
          setLocationError(
            getCheckoutOptionErrorMessage(caught, "las ubicaciones"),
          );
          setDeliveryError(
            getCheckoutOptionErrorMessage(caught, "las opciones de entrega"),
          );
        }
      } finally {
        if (!isCancelled) {
          setDeliveryLoading(false);
        }
      }
    }

    void loadCheckoutOptions();

    return () => {
      isCancelled = true;
    };
  }, []);

  const enabledDeliveryOptions = useMemo(
    () => deliveryOptions.filter((option) => option.isEnabled),
    [deliveryOptions],
  );
  const selectedDeliveryOption =
    enabledDeliveryOptions.find(
      (option) => option.fulfillmentFamily === selectedFulfillmentFamily,
    ) ?? null;

  return {
    deliveryError,
    deliveryLoading,
    deliveryOptions,
    enabledDeliveryOptions,
    locationError,
    locationOptions,
    selectedDeliveryOption,
    selectedFulfillmentFamily,
    setSelectedFulfillmentFamily,
  };
}
