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
  /** The build that wrote it, when the environment names one. */
  buildId: string | null;
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
 *
 * For the file to be shared, every value in its key must be identical in every
 * worker. An earlier version mixed the process start time into the key, so
 * workers that started in different seconds each fetched the whole catalogue
 * and then overwrote the file for the others — the cache appeared to work only
 * because a small catalogue finishes before the clock ticks.
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
 * What the snapshot is *of* — the store, and the lists it was built from.
 *
 * Deliberately free of anything that varies between processes. Next builds
 * routes in several worker processes, and every value in this key has to be
 * identical in all of them or they cannot share the file at all.
 */
function buildCacheKey(): string {
  return [
    process.env.NEXT_PUBLIC_BACANO_API_URL ?? "",
    process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG ?? "",
    bacanoListKeys.catalogCategories,
    bacanoListKeys.catalogAttributes,
    STATIC_PRODUCT_LIMIT,
  ].join("::");
}

/**
 * Which build wrote the cache, when the environment can say so.
 *
 * GitHub sets `GITHUB_RUN_ID` on every run, including a republish of an
 * unchanged commit, so in CI this is exact: a new publish never reuses the
 * previous catalogue, and every worker in that run agrees on the value.
 *
 * Locally there is no such marker. Returning null puts the decision on the
 * timestamp instead — see `isFresh`.
 */
function buildId(): string | null {
  return process.env.GITHUB_RUN_ID ?? process.env.BACANO_BUILD_ID ?? null;
}

/**
 * How long a snapshot may be reused when no build id is available.
 *
 * Only reached in local development. Long enough to cover one `next build`
 * across its workers, short enough that the next `pnpm build` after an edit
 * fetches again.
 */
const LOCAL_CACHE_TTL_MS = 3 * 60 * 1000;

function isFresh(entry: CacheFile): boolean {
  const currentBuild = buildId();

  // In CI the build id decides, and nothing else does: a cache written by an
  // earlier run is the previous publish's catalogue.
  if (currentBuild) return entry.buildId === currentBuild;

  // Locally, anything written by an identifiable build belongs to that build.
  if (entry.buildId) return false;

  const age = Date.now() - Date.parse(entry.cachedAt);
  return Number.isFinite(age) && age >= 0 && age < LOCAL_CACHE_TTL_MS;
}

function readCache(cacheKey: string): StaticCatalogBootstrap | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as CacheFile;
    if (parsed.cacheKey !== cacheKey) return null;
    return isFresh(parsed) ? parsed.bootstrap : null;
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
        buildId: buildId(),
        cachedAt: new Date().toISOString(),
        bootstrap,
      } satisfies CacheFile),
    );
  } catch {
    // Losing the cache costs requests, not correctness.
  }
}
