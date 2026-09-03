import type { Product } from "@bacano/sdk";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

/**
 * The home page's markup. Takes the products it renders; see `view-models.ts`
 * for `homeFeatured`, which decides how many that is.
 */
export function HomeView({ featured }: { featured: Product[] }) {
  return (
    <>
      <section className="mb-12">
        <h1 className="font-semibold text-3xl tracking-tight">
          {process.env.NEXT_PUBLIC_SITE_NAME || "Bacano Store"}
        </h1>
        <p className="mt-2 text-neutral-600">
          Replace this section with the store&apos;s own hero and brand
          identity.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-semibold text-xl">Destacados</h2>
          <Link href="/catalogo/" className="text-sm hover:underline">
            Ver todo
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-neutral-600">
            No hay productos publicados todavía. Publica productos para este
            sitio en la plataforma Bacano y vuelve a publicar el sitio.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
