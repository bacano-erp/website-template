import type { Metadata } from "next";
import { getBuildClient } from "@/lib/bacano";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Catálogo",
};

export default async function CatalogPage() {
  const client = await getBuildClient();
  const products = await client.catalog.getProducts({ limit: 250 });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Catálogo</h1>

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
