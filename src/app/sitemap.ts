import type { MetadataRoute } from "next";
import { getBuildClient } from "@/lib/bacano";

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

  const client = await getBuildClient();
  const slugs: string[] = [];
  const pageSize = 100;
  const maxPages = 50;

  for (let page = 0; page < maxPages; page++) {
    const { entries, pagination } = await client.catalog.getProductSeoEntries({
      limit: pageSize,
      offset: page * pageSize,
    });

    for (const entry of entries) {
      if (entry.slug) slugs.push(entry.slug);
    }

    if (!pagination.hasMore) break;
  }

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
