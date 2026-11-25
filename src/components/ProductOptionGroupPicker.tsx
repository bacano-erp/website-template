import type { Product } from "@bacano/sdk";
import Image from "next/image";
import Link from "next/link";
import { getOptionGroupView, type OptionGroupChoice } from "@/lib/option-group";

/**
 * The products grouped with this one in Bacano (the same model in other
 * colours, for example), each linking to its own page.
 *
 * Rendered at build time from the snapshot, so it is in the first HTML. A
 * merchant can group products in Bacano at any moment without touching the
 * website, so every product page renders this even if no group exists yet.
 * Which members show, and which link, is decided in `getOptionGroupView`.
 */
export function ProductOptionGroupPicker({ product }: { product: Product }) {
  const group = getOptionGroupView(product);
  if (!group) return null;

  const titleId = `option-group-${group.id}`;
  return (
    <section className="mt-6" aria-labelledby={titleId}>
      <p id={titleId} className="font-medium text-sm">
        {group.title}
      </p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {group.choices.map((choice) => (
          <li key={choice.id}>
            <OptionGroupChoiceItem choice={choice} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function OptionGroupChoiceItem({ choice }: { choice: OptionGroupChoice }) {
  const content = (
    <>
      <span
        className={`relative block size-14 overflow-hidden rounded-md bg-neutral-100 ${
          choice.isCurrent
            ? "ring-2 ring-neutral-900"
            : "ring-1 ring-neutral-200 transition group-hover:ring-neutral-400"
        }`}
      >
        {choice.thumbnailUrl ? (
          <Image
            src={choice.thumbnailUrl}
            alt=""
            fill
            sizes="56px"
            // No Referer: Bacano storage refuses hosts it does not trust.
            referrerPolicy="no-referrer"
            className="object-cover"
          />
        ) : null}
      </span>
      <span
        className={`line-clamp-2 text-center text-xs ${
          choice.isCurrent ? "font-semibold" : "text-neutral-600"
        }`}
      >
        {choice.label}
      </span>
    </>
  );
  const itemClass = "grid w-16 justify-items-center gap-1.5";

  if (!choice.href) {
    return (
      <div
        className={itemClass}
        aria-current={choice.isCurrent ? "page" : undefined}
      >
        {content}
      </div>
    );
  }
  return (
    <Link
      href={choice.href}
      className={`group ${itemClass} rounded-md focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      {content}
    </Link>
  );
}
