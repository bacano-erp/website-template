import type { Product } from "@bacano/sdk";
import { expect, test } from "@playwright/test";
import { HOME_FEATURED_COUNT, homeFeatured } from "@/views/view-models";

/**
 * The rules that decide *what* a page shows, which the render-parity check
 * structurally cannot see.
 *
 * That check compares the built artifact between two commits, and it is the
 * safety argument for extracting these views. But `tests/fixtures/api.json`
 * holds **one** product, so `homeFeatured`'s slice is a no-op under it:
 * changing `HOME_FEATURED_COUNT` from 8 to 4 and rebuilding reports
 * `RESULT: IDENTICAL`. Measured, not assumed.
 *
 * Tested here rather than by growing the fixture, because other suites depend
 * on that fixture's shape.
 *
 * This matters most at the next step. Preview renders these same views from a
 * live catalogue read, and it has to call `homeFeatured` rather than slicing
 * again — otherwise the built page and the preview disagree about how many
 * products the home page shows, and nothing notices, because both render a
 * plausible page.
 */

/** Only `id` matters to the callers under test; the rest is never read. */
const products = (count: number): Product[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `product-${index}`,
  })) as unknown as Product[];

const ids = (list: Product[]) => list.map((product) => product.id);

test("the home page shows eight products, and that is one fact", () => {
  // Pinned as a value, not only as behaviour: the whole reason this constant
  // exists is that two renderers must agree on the number.
  expect(HOME_FEATURED_COUNT).toBe(8);
});

test("homeFeatured takes the first HOME_FEATURED_COUNT, in order", () => {
  // An input longer than the count — the case the fixture cannot produce.
  const featured = homeFeatured(products(20));

  expect(featured).toHaveLength(HOME_FEATURED_COUNT);
  expect(ids(featured)).toEqual([
    "product-0",
    "product-1",
    "product-2",
    "product-3",
    "product-4",
    "product-5",
    "product-6",
    "product-7",
  ]);
});

test("a catalogue shorter than the count passes through whole", () => {
  // Every store on its first day, and the shape the fixture actually has.
  expect(ids(homeFeatured(products(1)))).toEqual(["product-0"]);
  expect(homeFeatured(products(0))).toEqual([]);
});

test("homeFeatured does not mutate the catalogue it was given", () => {
  // The same array is handed to the sitemap and to generateStaticParams in the
  // build, and would be shared with the rest of a preview render.
  const all = products(20);
  homeFeatured(all);
  expect(all).toHaveLength(20);
});
