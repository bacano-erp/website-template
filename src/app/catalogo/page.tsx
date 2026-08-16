import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { getStaticCatalog } from "@/lib/static-catalog";

export const metadata: Metadata = {
  title: "Catálogo",
  alternates: { canonical: "/catalogo/" },
};

export default async function CatalogPage() {
  // `initialPage` is the first catalogue page the snapshot was built with,
  // already ordered and filtered the way the store is configured.
  const { initialPage } = await getStaticCatalog();
  const products = initialPage.products;

  return (
    <>
      <h1 className="mb-6 font-semibold text-2xl">Catálogo</h1>

      {products.length === 0 ? (
        <p className="text-neutral-600">No hay productos publicados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
