import { createWhatsAppUrl, storeConfig } from "@/config/store";
import type { LocalCartItem } from "@/features/commerce/cart/local-cart";
import { formatMoneyCOP } from "@/lib/bacano/formatters";
import { getProductVariantUrl } from "@/lib/bacano/urls";

export function createCheckoutWhatsAppUrl({
  deliveryLabel,
  departmentName,
  items,
  municipalityName,
  total,
}: {
  deliveryLabel?: string | null;
  departmentName?: string | null;
  items: LocalCartItem[];
  municipalityName?: string | null;
  total: number;
}) {
  const location = [municipalityName, departmentName]
    .filter(Boolean)
    .join(", ");
  const lines = [
    `Hola ${storeConfig.name}, necesito ayuda para finalizar mi compra:`,
    ...items.map((item) => {
      const variant = item.productVariant.attributes
        .map((attribute) => `${attribute.name}: ${attribute.value}`)
        .join(" / ");
      return `- ${item.productVariant.product.name}${
        variant ? ` (${variant})` : ""
      } x${item.quantity}`;
    }),
    `Total actual: ${formatMoneyCOP(total)}`,
    deliveryLabel ? `Entrega: ${deliveryLabel}` : null,
    location ? `Ubicacion: ${location}` : null,
    ...items.slice(0, 3).map((item) => {
      const path = getProductVariantUrl(
        item.productVariant.product,
        item.productVariantId,
      );
      return new URL(path, storeConfig.siteUrl).toString();
    }),
  ].filter((line): line is string => Boolean(line));

  return createWhatsAppUrl(lines.join("\n"));
}
