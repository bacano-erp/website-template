import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Product, StaticCatalogBootstrap } from "@bacano/sdk";
import { getBuildClient } from "@/lib/bacano";
import { staticCatalogBootstrapOptions } from "@/lib/catalog-request";

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

  return await client.catalog.getStaticCatalogBootstrap(
    staticCatalogBootstrapOptions(),
  );
}

/**
 * What the snapshot is *of* — the store, and the lists it was built from.
 *
 * Deliberately free of anything that varies between processes. Next builds
 * routes in several worker processes, and every value in this key has to be
 * identical in all of them or they cannot share the file at all.
 */
function buildCacheKey(): string {
  const options = staticCatalogBootstrapOptions();
  return cacheKeyFor({
    apiUrl: process.env.NEXT_PUBLIC_BACANO_API_URL ?? "",
    websiteSlug: process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG ?? "",
    // From the shared request definition, so the cache key cannot describe a
    // different request than the one actually made.
    categoryListKey: options.categoryListKey,
    attributeListKey: options.attributeListKey,
    maxProducts: options.maxProducts,
  });
}

/**
 * Exported so a test can pin the shape.
 *
 * The point of the test is not the string but the absence of anything that
 * varies between processes: the bug this replaced put the process start time in
 * here, and the workers stopped sharing the cache.
 */
export function cacheKeyFor(input: {
  apiUrl: string;
  websiteSlug: string;
  categoryListKey: string;
  attributeListKey: string;
  maxProducts: number;
}): string {
  return [
    input.apiUrl,
    input.websiteSlug,
    input.categoryListKey,
    input.attributeListKey,
    input.maxProducts,
  ].join("::");
}

/**
 * Which build wrote the cache, when the environment can say so.
 *
 * `BACANO_BUILD_ID` is the deliberate answer, and wins. GitHub's
 * `GITHUB_RUN_ID` is the fallback: set on every run including a republish of an
 * unchanged commit, and identical across that run's workers, which is what a
 * publish needs.
 *
 * With neither — ordinary local development — this returns null and the
 * decision moves to the timestamp. See `isCacheFresh`.
 */
function buildId(): string | null {
  // `BACANO_BUILD_ID` first: it is set deliberately, while `GITHUB_RUN_ID` is
  // ambient and identical for everything in one CI run. The test harness builds
  // twice inside a single run and each build needs its own identity — with the
  // ambient value winning, the second build silently served the first one's
  // catalogue.
  return process.env.BACANO_BUILD_ID ?? process.env.GITHUB_RUN_ID ?? null;
}

/**
 * How long a snapshot may be reused when no build id is available.
 *
 * Only reached in local development. Long enough to cover one `next build`
 * across its workers, short enough that the next `pnpm build` after an edit
 * fetches again.
 */
const LOCAL_CACHE_TTL_MS = 3 * 60 * 1000;

/**
 * Whether a cached snapshot may be reused. Pure, so it can be tested directly.
 */
export function isCacheFresh(
  entry: { buildId: string | null; cachedAt: string },
  currentBuildId: string | null,
  now: number,
): boolean {
  // In CI the build id decides, and nothing else does: a cache written by an
  // earlier run is the previous publish's catalogue.
  if (currentBuildId) return entry.buildId === currentBuildId;

  // Locally, anything written by an identifiable build belongs to that build.
  if (entry.buildId) return false;

  const age = now - Date.parse(entry.cachedAt);

  // A negative age means the clock moved, not that the entry is new.
  return Number.isFinite(age) && age >= 0 && age < LOCAL_CACHE_TTL_MS;
}

function readCache(cacheKey: string): StaticCatalogBootstrap | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as CacheFile;
    if (parsed.cacheKey !== cacheKey) return null;
    return isCacheFresh(parsed, buildId(), Date.now())
      ? parsed.bootstrap
      : null;
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
