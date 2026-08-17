import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Product, StaticCatalogBootstrap } from "@bacano/sdk";
import { bacanoListKeys } from "@/config/bacano-lists";
import { getBuildClient } from "@/lib/bacano";

/**
 * The whole catalogue, read once per build.
 *
 * A static export renders every product page during `next build`, and the
 * obvious way to write that — `getProductBySlug(slug)` inside each route —
 * costs one gateway request per page, plus another for its metadata. A store
 * with 400 products spends more than 800 requests building what four could
 * have fetched. Since publishing *is* a build, that arithmetic is the
 * difference between a shop owner waiting one minute and waiting ten.
 *
 * `getStaticCatalogBootstrap()` is the contract Bacano documents for this: the
 * full snapshot, the first renderable catalogue page and its filters, in one
 * consistent read. See STATIC_STOREFRONT_CATALOG_BUILDS.md in the SDK.
 */

/** Products per gateway request while paging the snapshot. */
const STATIC_PRODUCT_PAGE_SIZE = 100;

/** Products shown on the first catalogue page, before the shopper filters. */
const STATIC_INITIAL_PAGE_SIZE = 24;

/** Safety ceiling for one build, so a runaway catalogue cannot hang CI. */
const STATIC_PRODUCT_LIMIT = 10_000;

const CACHE_FILE = resolve(".next/cache/bacano-static-catalog.json");

type CacheFile = {
  cacheKey: string;
  cachedAt: string;
  bootstrap: StaticCatalogBootstrap;
};

/**
 * Two caches, because a static export defeats one of them on its own.
 *
 * Next builds routes in parallel workers, and each worker loads this module
 * fresh — so an in-memory cache is per worker, and the catalogue would still
 * be fetched several times. The file under `.next/cache` is what the workers
 * share; the in-flight promise is what stops one worker from starting the same
 * fetch twice before it lands.
 */
let inFlight: {
  cacheKey: string;
  promise: Promise<StaticCatalogBootstrap>;
} | null = null;

export async function getStaticCatalog(): Promise<StaticCatalogBootstrap> {
  const cacheKey = buildCacheKey();

  const cached = readCache(cacheKey);
  if (cached) return cached;

  if (inFlight?.cacheKey === cacheKey) return await inFlight.promise;

  const promise = fetchBootstrap();
  inFlight = { cacheKey, promise };

  try {
    const bootstrap = await promise;
    writeCache(cacheKey, bootstrap);
    return bootstrap;
  } finally {
    inFlight = null;
  }
}

/** Every product in the catalogue, for `generateStaticParams` and the sitemap. */
export async function getStaticProducts(): Promise<Product[]> {
  return (await getStaticCatalog()).products;
}

/**
 * One product by slug, served from the snapshot rather than the network.
 *
 * The signature deliberately mirrors `getProductBySlug` so a route reads the
 * same, while costing nothing after the first call.
 */
export async function getStaticProductBySlug(
  slug: string,
): Promise<Product | null> {
  const products = await getStaticProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

async function fetchBootstrap(): Promise<StaticCatalogBootstrap> {
  const client = await getBuildClient();

  return await client.catalog.getStaticCatalogBootstrap({
    categoryListKey: bacanoListKeys.catalogCategories,
    attributeListKey: bacanoListKeys.catalogAttributes,
    pageSize: STATIC_PRODUCT_PAGE_SIZE,
    initialPageSize: STATIC_INITIAL_PAGE_SIZE,
    maxProducts: STATIC_PRODUCT_LIMIT,
  });
}

/**
 * Everything that would make a cached snapshot the wrong answer.
 *
 * The build id is what separates one publish from the next: without it a
 * rebuild triggered by a product change would happily serve the previous
 * catalogue out of `.next/cache` and publish a site with none of the edits
 * that caused it.
 */
function buildCacheKey(): string {
  return [
    process.env.NEXT_PUBLIC_BACANO_API_URL ?? "",
    process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG ?? "",
    bacanoListKeys.catalogCategories,
    bacanoListKeys.catalogAttributes,
    STATIC_PRODUCT_LIMIT,
    buildId(),
  ].join("::");
}

/**
 * GitHub sets `GITHUB_RUN_ID` on every run, including the republish of an
 * unchanged commit. Locally there is no such marker, so fall back to the
 * process start time — a `next build` is one process, and a second build is a
 * second process with a later value.
 */
function buildId(): string {
  return (
    // `BACANO_BUILD_ID` first: it is set deliberately, and `GITHUB_RUN_ID` is
    // ambient. The test harness builds twice inside one CI run and needs each
    // build to have its own identity — with the ambient value winning, the
    // second build silently reused the first one's catalogue.
    process.env.BACANO_BUILD_ID ??
    process.env.GITHUB_RUN_ID ??
    String(Math.floor(Date.now() / 1000) - Math.floor(process.uptime()))
  );
}

function readCache(cacheKey: string): StaticCatalogBootstrap | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as CacheFile;
    return parsed.cacheKey === cacheKey ? parsed.bootstrap : null;
  } catch {
    // A corrupt cache is not a build failure: fetching again is always correct,
    // just slower.
    return null;
  }
}

function writeCache(cacheKey: string, bootstrap: StaticCatalogBootstrap): void {
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(
      CACHE_FILE,
      JSON.stringify({
        cacheKey,
        cachedAt: new Date().toISOString(),
        bootstrap,
      } satisfies CacheFile),
    );
  } catch {
    // Losing the cache costs requests, not correctness.
  }
}
