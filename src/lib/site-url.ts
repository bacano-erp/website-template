/**
 * The address this store is published at.
 *
 * It has no safe default. Every use is a claim made to somebody outside the
 * site — the canonical URL a search engine indexes, the sitemap it crawls, the
 * address a payment gateway returns the shopper to — and a wrong answer is
 * worse than no answer:
 *
 *   * canonical tags pointing at `localhost` tell Google the real page lives
 *     somewhere it cannot reach, and the store drops out of results
 *   * a sitemap of `localhost` URLs is worthless
 *   * a payment return to `localhost` loses a shopper who has already paid
 *
 * A build that cannot name its own address must fail rather than invent one,
 * which is the same rule Bacano applies to cross-environment values elsewhere.
 * `next dev` is the exception: there is a correct answer locally and no
 * consequence to guessing it.
 */
const DEVELOPMENT_FALLBACK = "http://localhost:3000";

/**
 * `||` not `??` throughout: an unset GitHub Actions variable arrives as an
 * empty string, which `??` passes through happily.
 */
export function requireSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") return DEVELOPMENT_FALLBACK;

  throw new Error(
    "NEXT_PUBLIC_SITE_URL is not set. It becomes the canonical URL of every " +
      "page, the sitemap, and the address the payment gateway returns to, so " +
      "the build stops rather than publish a store that points at localhost. " +
      "Bacano sets it as a repository variable when the site is provisioned; " +
      "for local builds copy .env.example to .env.local.",
  );
}

/**
 * The site URL as seen from the browser.
 *
 * Prefers the configured value, and falls back to wherever the page is actually
 * being served from — which is right by construction, and keeps a storefront
 * usable on a preview host or a domain that was attached after the last build.
 */
export function browserSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (configured) return configured.replace(/\/+$/, "");

  if (typeof window !== "undefined") return window.location.origin;

  return requireSiteUrl();
}
