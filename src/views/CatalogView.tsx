import type { Product } from "@bacano/sdk";
import { ProductCard } from "@/components/ProductCard";

/**
 * The catalogue page's markup.
 *
 * Takes the products already ordered and filtered the way the store is
 * configured — from the snapshot's `initialPage` on the built site, from the
 * equivalent live read in preview.
 */
export function CatalogView({ products }: { products: Product[] }) {
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
