import {
  type ContentEntryLocatorSource,
  getContentEntryLocatorAttributes,
} from "@bacano/sdk";
import type { ReactNode } from "react";

type Element = "section" | "article" | "aside" | "div";

/**
 * The outer element of a region whose copy comes from one Bacano Content entry.
 *
 * It carries the content locator's marker, which is how Bacano's browser
 * extension turns "this banner" into "open the entry that writes it". A region
 * built without it still renders, and the extension silently finds nothing —
 * so every editorial block goes through this component rather than spreading
 * the attributes by hand, and none is forgotten.
 *
 * Mark the block once, not its title or button. A card that comes from another
 * referenced entry gets its own nested section. Catalogue products, legal
 * documents and the template's own text are not Content and are never marked.
 * See STOREFRONT_CONTENT_LOCATOR.md in @bacano/sdk.
 */
export function ContentEntrySection({
  entry,
  as: Tag = "section",
  className,
  children,
}: {
  entry: ContentEntryLocatorSource;
  as?: Element;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={className} {...getContentEntryLocatorAttributes(entry)}>
      {children}
    </Tag>
  );
}
