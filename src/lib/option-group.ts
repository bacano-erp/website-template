import type { Product } from "@bacano/sdk";
import { getPrimaryProductImage } from "@bacano/sdk";

export type OptionGroupChoice = {
  id: string;
  label: string;
  /** Null for the current product and for one not published on this site. */
  href: string | null;
  isCurrent: boolean;
  thumbnailUrl: string | null;
};

export type OptionGroupView = {
  id: string;
  title: string;
  choices: OptionGroupChoice[];
};

/**
 * What a product page shows of the product's option group: the grouped
 * products in Bacano's order, each with its label, thumbnail and page.
 *
 * Null when the product has no group or the group holds only itself. A member
 * without a slug is not published on this website, so it gets no link: its
 * page does not exist here. The current product falls back to its own media
 * when Bacano sends none for its member entry.
 */
export function getOptionGroupView(product: Product): OptionGroupView | null {
  const group = product.optionGroup;
  if (!group || group.members.length < 2) return null;

  const choices = [...group.members]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((member) => {
      const isCurrent = member.productId === product.id;
      const media =
        member.media.length > 0 || !isCurrent ? member.media : product.media;
      return {
        id: member.id,
        label: member.displayLabel?.trim() || member.name,
        href: isCurrent || !member.slug ? null : `/producto/${member.slug}/`,
        isCurrent,
        thumbnailUrl: getPrimaryProductImage(media)?.thumbnailUrl || null,
      };
    });

  return {
    id: group.id,
    title: group.title?.trim() || "Opciones",
    choices,
  };
}
