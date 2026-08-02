import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrimaryProductImage } from "@bacano/sdk";
import { getBuildClient, formatPrice } from "@/lib/bacano";
import { AddToCart } from "@/components/AddToCart";

type Params = { slug: string };

/**
 * Enumerates every product page to generate. `output: 'export'` requires this
 * for dynamic segments — a slug missing here simply will not exist on the site.
 *
 * Paginates because `getProductSeoEntries` caps each request; the loop is
 * bounded so a pagination bug cannot hang the build forever.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const client = await getBuildClient();
  const params: Params[] = [];
  const pageSize = 100;
  const maxPages = 50; // 5,000 products — far beyond expected catalogue sizes

  for (let page = 0; page < maxPages; page++) {
    const { entries, pagination } = await client.catalog.getProductSeoEntries({
      limit: pageSize,
      offset: page * pageSize,
    });

    for (const entry of entries) {
      if (entry.slug) params.push({ slug: entry.slug });
    }

    if (!pagination.hasMore) break;

    if (page === maxPages - 1) {
      console.warn(
        `[bacano] Stopped at ${params.length} products (page cap reached). ` +
          `Raise maxPages in producto/[slug]/page.tsx or pages will be missing.`,
      );
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const client = await getBuildClient();
  const product = await client.catalog.getProductBySlug(slug);
  if (!product) return {};

  const image = product.seoImage ?? getPrimaryProductImage(product.media);

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description ?? undefined,
    openGraph: {
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.description ?? undefined,
      images: image?.detailUrl ? [image.detailUrl] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const client = await getBuildClient();
  const product = await client.catalog.getProductBySlug(slug);

  if (!product) notFound();

  const image = getPrimaryProductImage(product.media);
  const variant = product.variants[0];
  const pricing = variant?.pricing;

  return (
    <article className="grid gap-10 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {image?.detailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export has no image optimizer
          <img
            src={image.detailUrl}
            alt={image.alt ?? product.name}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        {product.brand && (
          <p className="mt-1 text-sm text-neutral-500">{product.brand.name}</p>
        )}

        {/* Baked at build time: this is the price crawlers index. Checkout
            re-validates against the ERP, which is the authoritative price. */}
        {pricing?.currentPrice != null && (
          <p className="mt-4 text-xl">
            <span className="font-semibold">
              {formatPrice(pricing.currentPrice)}
            </span>
            {pricing.hasDiscount && pricing.regularPrice != null && (
              <span className="ml-2 text-base text-neutral-400 line-through">
                {formatPrice(pricing.regularPrice)}
              </span>
            )}
          </p>
        )}

        {product.description && (
          <p className="mt-4 whitespace-pre-line text-neutral-700">
            {product.description}
          </p>
        )}

        {/* Live island — stock is never baked. */}
        <div className="mt-8">
          {variant ? (
            <AddToCart productVariantId={variant.id} />
          ) : (
            <p className="text-sm text-neutral-500">
              Este producto no tiene variantes disponibles.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
