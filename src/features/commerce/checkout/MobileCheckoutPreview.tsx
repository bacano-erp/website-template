/* eslint-disable @next/next/no-img-element -- product images come pre-sized from the Bacano CDN with a srcset, which next/image cannot pass under static export */
import type { LocalCartItem } from "@/features/commerce/cart/local-cart";

export function MobileCheckoutPreview({ items }: { items: LocalCartItem[] }) {
  return (
    <section className="grid justify-items-start gap-3 py-2 text-left sm:hidden">
      <div>
        <h1 className="font-black text-[22px] text-accent leading-7">
          ¡Ya casi es tuyo!
        </h1>
      </div>
      <ProductStack items={items} />
    </section>
  );
}

function ProductStack({ items }: { items: LocalCartItem[] }) {
  return (
    <span className="flex justify-center -space-x-2">
      {items.slice(0, 3).map((item, index) => {
        const imageSrc = item.productVariant.product.imageSrc;

        return (
          <span
            key={item.id}
            className="relative size-12 overflow-hidden rounded-md border-2 border-white bg-warning-soft shadow-sm"
            style={{ zIndex: 3 - index }}
          >
            {imageSrc ? (
              // biome-ignore lint/performance/noImgElement: CDN srcset; next/image cannot pass one under static export
              <img
                referrerPolicy="no-referrer"
                src={imageSrc}
                srcSet={item.productVariant.product.imageSrcSet ?? undefined}
                alt=""
                width={48}
                height={48}
                className="absolute inset-0 size-full object-cover object-center"
              />
            ) : (
              <span className="grid h-full place-items-center font-medium text-sm text-warning">
                {item.productVariant.product.name.charAt(0)}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
