import type { Metadata } from "next";
import { getStaticCatalog } from "@/lib/static-catalog";
import { CatalogView } from "@/views/CatalogView";

export const metadata: Metadata = {
  title: "Catálogo",
  alternates: { canonical: "/catalogo/" },
};

export default async function CatalogPage() {
  // `initialPage` is the first catalogue page the snapshot was built with,
  // already ordered and filtered the way the store is configured.
  const { initialPage } = await getStaticCatalog();

  return <CatalogView products={initialPage.products} />;
}
