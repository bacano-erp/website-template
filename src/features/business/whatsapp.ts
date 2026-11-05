import type { BusinessContact } from "@bacano/sdk";

/** A wa.me link to the business's WhatsApp with a prefilled message. */
export function whatsAppLink(
  whatsapp: Pick<BusinessContact, "href"> | null | undefined,
  message?: string,
): string | null {
  if (!whatsapp?.href) return null;
  if (!message) return whatsapp.href;
  const separator = whatsapp.href.includes("?") ? "&" : "?";
  return `${whatsapp.href}${separator}text=${encodeURIComponent(message)}`;
}
