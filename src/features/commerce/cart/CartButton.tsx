"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/features/commerce/cart/CartProvider";

export function CartButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      type="button"
      aria-label={
        itemCount > 0
          ? `Abrir carrito con ${itemCount} productos`
          : "Abrir carrito"
      }
      onClick={openCart}
      className="relative grid size-10 place-items-center rounded-full transition hover:bg-accent-soft hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
    >
      <ShoppingBag aria-hidden="true" size={25} strokeWidth={1.8} />
      {itemCount > 0 ? (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-warning px-1 font-black text-[11px] text-white leading-5">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}
