import type { Product } from "@bacano/sdk";
import { storeConfig } from "@/config/store";

export function truncateDescription(value: string | null, length = 156) {
  if (!value) {
    return `Descubre los productos de ${storeConfig.name}.`;
  }

  const clean = stripHtmlToText(value).replace(/\s+/g, " ").trim();
  if (clean.length <= length) return clean;

  const candidate = clean.slice(0, Math.max(1, length - 3)).trim();
  const lastSpace = candidate.lastIndexOf(" ");
  const truncated =
    lastSpace > length * 0.65 ? candidate.slice(0, lastSpace) : candidate;

  return `${truncated}...`;
}

export function getProductSeoDescription(product: Product, length = 156) {
  const seoDescription = stripHtmlToText(product.seoDescription);
  if (seoDescription) return truncateDescription(seoDescription, length);

  const productDescription = stripHtmlToText(product.description);
  if (productDescription) {
    return truncateDescription(
      `${normalizeProductName(product)}: ${productDescription}`,
      length,
    );
  }

  return truncateDescription(getProductFallbackDescription(product), length);
}

export function getProductSeoTitle(product: Product, hasDuplicateName = false) {
  if (product.seoTitle?.trim()) return product.seoTitle.trim();
  if (!hasDuplicateName) return normalizeProductName(product);

  const sku = getPrimaryProductSku(product);
  return sku ? `${normalizeProductName(product)} - Ref. ${sku}` : product.name;
}

export function getProductDisplayDescription(product: Product) {
  return (
    stripHtmlToText(product.description) ||
    stripHtmlToText(product.seoDescription) ||
    getProductFallbackDescription(product)
  );
}

export function stripHtmlToText(value: string | null | undefined) {
  if (!value) return "";

  return decodeHtmlEntities(
    value
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\s*\/\s*(p|div|li|h[1-6]|section|article)\s*>/gi, "\n")
      .replace(/<\s*(p|div|li|h[1-6]|section|article)[^>]*>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function getProductFallbackDescription(product: Product) {
  const name = normalizeProductName(product);
  const sku = getPrimaryProductSku(product);
  const reference = sku ? ` (ref. ${sku})` : "";

  return `Compra ${name}${reference} en ${storeConfig.name}.`;
}

function normalizeProductName(product: Product) {
  return (
    product.name.replace(/\s+/g, " ").trim() ||
    `Producto de ${storeConfig.name}`
  );
}

function getPrimaryProductSku(product: Product) {
  const variants = product.detailVariants?.length
    ? product.detailVariants
    : product.variants;

  return variants
    .toSorted((left, right) => left.order - right.order)
    .find((variant) => variant.sku.trim())
    ?.sku.trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
}
