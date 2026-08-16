import { getPrimaryProductImage } from "@bacano/sdk";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { LivePrice } from "@/components/LivePrice";
import { Markdown } from "@/components/Markdown";
import { toPlainText } from "@/lib/markdown";
import {
  getStaticProductBySlug,
  getStaticProducts,
} from "@/lib/static-catalog";

type Params = { slug: string };

const EMPTY_CATALOG_SLUG = "sin-productos";

/**
 * Enumerates every product page to generate. `output: 'export'` requires this
 * for dynamic segments — a slug missing here simply will not exist on the site.
 *
 * Reads the build snapshot rather than paging the SEO endpoint, so the whole
 * catalogue costs a handful of requests for the entire build instead of one
 * per page. See `lib/static-catalog.ts`.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const products = await getStaticProducts();
  const params = products
    .filter((product) => Boolean(product.slug))
    .map((product) => ({ slug: product.slug as string }));

  // Next refuses a dynamic route with an empty param list under
  // `output: export`, reporting it as a missing generateStaticParams(). An
  // empty catalogue is not an error — it is what every store looks like before
  // its first product — so emit one placeholder page, which notFound() renders
  // as the 404 it is.
  if (params.length === 0) return [{ slug: EMPTY_CATALOG_SLUG }];

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStaticProductBySlug(slug);
  if (!product) return {};

  const image = product.seoImage ?? getPrimaryProductImage(product.media);

  // Plain text, not Markdown: these fields are shown verbatim in search
  // results and social previews, where `**bold**` reads as punctuation.
  const summary = product.seoDescription ?? product.description;
  const description = summary ? toPlainText(summary) : undefined;

  return {
    alternates: { canonical: `/producto/${slug}/` },
    title: product.seoTitle ?? product.name,
    description,
    openGraph: {
      title: product.seoTitle ?? product.name,
      description,
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
  const product = await getStaticProductBySlug(slug);

  if (!product) notFound();

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
