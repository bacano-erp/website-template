"use client";

import {
  BacanoPreviewShell,
  interceptPreviewLink,
  normalizePreviewRoute,
} from "@bacano/sdk/react/preview";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPreviewRouteLoader,
  type PreviewDocument,
} from "@/features/preview/preview-data";
import {
  isPreviewablePath,
  suggestedPreviewRoutes,
} from "@/features/preview/routes";
import { CatalogView } from "@/views/CatalogView";
import { HomeView } from "@/views/HomeView";
import { ProductView } from "@/views/ProductView";

/**
 * One page that renders any previewable route from live data.
 *
 * The views are the same components the built pages use — imported from
 * `src/views/`, unchanged. That is what makes this a preview of the store
 * rather than a second implementation of it.
 */

/** Read once on mount. The URL is authoritative; the SDK normalizes again. */
function routeFromLocation(): string {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("route");
  return normalizePreviewRoute(raw ?? "/");
}

export function StorefrontPreview() {
  const [route, setRoute] = useState(routeFromLocation);

  /**
   * `pushState`, not `location.assign`.
   *
   * The SDK provider keeps its document cache in a ref, so a full navigation
   * unmounts it and every route change refetches — the reference storefront
   * assigns `location` and has never served a second route from that cache.
   * `pushState` keeps the component mounted, so going back to a visited route
   * is instant, and the back button works at all.
   */
  const navigate = useCallback((next: string) => {
    const normalized = normalizePreviewRoute(next);
    const url = `/vista-previa/?route=${encodeURIComponent(normalized)}`;
    window.history.pushState({ route: normalized }, "", url);
    setRoute(normalized);
  }, []);

  // Without this the back button changes the URL and leaves the page showing
  // the route it was already on, which reads as the preview being stuck.
  useEffect(() => {
    const onPop = () => setRoute(routeFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // useMemo, not useCallback: createPreviewRouteLoader is a factory, so
  // useCallback would have called it on every render and thrown the result
  // away while returning the first one. The loader identity has to be stable —
  // the SDK provider keys its cache on it.
  // The toolbar's product suggestion, discovered by the loader. Held here
  // because the toolbar is built outside the render callback that receives
  // documents, so a slug returned on the document could never reach it.
  const [sampleSlug, setSampleSlug] = useState<string>();

  const loadRoute = useMemo(
    () => createPreviewRouteLoader({ onSampleSlug: setSampleSlug }),
    [],
  );

  return (
    <BacanoPreviewShell<PreviewDocument>
      websiteSlug={process.env.NEXT_PUBLIC_BACANO_WEBSITE_SLUG ?? ""}
      route={route}
      loadRoute={loadRoute}
      navigate={navigate}
      normalizeRoute={normalizePreviewRoute}
      isPreviewableRoute={isPreviewablePath}
      initialPosition="top-right"
      toolbar={{
        websiteName: process.env.NEXT_PUBLIC_SITE_NAME || "Bacano Store",
        locale: "es-CO",
        suggestedRoutes: suggestedPreviewRoutes(sampleSlug),
      }}
    >
      {(preview) => {
        if (!preview.document) {
          return preview.status === "error" ? (
            <Message
              text="No se pudo cargar la vista previa."
              onRetry={preview.refresh}
            />
          ) : (
            <Skeleton />
          );
        }

        return (
          <div
            onClickCapture={(event) =>
              // In-store links navigate inside the preview instead of leaving
              // it. Without this, clicking a product card lands on the real
              // storefront path, which the edge refuses without a grant.
              interceptPreviewLink(event, {
                navigate: preview.navigate,
                normalizeRoute: normalizePreviewRoute,
                isPreviewableRoute: isPreviewablePath,
              })
            }
          >
            <Document document={preview.document} />
          </div>
        );
      }}
    </BacanoPreviewShell>
  );
}

function Document({ document }: { document: PreviewDocument }) {
  switch (document.kind) {
    case "home":
      return <HomeView featured={document.featured} />;
    case "catalog":
      return <CatalogView products={document.products} />;
    case "product":
      // `notFound()` is a routing concern and stays in the real route. Here
      // there is no route to fail, so a missing product is said plainly.
      return document.product ? (
        <ProductView product={document.product} />
      ) : (
        <Message text="Este producto no existe o no está publicado." />
      );
    default:
      return <Message text={`La vista previa no cubre ${document.route}.`} />;
  }
}

function Skeleton() {
  return (
    <div className="grid gap-6 py-10" aria-busy="true">
      <div className="h-10 animate-pulse rounded bg-neutral-100" />
      <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />
    </div>
  );
}

function Message({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-neutral-600">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
