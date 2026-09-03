import { normalizePreviewRoute } from "@bacano/sdk/react/preview";
import { expect, test } from "@playwright/test";
import {
  isPreviewablePath,
  PREVIEW_STATIC_ROUTES,
  suggestedPreviewRoutes,
} from "@/features/preview/routes";

/**
 * The route table, which two things derive from — `isPreviewableRoute` on the
 * provider and the toolbar's suggestions. The reference storefront keeps two
 * lists and they drifted, which is the whole reason this is one table.
 */

test("every suggested route is previewable", () => {
  // The derivation that matters: a route the toolbar offers and the provider
  // refuses is a dead button, and nothing else would catch it.
  for (const route of suggestedPreviewRoutes("camiseta")) {
    expect(isPreviewablePath(route), route).toBe(true);
  }
});

test("the static routes are the normalized spellings", () => {
  // The provider normalizes before matching, so a table entry that is not
  // already normalized can never match. `/catalogo/` with a trailing slash is
  // the trap: normalization strips it.
  for (const route of PREVIEW_STATIC_ROUTES) {
    expect(normalizePreviewRoute(route), route).toBe(route);
  }
});

test("a product route needs exactly one non-empty segment", () => {
  expect(isPreviewablePath("/producto/camiseta")).toBe(true);
  expect(isPreviewablePath("/producto/")).toBe(false);
  expect(isPreviewablePath("/producto")).toBe(false);
  // Two segments would render the first slug and silently ignore the rest.
  expect(isPreviewablePath("/producto/a/b")).toBe(false);
});

test("shop routes that have no preview are refused, not half-rendered", () => {
  // Cart and checkout are stateful and have nothing to preview. They must fall
  // to the "unsupported" branch rather than matching and rendering empty.
  for (const route of ["/carrito", "/checkout", "/pago/respuesta", "/pedido"]) {
    expect(isPreviewablePath(route), route).toBe(false);
  }
});

test("the toolbar omits the product entry when the catalogue is empty", () => {
  // Every store on its first day. A hardcoded sample slug would 404 on all of
  // them, and the button would look broken rather than absent.
  expect(suggestedPreviewRoutes()).toEqual([...PREVIEW_STATIC_ROUTES]);
  expect(suggestedPreviewRoutes("camiseta")).toContain("/producto/camiseta");
});

/**
 * The normalizer this page uses is NOT the edge's normalizer, and the two must
 * not be reconciled.
 *
 * The contract calls `previewRoute` "three implementations" of one function.
 * Measured against inputs the recorded vectors do not cover, five of seven
 * disagree — and every disagreement is decoding:
 *
 *   input                  SDK (this page)   edge function
 *   /producto/caf%C3%A9    /producto/café    /producto/caf%C3%A9
 *   /producto/a%2Fb        /producto/a/b     /producto/a%2Fb
 *   /foo%                  /                 /foo%
 *   "  /catalogo"          /catalogo         /
 *   /%2e%2e/secret         /../secret        /%2e%2e/secret
 *
 * Both are right at their own hop. This page slices the slug out of the route
 * and hands it to `getProductBySlug`, so it needs the decoded form. The edge
 * guards a path prefix, where decoding would let an attacker spell around the
 * guard — which is why it grew a separate wire-decoding step rather than
 * decoding inside the normalizer.
 *
 * They are two steps sharing one name. Pinned here because this repository
 * holds no copy of the contract vectors, so nothing else would catch someone
 * making them agree — and the failure would look like a preview bug.
 */
test("the page's normalizer decodes, because the slug is a lookup key", () => {
  // The accented slug is the case that matters: undecoded, getProductBySlug
  // misses and the page reports a product that exists as missing.
  expect(normalizePreviewRoute("/producto/caf%C3%A9")).toBe("/producto/café");
  expect(normalizePreviewRoute("/producto/a%2Fb")).toBe("/producto/a/b");

  // And a decoded accented route is still previewable — a decode that produced
  // something the table rejects would be worse than not decoding.
  expect(isPreviewablePath(normalizePreviewRoute("/producto/caf%C3%A9"))).toBe(
    true,
  );
});

test("decoding cannot turn a route into an off-origin one", () => {
  // The reason decoding is safe at this hop: the result is used to fetch a
  // product and to push a same-origin URL, never to choose a host. Asserted
  // rather than assumed, since the edge's caution about decoding is warranted
  // at its own hop.
  // example.com deliberately: it is IANA-reserved for documentation, so a
  // public repository is not naming somebody's real host. The disclosure check
  // rejected the first draft of this test for exactly that.
  const OTHER = "example.com";

  for (const hostile of [
    `%2F%2F${OTHER}`,
    `https%3A%2F%2F${OTHER}`,
    "/%2e%2e/secret",
  ]) {
    const route = normalizePreviewRoute(hostile);
    // Same-origin, and never protocol-relative — the spelling that would make
    // a fetch or a pushState leave the origin.
    expect(route.startsWith("/"), route).toBe(true);
    expect(route.startsWith("//"), route).toBe(false);
    expect(route.includes(OTHER), route).toBe(false);
  }

  // `%2F%2F<host>` decodes to `//<host>`, which the normalizer then rejects for
  // its leading slashes and returns `/`. Falling back to the home route is the
  // correct outcome, not a failure — asserted so the fallback cannot be
  // mistaken for a match on a hostile input.
  expect(normalizePreviewRoute(`%2F%2F${OTHER}`)).toBe("/");
});
