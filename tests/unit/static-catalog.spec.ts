import { expect, test } from "@playwright/test";
import { cacheKeyFor, isCacheFresh } from "@/lib/static-catalog";

/**
 * The catalogue cache, tested where it broke.
 *
 * The bug these cover shipped with a comment claiming the opposite of what the
 * code did, and a one-product catalogue was small enough to hide it. Both rules
 * are now pure functions so the claim is executable rather than asserted.
 */

const THREE_MINUTES = 3 * 60 * 1000;
const NOW = Date.parse("2026-01-01T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

test.describe("the cache key", () => {
  const input = {
    apiUrl: "https://api.example.com",
    websiteSlug: "una-tienda",
    categoryListKey: "categorias-web",
    attributeListKey: "atributos",
    maxProducts: 10_000,
  };

  test("is built only from what the snapshot is of", () => {
    // Pinned deliberately. Next builds routes in several worker processes, and
    // they can only share the cache file if every term is identical in all of
    // them — the previous version mixed in the process start time, so workers
    // starting in different seconds each refetched the whole catalogue.
    expect(cacheKeyFor(input)).toBe(
      "https://api.example.com::una-tienda::categorias-web::atributos::10000",
    );
  });

  test("changes when the store or its lists change", () => {
    expect(cacheKeyFor({ ...input, websiteSlug: "otra" })).not.toBe(
      cacheKeyFor(input),
    );
    expect(cacheKeyFor({ ...input, categoryListKey: "otras" })).not.toBe(
      cacheKeyFor(input),
    );
  });
});

test.describe("freshness in CI, where a build id exists", () => {
  test("reuses the snapshot written by this same run", () => {
    expect(
      isCacheFresh({ buildId: "run-1", cachedAt: ago(0) }, "run-1", NOW),
    ).toBe(true);
  });

  test("refuses a snapshot from an earlier run, however recent", () => {
    // This is the one that protects a publish: reusing it would ship a store
    // built from the catalogue as it was before the edit that triggered it.
    expect(
      isCacheFresh({ buildId: "run-1", cachedAt: ago(1000) }, "run-2", NOW),
    ).toBe(false);
  });

  test("refuses a snapshot with no build id at all", () => {
    expect(
      isCacheFresh({ buildId: null, cachedAt: ago(0) }, "run-2", NOW),
    ).toBe(false);
  });
});

test.describe("freshness locally, where no build id exists", () => {
  test("reuses a snapshot from the same build", () => {
    expect(
      isCacheFresh({ buildId: null, cachedAt: ago(5_000) }, null, NOW),
    ).toBe(true);
  });

  test("refuses one older than the window", () => {
    expect(
      isCacheFresh(
        { buildId: null, cachedAt: ago(THREE_MINUTES + 1) },
        null,
        NOW,
      ),
    ).toBe(false);
  });

  test("refuses one a CI run left behind", () => {
    expect(
      isCacheFresh({ buildId: "run-9", cachedAt: ago(1_000) }, null, NOW),
    ).toBe(false);
  });

  test("refuses a future timestamp rather than trusting it", () => {
    // A clock that moved backwards must not make every entry look new.
    expect(
      isCacheFresh({ buildId: null, cachedAt: ago(-60_000) }, null, NOW),
    ).toBe(false);
  });

  test("refuses an unparseable timestamp", () => {
    expect(
      isCacheFresh({ buildId: null, cachedAt: "not a date" }, null, NOW),
    ).toBe(false);
  });
});
