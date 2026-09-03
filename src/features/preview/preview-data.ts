import type {
  BacanoClient,
  Product,
  StaticCatalogBootstrap,
} from "@bacano/sdk";
import type { PreviewRouteLoader } from "@bacano/sdk/react/preview";
import { staticCatalogBootstrapOptions } from "@/lib/catalog-request";
import { homeFeatured } from "@/views/view-models";
import { isPreviewablePath } from "./routes";

/**
 * What a previewed route resolves to.
 *
 * A discriminated union rather than one wide object: each view takes exactly
 * the data it renders, so a missing field is a type error rather than a page
 * that renders with a hole in it.
 */
export type PreviewDocument =
  | { kind: "home"; featured: Product[] }
  | { kind: "catalog"; products: Product[] }
  | { kind: "product"; product: Product | null }
  | { kind: "unsupported"; route: string };

/**
 * The loader, reading live rather than from the build snapshot.
 *
 * `getStaticCatalogBootstrap` is deliberately the *same* call
 * `lib/static-catalog.ts` makes at build time. That is the property worth
 * having: what preview shows is what the next publish would bake, not an
 * approximation of it read through a different endpoint.
 *
 * `force` comes from the toolbar's refresh. The SDK caches per route, so
 * without honouring it the refresh button would return the same bytes.
 */
export function createPreviewRouteLoader(options?: {
  /**
   * Called with a real product slug the first time the catalogue yields one.
   *
   * The toolbar needs a `/producto/<slug>` suggestion — the route a reviewer
   * most wants to click — and only the loader has ever seen the catalogue. An
   * earlier version returned the slug on the document instead, where nothing
   * read it: the toolbar was built outside the render callback that receives
   * documents, so the suggestion silently never appeared.
   */
  onSampleSlug?: (slug: string) => void;
}): PreviewRouteLoader<PreviewDocument> {
  return async ({ route, client }) => {
    if (!isPreviewablePath(route)) {
      return { kind: "unsupported", route };
    }

    if (route.startsWith("/producto/")) {
      const slug = route.slice("/producto/".length);
      return {
        kind: "product",
        product: await client.catalog.getProductBySlug(slug),
      };
    }

    const bootstrap = await loadBootstrap(client);
    const sampleSlug = firstSlug(bootstrap.products);
    if (sampleSlug) options?.onSampleSlug?.(sampleSlug);

    if (route === "/catalogo") {
      return { kind: "catalog", products: bootstrap.initialPage.products };
    }

    // `homeFeatured`, not a slice repeated here. The build page and this must
    // agree on how many products the home page shows, and a fixture with one
    // product cannot tell them apart — see tests/unit/view-models.spec.ts.
    return { kind: "home", featured: homeFeatured(bootstrap.products) };
  };
}

/**
 * The same request the build makes, from the same definition.
 *
 * `force` needs nothing here. It is the SDK provider's own per-route cache being
 * bypassed — the toolbar's refresh re-invokes this loader, and performing the
 * call again is what freshness means. There is no cache option on this request
 * to pass it to, and inventing one is how the first draft of this file failed
 * to compile.
 */
async function loadBootstrap(
  client: BacanoClient,
): Promise<StaticCatalogBootstrap> {
  return await client.catalog.getStaticCatalogBootstrap(
    staticCatalogBootstrapOptions(),
  );
}

function firstSlug(products: Product[]): string | undefined {
  return products.find((product) => Boolean(product.slug))?.slug ?? undefined;
}
