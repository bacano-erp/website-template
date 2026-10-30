"use client";

import type {
  CheckoutResult,
  CustomerAddress,
  WebsiteCheckoutAddress,
  WebsiteCouponActionResult,
  WebsiteDeliveryOption,
  WebsiteFulfillmentFamily,
  WebsiteShippingQuote,
} from "@bacano/sdk";
import { useMarketing } from "@bacano/sdk/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FocusEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useBuyerAccounts } from "@/features/account/BuyerAccountsProvider";
import { useCart } from "@/features/commerce/cart/CartProvider";
import { createCheckoutWhatsAppUrl } from "@/features/commerce/checkout/whatsapp";
import { getBacanoBrowserClient } from "@/lib/bacano/browser-client";
import { formatMoneyCOP } from "@/lib/bacano/formatters";
import { CheckoutAuthPrefill } from "./CheckoutAuthPrefill";
import { CheckoutContactSection } from "./CheckoutContactSection";
import { CheckoutDeliverySection } from "./CheckoutDeliverySection";
import { CheckoutLegalAcceptance } from "./CheckoutLegalAcceptance";
import { CheckoutOrderReviewPanel } from "./CheckoutOrderReviewPanel";
import { CheckoutPaymentLoadingOverlay } from "./CheckoutPaymentLoadingOverlay";
import { CheckoutLoadingSkeleton } from "./CheckoutSkeletons";
import { CheckoutSuccessView } from "./CheckoutSuccessView";
import { CheckoutSummary } from "./CheckoutSummary";
import { CheckoutWhatsAppHelp } from "./CheckoutWhatsAppHelp";
import {
  getFirstValidationError,
  keepFocusedFieldAboveKeyboard,
  MobileCheckoutContinueButton,
  MobileCheckoutPendingSection,
  scrollToCheckoutSection,
  scrollToMobileCheckoutStep,
} from "./checkout-mobile";
import {
  getCheckoutFormValidationErrors,
  getContactPayload,
  getCouponMessage,
  getErrorMessage,
  initialCheckoutForm,
  isValidCheckoutEmail,
  isValidCheckoutPhone,
  sortPaymentMethods,
} from "./helpers";
import { MobileCheckoutPreview } from "./MobileCheckoutPreview";
import {
  getOrderSuccessPath,
  saveOrderSuccessSnapshot,
} from "./order-success-storage";
import { PaymentOptionsSection } from "./PaymentOptionsSection";
import { allowsInitialPayment, requiresInitialPayment } from "./payment-policy";
import { getPaymentDisplayLabel } from "./payment-presentation";
import type {
  CheckoutFormState,
  CheckoutPaymentOption,
  CheckoutPaymentOptionMethod,
  CheckoutSuccessSnapshot,
  CheckoutValidationErrors,
  CheckoutValidationField,
} from "./types";
import { useCheckoutOptions } from "./useCheckoutOptions";
import { useCheckoutPaymentOptions } from "./useCheckoutPaymentOptions";
import { useFreeShippingProgress } from "./useFreeShippingProgress";

type CheckoutViewProps = {
  mode?: "classic" | "one-page";
};

type MobileCheckoutStep = 1 | 2 | 3;

export function CheckoutView({ mode = "classic" }: CheckoutViewProps = {}) {
  const router = useRouter();
  const marketing = useMarketing();
  const { website } = useBuyerAccounts();
  const {
    cart,
    clearCart,
    error,
    isLoading,
    isAvailabilityLoading,
    removeItem,
    refreshAvailability,
    startCheckout,
    setItemQuantity,
    variantLiveStateById,
  } = useCart();
  const [form, setForm] = useState(initialCheckoutForm);
  const [shippingQuotes, setShippingQuotes] = useState<WebsiteShippingQuote[]>(
    [],
  );
  const [selectedShippingQuoteId, setSelectedShippingQuoteId] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingQuoteResultKey, setShippingQuoteResultKey] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<WebsiteCouponActionResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [successSnapshot, setSuccessSnapshot] =
    useState<CheckoutSuccessSnapshot | null>(null);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] =
    useState<CheckoutValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [mobileCheckoutStep, setMobileCheckoutStep] =
    useState<MobileCheckoutStep>(1);
  const focusedFieldScrollTimeoutRef = useRef<number | null>(null);
  const lastStartedCheckoutKeyRef = useRef("");
  const loadedCartAvailabilityRef = useRef(false);
  const lastShippingQuoteKeyRef = useRef("");
  const lastMarketingShippingKeyRef = useRef("");
  const lastMarketingPaymentKeyRef = useRef("");
  const {
    deliveryError,
    deliveryLoading,
    enabledDeliveryOptions,
    locationError,
    locationOptions,
    selectedDeliveryOption,
    selectedFulfillmentFamily,
    setSelectedFulfillmentFamily,
  } = useCheckoutOptions();
  const {
    enabledPaymentOptions,
    paymentError,
    paymentsLoading,
    selectedPaymentMethod,
    selectedPaymentMethodId,
    selectedPaymentMode,
    selectedPaymentOption,
    setSelectedPaymentMethodId,
    setSelectedPaymentMode,
  } = useCheckoutPaymentOptions(selectedDeliveryOption);

  const items = useMemo(() => cart?.items ?? [], [cart?.items]);

  useEffect(() => {
    if (items.length === 0 || loadedCartAvailabilityRef.current) return;
    loadedCartAvailabilityRef.current = true;
    void refreshAvailability(true);
  }, [items.length, refreshAvailability]);

  useEffect(
    () => () => {
      if (focusedFieldScrollTimeoutRef.current !== null) {
        window.clearTimeout(focusedFieldScrollTimeoutRef.current);
      }
    },
    [],
  );
  const displayInitialPaymentAmount =
    initialPaymentAmount ||
    getDefaultInitialPaymentAmount(selectedPaymentOption);
  const subtotal =
    appliedCoupon?.cart?.totals.subtotal ??
    cart?.totals.subtotal ??
    cart?.totals.total ??
    0;
  const discount =
    appliedCoupon?.cart?.totals.discount ?? cart?.totals.discount ?? 0;
  const selectedDepartment = useMemo(
    () =>
      locationOptions?.departments.find(
        (department) => department.departmentId === form.departmentId,
      ) ?? null,
    [form.departmentId, locationOptions],
  );
  const municipalityOptions = selectedDepartment?.municipalities ?? [];
  const selectedMunicipality =
    municipalityOptions.find(
      (municipality) => municipality.municipalityId === form.municipalityId,
    ) ?? null;
  const selectedShippingQuote =
    shippingQuotes.find((quote) => quote.quoteId === selectedShippingQuoteId) ??
    null;
  const quotedShippingAmount =
    selectedFulfillmentFamily === "SHIPPING"
      ? (selectedShippingQuote?.amount ?? null)
      : 0;
  const shippingAmount = quotedShippingAmount;
  const total = Math.max(0, subtotal - discount + (shippingAmount ?? 0));
  const formIsBusy =
    isLoading ||
    isSubmitting ||
    deliveryLoading ||
    paymentsLoading ||
    shippingLoading ||
    couponLoading;
  const checkoutActionLabel = isSubmitting
    ? "Procesando..."
    : selectedPaymentOption?.requiresPaymentMethod
      ? `Pagar ${formatMoneyCOP(total)}`
      : "Confirmar pedido";
  const showPaymentLoading =
    isRedirectingToPayment ||
    (isSubmitting && Boolean(selectedPaymentOption?.requiresPaymentMethod));
  const localCartSignature = useMemo(
    () =>
      items
        .map((item) => `${item.productVariantId}:${item.quantity}`)
        .sort()
        .join("|"),
    [items],
  );
  const marketingItems = useMemo(
    () =>
      items.map((item) => ({
        itemId: item.productVariantId,
        itemName: item.productVariant.product.name,
        sku: item.productVariant.sku,
        price: item.productVariant.pricing.currentPrice,
        quantity: item.quantity,
        itemVariant: item.productVariant.attributes
          .map((attribute) => attribute.value)
          .join(" / "),
      })),
    [items],
  );
  const shippingQuoteItems = useMemo(
    () =>
      items.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      })),
    [items],
  );
  const freeShippingProgress = useFreeShippingProgress(
    items,
    selectedFulfillmentFamily === "SHIPPING",
  );
  const checkoutContact = useMemo(() => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const validPhone = isValidCheckoutPhone(phone) ? phone : undefined;
    const name = [firstName, lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

    return {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      name: name || undefined,
      email: isValidCheckoutEmail(email) ? email : undefined,
      cellphone: validPhone,
      phone: validPhone,
    };
  }, [form.email, form.firstName, form.lastName, form.phone]);

  const canStartCheckout =
    isValidCheckoutEmail(form.email) || isValidCheckoutPhone(form.phone);
  const canQuoteShipping = Boolean(
    selectedFulfillmentFamily === "SHIPPING" &&
      items.length > 0 &&
      form.departmentId &&
      form.municipalityId,
  );
  const shippingQuoteAddress = useMemo<WebsiteCheckoutAddress | null>(() => {
    if (!canQuoteShipping) {
      return null;
    }

    return {
      departmentId: form.departmentId,
      departmentName: selectedDepartment?.departmentName,
      municipalityId: form.municipalityId,
      municipalityName: selectedMunicipality?.municipalityName,
      line1: form.address.trim() || undefined,
      line2: form.addressComplement.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
  }, [
    form.addressComplement,
    canQuoteShipping,
    form.address,
    form.departmentId,
    form.municipalityId,
    form.notes,
    selectedDepartment,
    selectedMunicipality,
  ]);
  const shippingQuoteKey = useMemo(
    () =>
      shippingQuoteAddress
        ? JSON.stringify({
            address: shippingQuoteAddress,
            items: localCartSignature,
          })
        : "",
    [localCartSignature, shippingQuoteAddress],
  );
  const shippingIsPending = Boolean(
    shippingQuoteKey && shippingQuoteResultKey !== shippingQuoteKey,
  );
  const hasCurrentShippingQuotes = Boolean(
    shippingQuoteKey &&
      shippingQuoteResultKey === shippingQuoteKey &&
      shippingQuotes.length > 0,
  );

  useEffect(() => {
    if (items.length === 0 || !canStartCheckout) return;

    const checkoutKey = JSON.stringify({
      email: checkoutContact.email ?? "",
      fulfillmentFamily: selectedFulfillmentFamily,
      items: localCartSignature,
      name: checkoutContact.name ?? "",
      phone: checkoutContact.phone ?? "",
    });

    if (lastStartedCheckoutKeyRef.current === checkoutKey) return;

    const timeoutId = window.setTimeout(() => {
      lastStartedCheckoutKeyRef.current = checkoutKey;
      startCheckout(checkoutContact, selectedFulfillmentFamily).catch(
        (caught) => {
          if (lastStartedCheckoutKeyRef.current === checkoutKey) {
            lastStartedCheckoutKeyRef.current = "";
          }

          setLocalError(getErrorMessage(caught));
        },
      );
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    canStartCheckout,
    checkoutContact,
    items.length,
    localCartSignature,
    selectedFulfillmentFamily,
    startCheckout,
  ]);

  useEffect(() => {
    if (!shippingQuoteAddress || !shippingQuoteKey) return;

    const address = shippingQuoteAddress;
    const quoteKey = shippingQuoteKey;

    if (lastShippingQuoteKeyRef.current === quoteKey) return;

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      async function loadShippingQuotes() {
        setShippingLoading(true);
        setLocalError(null);
        setShippingError(null);
        setStatusMessage(null);
        lastShippingQuoteKeyRef.current = quoteKey;

        try {
          const client = await getBacanoBrowserClient();
          const quotes = await client.checkout.getShippingQuotes({
            address,
            items: shippingQuoteItems,
          });

          if (isCancelled) return;

          setShippingQuotes(quotes);
          setSelectedShippingQuoteId(quotes[0]?.quoteId ?? "");
          setShippingQuoteResultKey(quoteKey);
        } catch (caught) {
          if (!isCancelled) {
            lastShippingQuoteKeyRef.current = "";
            setShippingQuoteResultKey(quoteKey);
            setShippingQuotes([]);
            setSelectedShippingQuoteId("");
            setShippingError(getErrorMessage(caught));
          }
        } finally {
          if (!isCancelled) {
            setShippingLoading(false);
          }
        }
      }

      void loadShippingQuotes();
    }, 700);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [shippingQuoteAddress, shippingQuoteItems, shippingQuoteKey]);

  function updateFormField(field: keyof CheckoutFormState, value: string) {
    clearValidationErrors(
      field,
      ...(field === "departmentId"
        ? (["municipalityId", "shippingQuote"] as const)
        : []),
    );
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "departmentId") {
        next.municipalityId = "";
      }

      return next;
    });

    if (
      field === "departmentId" ||
      field === "municipalityId" ||
      field === "address" ||
      field === "addressComplement" ||
      field === "notes"
    ) {
      lastShippingQuoteKeyRef.current = "";
      setShippingQuoteResultKey("");
      setShippingError(null);
      setShippingQuotes([]);
      setSelectedShippingQuoteId("");
    }
  }

  function continueToDelivery() {
    const nextValidationErrors = getCheckoutFormValidationErrors(form, {
      requiresShipping: false,
    });
    setValidationErrors(nextValidationErrors);

    const firstValidationError = getFirstValidationError(nextValidationErrors);
    if (firstValidationError) {
      scrollToCheckoutSection(firstValidationError);
      return;
    }

    setMobileCheckoutStep((current) => (current < 2 ? 2 : current));
    scrollToMobileCheckoutStep("checkout-delivery-section");
  }

  function continueToPayment() {
    const nextValidationErrors = getCheckoutFormValidationErrors(form, {
      requiresShipping:
        Boolean(selectedDeliveryOption) &&
        selectedFulfillmentFamily === "SHIPPING",
    });

    if (!selectedDeliveryOption) {
      nextValidationErrors.delivery = "Selecciona un metodo de entrega.";
    }

    if (
      selectedDeliveryOption?.fulfillmentFamily === "SHIPPING" &&
      !selectedShippingQuoteId
    ) {
      nextValidationErrors.shippingQuote = "Selecciona una opcion de envio.";
    }

    setValidationErrors(nextValidationErrors);
    const firstValidationError = getFirstValidationError(nextValidationErrors);
    if (firstValidationError) {
      scrollToCheckoutSection(firstValidationError);
      return;
    }

    setMobileCheckoutStep(3);
    scrollToMobileCheckoutStep("checkout-payment-section");
  }

  function handleCheckoutFieldFocus(event: FocusEvent<HTMLFormElement>) {
    if (mode !== "one-page" || window.innerWidth >= 640) return;

    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    if (
      target instanceof HTMLInputElement &&
      ["button", "checkbox", "hidden", "radio", "submit"].includes(target.type)
    )
      return;

    if (focusedFieldScrollTimeoutRef.current !== null) {
      window.clearTimeout(focusedFieldScrollTimeoutRef.current);
    }

    focusedFieldScrollTimeoutRef.current = window.setTimeout(() => {
      focusedFieldScrollTimeoutRef.current = null;
      keepFocusedFieldAboveKeyboard(target);
    }, 360);
  }

  function applySavedShippingAddress(address: CustomerAddress) {
    clearValidationErrors(
      "phone",
      "departmentId",
      "municipalityId",
      "address",
      "shippingQuote",
    );
    setForm((current) => ({
      ...current,
      phone:
        current.phone.trim() || !address.cellphone
          ? current.phone
          : address.cellphone,
      departmentId: address.departmentId ?? "",
      municipalityId: address.municipalityId ?? "",
      address: address.line1,
      addressComplement: address.line2 ?? "",
      notes: address.notes ?? "",
    }));

    lastShippingQuoteKeyRef.current = "";
    setShippingQuoteResultKey("");
    setShippingError(null);
    setShippingQuotes([]);
    setSelectedShippingQuoteId("");
  }

  function updateFulfillmentFamily(value: WebsiteFulfillmentFamily) {
    clearValidationErrors("delivery", "shippingQuote");
    setSelectedFulfillmentFamily(value);
    lastShippingQuoteKeyRef.current = "";
    setShippingQuoteResultKey("");
    setShippingError(null);
    setShippingQuotes([]);
    setSelectedShippingQuoteId("");

    if (value === "PICKUP") {
      const option = enabledDeliveryOptions.find(
        (candidate) => candidate.fulfillmentFamily === value,
      );
      trackShippingInfo(option ?? null, null);
    }
  }

  function selectShippingQuote(quoteId: string) {
    clearValidationErrors("shippingQuote");
    setSelectedShippingQuoteId(quoteId);
    const quote = shippingQuotes.find(
      (candidate) => candidate.quoteId === quoteId,
    );
    trackShippingInfo(selectedDeliveryOption, quote ?? null);
  }

  function selectPaymentOption(option: CheckoutPaymentOption) {
    clearValidationErrors("payment", "initialPayment");
    setSelectedPaymentMode(option.mode);
    setInitialPaymentAmount(getDefaultInitialPaymentAmount(option));

    if (option.requiresPaymentMethod) {
      const method = sortPaymentMethods(option.methods)[0] ?? null;
      setSelectedPaymentMethodId(method?.paymentMethodId ?? "");
      return;
    }

    setSelectedPaymentMethodId("");
    trackPaymentInfo(option, null);
  }

  function selectPaymentMethod(method: CheckoutPaymentOptionMethod) {
    clearValidationErrors("payment", "initialPayment");
    setSelectedPaymentMethodId(method.paymentMethodId);
    trackPaymentInfo(selectedPaymentOption, method);
  }

  function trackShippingInfo(
    deliveryOption: WebsiteDeliveryOption | null,
    shippingQuote: WebsiteShippingQuote | null,
  ) {
    const key =
      deliveryOption?.fulfillmentFamily === "PICKUP"
        ? `pickup:${deliveryOption.id}`
        : shippingQuote
          ? `shipping:${shippingQuote.quoteId}`
          : "";
    if (!key || lastMarketingShippingKeyRef.current === key) return;
    lastMarketingShippingKeyRef.current = key;
    marketing.track({
      eventName: "add_shipping_info",
      shippingTier: shippingQuote?.label ?? deliveryOption?.label,
      value: Math.max(0, subtotal - discount + (shippingQuote?.amount ?? 0)),
      items: marketingItems,
    });
  }

  function trackPaymentInfo(
    option: CheckoutPaymentOption | null,
    method: CheckoutPaymentOptionMethod | null,
  ) {
    if (!option || (option.requiresPaymentMethod && !method)) return;
    const key = `${option.mode}:${method?.paymentMethodId ?? ""}`;
    if (lastMarketingPaymentKeyRef.current === key) return;
    lastMarketingPaymentKeyRef.current = key;
    marketing.track({
      eventName: "add_payment_info",
      paymentType: method?.label ?? option.label,
      value: total,
      items: marketingItems,
    });
  }

  async function onApplyCoupon() {
    setLocalError(null);
    setStatusMessage(null);

    const code = couponCode.trim();
    if (!code) {
      setLocalError("Escribe un codigo de cupon.");
      return;
    }

    if (!form.email.trim() && !form.phone.trim()) {
      setLocalError("Dejanos un correo o WhatsApp para validar el cupon.");
      return;
    }

    setCouponLoading(true);

    try {
      await startCheckout(getContactPayload(form), selectedFulfillmentFamily);
      const client = await getBacanoBrowserClient();
      const validation = await client.checkout.validateCoupon({ code });

      if (!validation.success) {
        setLocalError(getCouponMessage(validation, "El cupon no es valido."));
        return;
      }

      const applied = await client.checkout.applyCoupon({ code });
      if (!applied.success) {
        setLocalError(
          getCouponMessage(applied, "No pudimos aplicar el cupon."),
        );
        return;
      }

      setAppliedCoupon(applied);
      setStatusMessage(applied.message ?? "Cupon aplicado.");
    } catch (caught) {
      setLocalError(getErrorMessage(caught));
    } finally {
      setCouponLoading(false);
    }
  }

  async function onRemoveCoupon() {
    if (!appliedCoupon?.couponId) {
      setAppliedCoupon(null);
      setCouponCode("");
      return;
    }

    setLocalError(null);
    setStatusMessage(null);
    setCouponLoading(true);

    try {
      const client = await getBacanoBrowserClient();
      const removed = await client.checkout.removeCoupon({
        couponId: appliedCoupon.couponId,
      });

      if (!removed.success) {
        setLocalError(getCouponMessage(removed, "No pudimos quitar el cupon."));
        return;
      }

      setAppliedCoupon(null);
      setCouponCode("");
      setStatusMessage(removed.message ?? "Cupon removido.");
    } catch (caught) {
      setLocalError(getErrorMessage(caught));
    } finally {
      setCouponLoading(false);
    }
  }

  async function onSubmitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "one-page" && window.innerWidth < 640) {
      if (mobileCheckoutStep === 1) {
        continueToDelivery();
        return;
      }

      if (mobileCheckoutStep === 2) {
        continueToPayment();
        return;
      }
    }

    setLocalError(null);
    setStatusMessage(null);
    setResult(null);
    setSuccessSnapshot(null);
    setIsRedirectingToPayment(false);

    const nextValidationErrors = validateReadyToSubmit();
    setValidationErrors(nextValidationErrors);
    const firstValidationError = Object.entries(nextValidationErrors)[0] as
      | [CheckoutValidationField, string]
      | undefined;
    if (firstValidationError) {
      setLocalError(null);
      scrollToCheckoutSection(firstValidationError[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const contact = getContactPayload(form);
      await startCheckout(contact, selectedFulfillmentFamily);
      const client = await getBacanoBrowserClient();

      const checkoutResult = await client.checkout.submit({
        contact,
        fulfillmentFamily: selectedFulfillmentFamily,
        address:
          selectedFulfillmentFamily === "SHIPPING"
            ? getAddressPayload()
            : undefined,
        shippingQuoteId:
          selectedFulfillmentFamily === "SHIPPING"
            ? selectedShippingQuoteId
            : undefined,
        paymentMode: selectedPaymentMode || undefined,
        paymentMethodId: selectedPaymentOption?.requiresPaymentMethod
          ? selectedPaymentMethodId
          : undefined,
        initialPayment: getInitialPaymentPayload(),
        marketingAttribution: marketing.getAttribution() ?? undefined,
        advertisingConsent: website?.marketing.consentPolicy
          ? {
              policyId: website.marketing.consentPolicy.id,
              policyVersion: website.marketing.consentPolicy.version,
              statementHash: website.marketing.consentPolicy.statementHash,
              granted: legalAccepted,
            }
          : undefined,
      });

      if (!checkoutResult.success) {
        setLocalError(
          checkoutResult.errors?.join(", ") ??
            "No pudimos confirmar tu pedido.",
        );
        return;
      }

      if (!checkoutResult.orderId || !checkoutResult.publicOrderToken) {
        setLocalError(
          checkoutResult.errors?.join(", ") ??
            "Bacano no entrego el identificador publico del pedido.",
        );
        return;
      }

      trackShippingInfo(selectedDeliveryOption, selectedShippingQuote);
      trackPaymentInfo(selectedPaymentOption, selectedPaymentMethod);

      if (checkoutResult.requiresPaymentSession) {
        const paymentMethodId = checkoutResult.paymentMethodId;

        if (!paymentMethodId) {
          setLocalError(
            "No pudimos iniciar la pasarela porque falta el metodo de pago.",
          );
          return;
        }

        const session = await client.checkout.createPaymentSession({
          orderId: checkoutResult.orderId,
          publicOrderToken: checkoutResult.publicOrderToken,
          paymentMethodId,
          returnUrl: getPaymentReturnUrl(checkoutResult),
        });

        if (
          session.success &&
          session.integrationMode === "redirect" &&
          session.redirectUrl
        ) {
          saveOrderSuccessSnapshot(createSuccessSnapshot(checkoutResult));
          setIsRedirectingToPayment(true);
          try {
            window.location.assign(session.redirectUrl);
          } catch (caught) {
            setIsRedirectingToPayment(false);
            throw caught;
          }
          return;
        }

        setLocalError(
          session.errors?.join(", ") ??
            "No pudimos iniciar el checkout seguro de pago.",
        );
        return;
      }

      finishSuccessfulCheckout(checkoutResult);
    } catch (caught) {
      setIsRedirectingToPayment(false);
      setLocalError(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  function validateReadyToSubmit(): CheckoutValidationErrors {
    const errors = getCheckoutFormValidationErrors(form, {
      requiresShipping:
        Boolean(selectedDeliveryOption) &&
        selectedFulfillmentFamily === "SHIPPING",
    });

    if (!selectedDeliveryOption) {
      errors.delivery = "Selecciona un metodo de entrega.";
    }

    if (
      selectedDeliveryOption?.fulfillmentFamily === "SHIPPING" &&
      !selectedShippingQuoteId
    ) {
      errors.shippingQuote = "Selecciona una opcion de envio.";
    }

    if (!selectedPaymentOption) {
      errors.payment = "Selecciona una opcion de pago.";
    }
    if (
      selectedPaymentOption?.requiresPaymentMethod &&
      !selectedPaymentMethodId
    ) {
      errors.payment = "Selecciona un metodo de pago.";
    }

    const initialPaymentError = validateInitialPayment();
    if (initialPaymentError) {
      errors.initialPayment = initialPaymentError;
    }
    if (!legalAccepted) {
      errors.legal = "Este campo es requerido.";
    }

    return errors;
  }

  function clearValidationErrors(...fields: CheckoutValidationField[]) {
    setValidationErrors((current) => {
      if (!fields.some((field) => current[field])) return current;

      const next = { ...current };
      for (const field of fields) delete next[field];
      return next;
    });
    setLocalError(null);
  }

  function getAddressPayload(): WebsiteCheckoutAddress {
    return {
      departmentId: selectedDepartment?.departmentId,
      departmentName: selectedDepartment?.departmentName,
      municipalityId: selectedMunicipality?.municipalityId,
      municipalityName: selectedMunicipality?.municipalityName,
      line1: form.address.trim() || undefined,
      line2: form.addressComplement.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
  }

  function getInitialPaymentPayload() {
    if (!selectedPaymentOption) return undefined;
    if (!allowsInitialPayment(selectedPaymentOption)) {
      return undefined;
    }

    const amount = readInitialPaymentAmount();
    if (amount === null || amount <= 0) return undefined;
    if (!selectedPaymentMethodId) return undefined;

    return {
      amount,
      paymentMethodId: selectedPaymentMethodId,
    };
  }

  function validateInitialPayment() {
    if (!selectedPaymentOption) return null;
    if (!allowsInitialPayment(selectedPaymentOption)) {
      return null;
    }

    const amount = readInitialPaymentAmount();
    const hasAmount = amount !== null && amount > 0;

    if (requiresInitialPayment(selectedPaymentOption) && !hasAmount) {
      return "Ingresa el valor del abono inicial.";
    }

    if (!hasAmount) return null;

    if (!selectedPaymentMethodId) {
      return "Selecciona el metodo para el abono inicial.";
    }

    const minimum = selectedPaymentOption.minInitialAmount;
    if (minimum !== null && amount < minimum) {
      return `El abono minimo es ${formatMoneyCOP(minimum)}.`;
    }

    return null;
  }

  function readInitialPaymentAmount() {
    const normalized = displayInitialPaymentAmount.replace(/[^\d.]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function finishSuccessfulCheckout(checkoutResult: CheckoutResult) {
    const snapshot = createSuccessSnapshot(checkoutResult);
    saveOrderSuccessSnapshot(snapshot);
    setSuccessSnapshot(snapshot);
    clearCart();
    setLegalAccepted(false);
    setResult(checkoutResult);

    if (checkoutResult.orderId) {
      router.push(
        getOrderSuccessPath(
          checkoutResult.orderId,
          checkoutResult.publicOrderToken,
        ),
      );
    }
  }

  function createSuccessSnapshot(
    checkoutResult: CheckoutResult,
  ): CheckoutSuccessSnapshot {
    const deliveryLabel =
      selectedFulfillmentFamily === "PICKUP"
        ? (selectedDeliveryOption?.pickupInfo?.label ??
          selectedDeliveryOption?.label ??
          "Recoger en tienda")
        : (selectedShippingQuote?.label ??
          selectedDeliveryOption?.label ??
          "Envio");
    const paymentLabel = selectedPaymentOption
      ? getPaymentDisplayLabel(
          selectedPaymentOption.label,
          selectedPaymentMethod?.label,
        )
      : "Por confirmar";

    return {
      contactEmail: form.email.trim() || undefined,
      contactPhone: form.phone.trim() || undefined,
      deliveryLabel,
      discount,
      items: items.map((item) => ({
        id: item.id,
        imageSrc: item.productVariant.product.imageSrc,
        name: item.productVariant.product.name,
        quantity: item.quantity,
        sku: item.productVariant.sku,
      })),
      orderId: checkoutResult.orderId,
      orderNumber: checkoutResult.orderNumber,
      paymentLabel,
      paymentMethodId:
        checkoutResult.paymentMethodId ?? selectedPaymentMethodId,
      publicOrderToken: checkoutResult.publicOrderToken,
      result: checkoutResult,
      shippingAmount,
      shippingIsFree: selectedShippingQuote?.freeShippingApplied,
      status: checkoutResult.success ? "PENDING" : null,
      subtotal,
      total,
    };
  }

  function getPaymentReturnUrl(checkoutResult: CheckoutResult) {
    const returnUrl = getPaymentReturnBaseUrl();

    if (checkoutResult.orderId) {
      returnUrl.searchParams.set("orderId", checkoutResult.orderId);
    }

    if (checkoutResult.publicOrderToken) {
      returnUrl.searchParams.set("token", checkoutResult.publicOrderToken);
    }

    return returnUrl.toString();
  }

  function getPaymentReturnBaseUrl() {
    const configuredReturnUrl =
      process.env.NEXT_PUBLIC_PAYMENT_RETURN_URL?.trim();

    if (configuredReturnUrl) {
      try {
        const url = new URL(configuredReturnUrl);
        if (url.pathname === "/" || !url.pathname) {
          url.pathname = "/pago/respuesta";
        }
        url.hash = "";
        return url;
      } catch {
        // Fall back to the current storefront origin when the env is malformed.
      }
    }

    return new URL("/pago/respuesta", window.location.origin);
  }

  if (result?.success && successSnapshot) {
    return <CheckoutSuccessView snapshot={successSnapshot} />;
  }

  if (isLoading && items.length === 0) {
    return <CheckoutLoadingSkeleton mode={mode} />;
  }

  if (!isLoading && items.length === 0) {
    return (
      <main className="checkout-page-container py-8 sm:py-12">
        <section className="mx-auto grid max-w-xl gap-5 rounded-lg border border-border bg-white p-5 text-center shadow-[0_18px_44px_rgba(0,0,0,0.05)] sm:p-7">
          <p className="font-medium text-warning text-xs uppercase tracking-[0.16em]">
            Checkout
          </p>
          <h1 className="font-medium text-2xl text-foreground leading-tight sm:text-3xl">
            Tu carrito esta vacio
          </h1>
          <p className="mx-auto max-w-md text-muted text-sm leading-6">
            Agrega productos para revisar tu pedido y finalizar la compra en una
            sola pagina.
          </p>
          <Link
            href="/catalogo/"
            className="btn btn-cart w-full sm:mx-auto sm:w-auto"
          >
            Ver catalogo
          </Link>
        </section>
      </main>
    );
  }

  const contactSection = (
    <div id="checkout-contact-section" className="scroll-mt-24 sm:scroll-mt-6">
      <CheckoutContactSection
        form={form}
        onFieldChange={updateFormField}
        validationErrors={validationErrors}
      />
      {mode === "one-page" && mobileCheckoutStep === 1 ? (
        <MobileCheckoutContinueButton>Continuar</MobileCheckoutContinueButton>
      ) : null}
    </div>
  );

  const deliverySection = (
    <div id="checkout-delivery-section" className="scroll-mt-24 sm:scroll-mt-6">
      <CheckoutDeliverySection
        canQuoteShipping={canQuoteShipping}
        deliveryError={deliveryError}
        deliveryLoading={deliveryLoading}
        deliveryOptions={enabledDeliveryOptions}
        form={form}
        hasCurrentShippingQuotes={hasCurrentShippingQuotes}
        locationError={locationError}
        locationOptions={locationOptions}
        municipalityOptions={municipalityOptions}
        selectedDeliveryOption={selectedDeliveryOption}
        selectedFulfillmentFamily={selectedFulfillmentFamily}
        selectedShippingQuoteId={selectedShippingQuoteId}
        separated={mode !== "one-page"}
        shippingError={shippingError}
        shippingIsPending={shippingIsPending}
        shippingLoading={shippingLoading}
        shippingQuotes={shippingQuotes}
        validationErrors={validationErrors}
        onFieldChange={updateFormField}
        onFulfillmentFamilyChange={updateFulfillmentFamily}
        onSavedAddressSelect={applySavedShippingAddress}
        onShippingQuoteSelect={selectShippingQuote}
      />
      {mode === "one-page" && mobileCheckoutStep === 2 ? (
        <MobileCheckoutContinueButton
          disabled={deliveryLoading || shippingLoading || shippingIsPending}
        >
          Continuar
        </MobileCheckoutContinueButton>
      ) : null}
    </div>
  );

  const contactAndDeliverySections = (
    <>
      {contactSection}
      {deliverySection}
    </>
  );

  const paymentSection = (
    <div id="checkout-payment-section" className="scroll-mt-24 sm:scroll-mt-6">
      <PaymentOptionsSection
        error={paymentError}
        loading={
          deliveryLoading ||
          (enabledDeliveryOptions.length > 0 && !selectedDeliveryOption) ||
          Boolean(selectedDeliveryOption && paymentsLoading)
        }
        options={enabledPaymentOptions}
        initialPaymentAmount={displayInitialPaymentAmount}
        selectedMode={selectedPaymentMode}
        selectedMethodId={selectedPaymentMethodId}
        variant={mode === "one-page" ? "friendly" : "default"}
        validationError={
          validationErrors.payment ?? validationErrors.initialPayment
        }
        onInitialPaymentAmountChange={(value) => {
          clearValidationErrors("initialPayment");
          setInitialPaymentAmount(value);
        }}
        onSelectOption={selectPaymentOption}
        onSelectMethod={selectPaymentMethod}
      />
    </div>
  );

  const whatsappHelp = (
    <CheckoutWhatsAppHelp
      href={createCheckoutWhatsAppUrl({
        deliveryLabel: selectedDeliveryOption?.label,
        departmentName: selectedDepartment?.departmentName,
        items,
        municipalityName: selectedMunicipality?.municipalityName,
        total,
      })}
      onClick={() =>
        marketing.track({
          eventName: "contact",
          contactMethod: "whatsapp",
          value: total,
          items: marketingItems,
        })
      }
    />
  );

  const checkoutFeedback = (
    <>
      {localError || error ? (
        <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 font-medium text-danger text-sm">
          {localError || error}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="rounded-md border border-accent-soft bg-accent-soft px-4 py-3 font-medium text-accent text-sm">
          {statusMessage}
        </p>
      ) : null}
    </>
  );

  const submitActions = (
    <>
      <div id="checkout-legal-section" className="scroll-mt-6">
        <CheckoutLegalAcceptance
          checked={legalAccepted}
          errorMessage={validationErrors.legal}
          onChange={(checked) => {
            clearValidationErrors("legal");
            setLegalAccepted(checked);
          }}
          advertisingStatement={
            website?.marketing.consentPolicy?.statement ?? null
          }
        />
      </div>
      <div className={mode === "one-page" ? "block" : "contents"}>
        <button
          type="submit"
          disabled={formIsBusy || items.length === 0 || !legalAccepted}
          className="btn btn-cart mt-3 w-full self-start"
        >
          {checkoutActionLabel}
        </button>
      </div>
    </>
  );

  const paymentAndSubmitSections = (
    <>
      {paymentSection}
      {checkoutFeedback}
      {submitActions}
      {whatsappHelp}
    </>
  );

  if (mode === "one-page") {
    return (
      <main className="checkout-page-container pt-5 pb-8 sm:py-12">
        <CheckoutPaymentLoadingOverlay visible={showPaymentLoading} />
        <CheckoutAuthPrefill form={form} onFieldChange={updateFormField} />

        <form
          autoComplete="on"
          name="checkout"
          onSubmit={onSubmitCheckout}
          onFocusCapture={handleCheckoutFieldFocus}
          className="grid items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12"
        >
          <MobileCheckoutPreview items={items} />

          <div className="grid content-start gap-6 sm:gap-7">
            {contactSection}
            <div
              className={mobileCheckoutStep >= 2 ? "block" : "hidden sm:block"}
            >
              {deliverySection}
            </div>
            {mobileCheckoutStep < 2 ? (
              <MobileCheckoutPendingSection title="Entrega" />
            ) : null}
            <div
              className={mobileCheckoutStep >= 3 ? "block" : "hidden sm:block"}
            >
              {paymentSection}
            </div>
            {mobileCheckoutStep < 3 ? (
              <MobileCheckoutPendingSection title="Pago" />
            ) : null}
          </div>

          <div
            className={`${
              mobileCheckoutStep >= 3 ? "grid" : "hidden sm:grid"
            } content-start xl:sticky xl:top-24 xl:self-start`}
          >
            <CheckoutOrderReviewPanel
              appliedCoupon={appliedCoupon}
              couponCode={couponCode}
              couponLoading={couponLoading}
              disabled={isLoading || formIsBusy}
              discount={discount}
              footer={
                <>
                  {checkoutFeedback}
                  {submitActions}
                </>
              }
              items={items}
              isAvailabilityLoading={isAvailabilityLoading}
              selectedFulfillmentFamily={selectedFulfillmentFamily}
              shippingAmount={shippingAmount}
              freeShippingProgress={freeShippingProgress}
              shippingQuote={selectedShippingQuote}
              shippingIsPending={shippingIsPending}
              shippingLoading={shippingLoading}
              subtotal={subtotal}
              total={total}
              variantLiveStateById={variantLiveStateById}
              onApplyCoupon={() => void onApplyCoupon()}
              onCouponCodeChange={setCouponCode}
              onQuantityChange={(itemId, quantity) =>
                void setItemQuantity(itemId, quantity)
              }
              onRemoveCoupon={() => void onRemoveCoupon()}
              onRemoveItem={(itemId) => void removeItem(itemId)}
            />
            <div className="mt-6 hidden sm:block">{whatsappHelp}</div>
          </div>

          {mobileCheckoutStep >= 3 ? (
            <div className="mt-2 sm:hidden">{whatsappHelp}</div>
          ) : null}
        </form>
      </main>
    );
  }

  return (
    <main className="container-page py-8 sm:py-12">
      <CheckoutPaymentLoadingOverlay visible={showPaymentLoading} />
      <CheckoutAuthPrefill form={form} onFieldChange={updateFormField} />

      <header className="mb-8">
        <p className="font-medium text-warning text-xs uppercase tracking-[0.16em]">
          Checkout
        </p>
        <h1 className="mt-2 font-normal text-3xl text-foreground sm:text-4xl">
          Finalizar pedido
        </h1>
      </header>

      <form
        autoComplete="on"
        name="checkout"
        onSubmit={onSubmitCheckout}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="grid gap-6 rounded-lg border border-border bg-white p-5 sm:p-6">
          {contactAndDeliverySections}
        </div>

        <div className="grid gap-6 lg:self-start">
          <CheckoutSummary
            appliedCoupon={appliedCoupon}
            couponCode={couponCode}
            couponLoading={couponLoading}
            discount={discount}
            items={items}
            selectedFulfillmentFamily={selectedFulfillmentFamily}
            shippingAmount={shippingAmount}
            shippingQuote={selectedShippingQuote}
            shippingIsPending={shippingIsPending}
            shippingLoading={shippingLoading}
            subtotal={subtotal}
            total={total}
            onApplyCoupon={() => void onApplyCoupon()}
            onCouponCodeChange={setCouponCode}
            onRemoveCoupon={() => void onRemoveCoupon()}
          />

          <div className="grid gap-6 rounded-lg border border-border bg-white p-5 sm:p-6">
            {paymentAndSubmitSections}
          </div>
        </div>
      </form>
    </main>
  );
}

function getDefaultInitialPaymentAmount(option: CheckoutPaymentOption | null) {
  if (!option || !requiresInitialPayment(option)) return "";

  return String(option.suggestedInitialAmount ?? option.minInitialAmount ?? "");
}
