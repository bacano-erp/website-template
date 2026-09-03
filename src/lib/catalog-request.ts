import { bacanoListKeys } from "@/config/bacano-lists";

/**
 * The catalogue request the published site is built from.
 *
 * Its own module, with **no Node imports**, because two callers on opposite
 * sides of the client boundary need it: `lib/static-catalog.ts` at build time,
 * and the preview loader in the browser.
 *
 * That separation is not stylistic. `static-catalog.ts` imports `node:fs` for
 * its build cache, so importing these options from there pulled `node:fs` into
 * the client bundle and Turbopack refused the build outright — "the chunking
 * context does not support external modules (request: node:fs)". The first
 * version of the preview loader did exactly that.
 *
 * ## Why it is shared at all
 *
 * Preview makes the same call at request time that the build makes, and that
 * identity is the premise: what preview shows is what the next publish would
 * bake, not an approximation read through different arguments. Two copies of
 * these five values would drift — a different `initialPageSize` alone would
 * give preview a catalogue page the built one does not have, and both would
 * look correct.
 */

/** Products per gateway request while paging the snapshot. */
export const STATIC_PRODUCT_PAGE_SIZE = 100;

/** Products shown on the first catalogue page, before the shopper filters. */
export const STATIC_INITIAL_PAGE_SIZE = 24;

/** Safety ceiling for one build, so a runaway catalogue cannot hang CI. */
export const STATIC_PRODUCT_LIMIT = 10_000;

export function staticCatalogBootstrapOptions() {
  return {
    categoryListKey: bacanoListKeys.catalogCategories,
    attributeListKey: bacanoListKeys.catalogAttributes,
    pageSize: STATIC_PRODUCT_PAGE_SIZE,
    initialPageSize: STATIC_INITIAL_PAGE_SIZE,
    maxProducts: STATIC_PRODUCT_LIMIT,
  };
}
