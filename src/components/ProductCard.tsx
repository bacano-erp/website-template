import Link from "next/link";
import type { Product } from "@bacano/sdk";
import { getPrimaryProductImage } from "@bacano/sdk";
import { formatPrice } from "@/lib/bacano";

/**
 * Rendered at build time — no "use client". The price shown here is the price
 * as of the last publish, which is what search engines index. The authoritative
 * price is re-checked live at checkout.
 */
export function ProductCard({ product }: { product: Product }) {
  const image = getPrimaryProductImage(product.media);
  const pricing = product.variants[0]?.pricing;
  const href = product.slug
    ? `/producto/${product.slug}/`
    : `/producto/${product.id}/`;

  return (
    <Link
      href={href}
      className="group block rounded-lg border border-neutral-200 p-3 transition hover:border-neutral-400"
    >
      <div className="aspect-square overflow-hidden rounded bg-neutral-100">
        {image?.cardUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export has no image optimizer; images are pre-sized by the Bacano CDN
          <img
            src={image.cardUrl}
            alt={image.alt ?? product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : null}
      </div>

      <h3 className="mt-3 text-sm font-medium">{product.name}</h3>

      {pricing?.currentPrice != null && (
        <p className="mt-1 text-sm">
          <span className="font-semibold">
            {formatPrice(pricing.currentPrice)}
          </span>
          {pricing.hasDiscount && pricing.regularPrice != null && (
            <span className="ml-2 text-neutral-400 line-through">
              {formatPrice(pricing.regularPrice)}
            </span>
          )}
        </p>
      )}
    </Link>
  );
}
