/**
 * What the commerce screens say about this store.
 *
 * Only presentation lives here. Prices, payment methods, shipping, coupons,
 * pickup points and legal documents all come from Bacano through the SDK, and
 * never from this file: a value duplicated here goes stale the day someone
 * changes it in the platform.
 */
export const storeConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Bacano Store",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "es-CO",
  currency: "COP",
  /** Shown in the checkout header. Leave empty to show the store name. */
  logo: "",
  contact: {
    /**
     * Digits only, with country code. Empty hides every WhatsApp help link
     * rather than sending shoppers to a number that is not the store's.
     *
     * Write the store's number here: the deploy Bacano manages does not pass
     * NEXT_PUBLIC_WHATSAPP_NUMBER, which only serves local development.
     */
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    whatsappMessage: "Hola, necesito ayuda con mi compra",
    /** Fallback for a pickup option whose address Bacano does not send. */
    addressLine: "",
  },
} as const;

export const whatsAppEnabled = storeConfig.contact.whatsappNumber.length > 0;

export function createWhatsAppUrl(
  message: string = storeConfig.contact.whatsappMessage,
): string {
  return `https://wa.me/${storeConfig.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
