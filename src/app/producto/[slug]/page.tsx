import { getPrimaryProductImage } from "@bacano/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toPlainText } from "@/lib/markdown";
import {
  getStaticProductBySlug,
  getStaticProducts,
} from "@/lib/static-catalog";
import { ProductView } from "@/views/ProductView";

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

  return <ProductView product={product} />;
}
