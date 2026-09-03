import { getPrimaryProductImage, type Product } from "@bacano/sdk";
import Image from "next/image";
import { AddToCart } from "@/components/AddToCart";
import { LivePrice } from "@/components/LivePrice";
import { Markdown } from "@/components/Markdown";

/**
 * One product's markup.
 *
 * Takes a product that exists. The absent case is `notFound()`, which is a
 * routing concern and belongs to the route — preview renders client-side and
 * has no route to fail, so it reports a missing product its own way.
 */
export function ProductView({ product }: { product: Product }) {
  const image = getPrimaryProductImage(product.media);
  const variant = product.variants[0];
  const pricing = variant?.pricing;

  return (
    <article className="grid gap-10 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {image?.detailUrl ? (
          <Image
            src={image.detailUrl}
            alt={image.alt ?? product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        ) : null}
      </div>

      <div>
        <h1 className="font-semibold text-2xl">{product.name}</h1>
        {product.brand && (
          <p className="mt-1 text-neutral-500 text-sm">{product.brand.name}</p>
        )}

        {/* Baked for crawlers and first paint, then corrected live. A sale
            ends because time passed, which triggers no rebuild — see
            LivePrice. */}
        {pricing?.currentPrice != null && variant && (
          <LivePrice
            productVariantId={variant.id}
            bakedCurrentPrice={pricing.currentPrice}
            bakedRegularPrice={pricing.regularPrice}
            bakedHasDiscount={pricing.hasDiscount}
          />
        )}

        {product.description && <Markdown>{product.description}</Markdown>}

        {/* Live island — stock is never baked. */}
        <div className="mt-8">
          {variant ? (
            <AddToCart productVariantId={variant.id} />
          ) : (
            <p className="text-neutral-500 text-sm">
              Este producto no tiene variantes disponibles.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
