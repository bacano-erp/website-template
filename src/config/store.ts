/**
 * What the commerce screens say about this store.
 *
 * Only presentation lives here. Prices, payment methods, shipping, coupons,
 * pickup points, legal documents and the business's contacts, networks and
 * hours all come from Bacano through the SDK, and
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
     * The prefilled WhatsApp message. The number itself, like every phone,
     * email, social network, address and opening hours, comes from the
     * business's Ficha pública in Bacano (see `features/business`).
     */
    whatsappMessage: "Hola, necesito ayuda con mi compra",
  },
} as const;
