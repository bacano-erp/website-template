import Link from "next/link";
import { getBuildClient } from "@/lib/bacano";
import { ProductCard } from "@/components/ProductCard";

// Server Component: this runs at build time, so the products below are baked
// into index.html and are visible to crawlers with no JavaScript.
export default async function HomePage() {
  const client = await getBuildClient();
  const products = await client.catalog.getProducts({ limit: 8 });

  return (
    <>
      <section className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          {process.env.NEXT_PUBLIC_SITE_NAME ?? "Bacano Store"}
        </h1>
        <p className="mt-2 text-neutral-600">
          Replace this section with the store&apos;s own hero and brand identity.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Destacados</h2>
          <Link href="/catalogo/" className="text-sm hover:underline">
            Ver todo
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-neutral-600">
            No hay productos publicados todavía. Publica productos para este
            sitio en la plataforma Bacano y vuelve a publicar el sitio.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
