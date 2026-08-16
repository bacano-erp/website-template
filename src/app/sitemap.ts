import type { MetadataRoute } from "next";
import { getStaticProducts } from "@/lib/static-catalog";

// Required under `output: export`: Next treats a route handler as dynamic
// unless told otherwise, and refuses to export one. This file only reads
// build-time data, so static is correct.
export const dynamic = "force-static";

/**
 * Generates sitemap.xml at build time.
 *
 * A storefront exists to be found, and until now this template shipped no
 * sitemap at all: every product page relied on a crawler discovering it by
 * following links from the catalogue. That works eventually, and badly.
 *
 * Trailing slashes throughout, because `trailingSlash: true` is what the export
 * writes and what S3 serves — a sitemap advertising `/producto/x` for an object
 * stored at `/producto/x/index.html` hands crawlers a list of redirects.
 *
 * Paginated like generateStaticParams and bounded for the same reason: this
 * runs in a build that must terminate.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  // Same snapshot the pages were generated from, so the sitemap cannot list a
  // URL that was never built — or miss one that was.
  const products = await getStaticProducts();
  const slugs = products
    .map((product) => product.slug)
    .filter((slug): slug is string => Boolean(slug));

  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/catalogo/`, changeFrequency: "daily", priority: 0.8 },
    ...slugs.map((slug) => ({
      url: `${siteUrl}/producto/${slug}/`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
