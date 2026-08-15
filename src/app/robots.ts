import type { MetadataRoute } from "next";

// Required under `output: export`: Next treats a route handler as dynamic
// unless told otherwise, and refuses to export one. This file only reads
// build-time data, so static is correct.
export const dynamic = "force-static";

/**
 * Generates robots.txt at build time, pointing at the sitemap.
 *
 * The cart and checkout are excluded: they are live islands that render nothing
 * useful without a session, so a crawler spends budget on them and indexes an
 * empty page. Everything else is open — this is a shop.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/carrito/", "/checkout/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
