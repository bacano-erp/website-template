import type {
  Product,
  ProductAttribute,
  ProductVariant,
  ProductVariantPricing,
  VariantAttribute,
} from "@bacano/sdk";

import {
  getPrimaryProductMediaUrl,
  getProductSeoImages,
} from "@/lib/bacano/media";
import { getDisplayVariant } from "./product-pricing";

export {
  getProductDisplayDescription,
  getProductSeoDescription,
  getProductSeoTitle,
  stripHtmlToText,
  truncateDescription,
} from "./product-copy";
export { getDisplayVariant } from "./product-pricing";

export function formatMoneyCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDisplayPrice(product: Product): number | null {
  return getDisplayPricing(product)?.currentPrice ?? null;
}

export function getDisplayVariantPrice(variant: ProductVariant): number | null {
  return variant.pricing.currentPrice;
}

export function getDisplayPricing(
  product: Product,
): ProductVariantPricing | null {
  return getDisplayVariant(product)?.pricing ?? null;
}

export function hasCurrentPrice(
  pricing: ProductVariantPricing | null | undefined,
): pricing is ProductVariantPricing & { currentPrice: number } {
  return typeof pricing?.currentPrice === "number";
}

export function getPrimaryVariant(product: Product): ProductVariant | null {
  return product.variants.toSorted((a, b) => a.order - b.order)[0] ?? null;
}

export function getPrimaryImage(product: Product): string | null {
  return getPrimaryProductMediaUrl(product.media, "card");
}

export function getProductDetailImage(product: Product): string | null {
  return getPrimaryProductMediaUrl(product.media, "detail");
}

export function getProductSeoImage(product: Product): string | null {
  return getProductSeoImages(product)[0] ?? null;
}

export { getProductSeoImages } from "@/lib/bacano/media";

export function getProductThumbnailImage(product: Product): string | null {
  return getPrimaryProductMediaUrl(product.media, "thumbnail");
}

export function formatCodeLabel(code: string | null | undefined): string {
  if (!code) return "";

  const labels: Record<string, string> = {
    BABY_PRODUCTS: "Bebe",
    BEAUTY_PERSONAL_CARE: "Belleza y cuidado",
    CLOTHES: "Ropa",
    CLOTHING_SIZE: "Talla",
    COLOR: "Color",
    FIT: "Horma",
    FURNITURE_DECOR: "Muebles y decoracion",
    GENDER: "Genero",
    HOME_KITCHEN: "Hogar y cocina",
    JEWELRY_WATCHES: "Joyeria y relojes",
    MATERIAL: "Material",
    MISCELLANEOUS: "General",
    PERSONAL_ACCESSORIES: "Accesorios",
    SHOE_SIZE: "Talla",
    SHOES: "Zapatos",
    SIZE_GENERAL: "Tamano",
    SPORTS_OUTDOORS: "Deportes",
    STYLE: "Estilo",
    TOYS_BABY_KIDS: "Juguetes y bebe",
    TOYS_GAMES: "Juguetes",
    VEHICLES: "Vehiculos",
  };

  return (
    labels[code] ||
    code
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function productCategoryLabel(product: Product) {
  return formatCodeLabel(product.category) || "General";
}

export function attributeLabel(
  attribute: ProductAttribute | VariantAttribute,
): string {
  return attribute.name;
}
