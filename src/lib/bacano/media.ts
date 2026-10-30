import type { ContentMedia, Product, ProductMedia } from "@bacano/sdk";
import { buildStorageFileUrl, formatMediaSrcSet } from "@bacano/sdk";

import { getBacanoStorageUrl } from "./env";

type MediaUrlPurpose = "thumbnail" | "card" | "detail" | "original";
type BacanoMediaLike = Partial<
  Pick<
    ProductMedia | ContentMedia,
    "url" | "originalUrl" | "thumbnailUrl" | "cardUrl" | "detailUrl"
  >
>;

export function getBacanoStorageFileUrl(fileId: string) {
  return buildStorageFileUrl(getBacanoStorageUrl(), fileId);
}

export function resolveBacanoContentMediaSrc({
  src,
  originalUrl,
  thumbnailUrl,
  cardUrl,
  detailUrl,
  purpose = "detail",
}: {
  src?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  cardUrl?: string;
  detailUrl?: string;
  purpose?: MediaUrlPurpose;
}) {
  const semanticUrl = getPreferredMediaUrl(
    {
      url: src,
      originalUrl,
      thumbnailUrl,
      cardUrl,
      detailUrl,
    },
    purpose,
  );
  return semanticUrl ?? undefined;
}

export function getProductMediaUrl(
  media: ProductMedia | null | undefined,
  purpose: MediaUrlPurpose,
) {
  return media ? getPreferredMediaUrl(media, purpose) : null;
}

export function getProductMediaSrcSet(media: ProductMedia | null | undefined) {
  if (!media?.responsiveSources?.length) return undefined;
  return formatMediaSrcSet(media.responsiveSources) || undefined;
}

export function getPrimaryProductMedia(productMedia: ProductMedia[]) {
  return productMedia.toSorted((a, b) => a.order - b.order)[0] ?? null;
}

export function getPrimaryProductMediaUrl(
  productMedia: ProductMedia[],
  purpose: MediaUrlPurpose,
) {
  return getProductMediaUrl(getPrimaryProductMedia(productMedia), purpose);
}

export function getProductMediaAlt(
  productName: string,
  media: ProductMedia | null | undefined,
  index = 0,
) {
  const configuredAlt = media?.alt?.replace(/\s+/g, " ").trim();
  if (configuredAlt && media && !isTechnicalMediaAlt(configuredAlt, media)) {
    return configuredAlt;
  }

  const normalizedName = productName.replace(/\s+/g, " ").trim();
  if (!normalizedName) return "";

  return index === 0 ? normalizedName : `${normalizedName}, vista ${index + 1}`;
}

export function getProductSeoImages(product: Product) {
  const orderedMedia = product.media
    .filter(isImageMedia)
    .toSorted((left, right) => left.order - right.order);
  const candidates = product.seoImage
    ? [product.seoImage, ...orderedMedia]
    : orderedMedia;

  return [
    ...new Set(
      candidates.flatMap((media) => {
        const url = getProductMediaUrl(media, "detail");
        return url ? [url] : [];
      }),
    ),
  ];
}

function isImageMedia(media: ProductMedia) {
  return (
    media.mediaKind === "image" || Boolean(media.mimeType?.startsWith("image/"))
  );
}

function isTechnicalMediaAlt(value: string, media: ProductMedia) {
  const normalizedValue = value.toLocaleLowerCase("es");
  const fileName = media.fileName?.replace(/\s+/g, " ").trim();

  return (
    /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i.test(value) ||
    Boolean(fileName && normalizedValue === fileName.toLocaleLowerCase("es")) ||
    /^(?:image|imagen|photo|foto)[-_ ]?\d*$/i.test(value) ||
    /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value)
  );
}

function getPreferredMediaUrl(
  media: BacanoMediaLike,
  purpose: MediaUrlPurpose,
) {
  const byPurpose: Record<MediaUrlPurpose, Array<string | null | undefined>> = {
    thumbnail: [
      media.thumbnailUrl,
      media.cardUrl,
      media.detailUrl,
      media.url,
      media.originalUrl,
    ],
    card: [
      media.cardUrl,
      media.thumbnailUrl,
      media.detailUrl,
      media.url,
      media.originalUrl,
    ],
    detail: [
      media.detailUrl,
      media.cardUrl,
      media.url,
      media.originalUrl,
      media.thumbnailUrl,
    ],
    original: [
      media.originalUrl,
      media.detailUrl,
      media.url,
      media.cardUrl,
      media.thumbnailUrl,
    ],
  };

  return byPurpose[purpose].find((url) => Boolean(url?.trim()))?.trim() ?? null;
}
