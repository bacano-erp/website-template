import type { Metadata } from "next";
import { Suspense } from "react";
import { StorefrontPreview } from "@/components/StorefrontPreview";

/**
 * The authenticated preview page.
 *
 * Ships in the same `out/` the public host serves — there is no second build.
 * Its absence from a customer's domain is enforced by the CloudFront function,
 * which 404s this path on every host except the preview host and refuses that
 * one without a signed session. See the storefront guard in bacano-sites-infra.
 *
 * `robots: noindex, nofollow` regardless, because defence in depth costs
 * nothing here: the edge already refuses crawlers, and if it ever stopped, a
 * meta tag is the difference between a mistake and an indexed second copy of
 * the shop.
 */
export const metadata: Metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return (
    <Suspense fallback={null}>
      <StorefrontPreview />
    </Suspense>
  );
}
