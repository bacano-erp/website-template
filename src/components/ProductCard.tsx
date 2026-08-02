import type { Product } from "@bacano/sdk";
import { getPrimaryProductImage } from "@bacano/sdk";
import Image from "next/image";
import Link from "next/link";
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
      {/* `fill` inside a sized box reserves the space before the image loads,
          so the grid never shifts. next/image does not resize here (static
          export has no optimizer) — the Bacano CDN serves pre-sized files. */}
      <div className="relative aspect-square overflow-hidden rounded bg-neutral-100">
        {image?.cardUrl ? (
          <Image
            src={image.cardUrl}
            alt={image.alt ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : null}
      </div>

      <h3 className="mt-3 font-medium text-sm">{product.name}</h3>

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
