/**
 * Flattens Markdown to plain text for use in metadata.
 *
 * Meta descriptions, OpenGraph and Twitter cards are plain-text fields, and a
 * product description is Markdown — so `**Nintendo Switch 2**` was being handed
 * verbatim to search engines and social previews. That text is what a shopper
 * reads in the results page, which makes it a worse place for stray asterisks
 * than the product page itself.
 *
 * Deliberately a small transform rather than a full parse. It handles what the
 * ERP's editor emits — emphasis, headings, links, inline code, list bullets,
 * blockquotes — and it is not a Markdown implementation: a reference-style link
 * or a table renders as its own source here. The cost of being wrong is an odd
 * character in a description, so the trade is worth it; the alternative is
 * running remark twice per page to produce a single string.
 */
export function toPlainText(markdown: string): string {
  return (
    markdown
      // Fenced code: keep the contents, drop the fences.
      .replace(/```[^\n]*\n?/g, "")
      // Images before links — an image is a link with a leading `!`, and
      // dropping it first stops the alt text being promoted to body text.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Emphasis and inline code. Bold runs first so `**x**` does not leave a
      // stray asterisk behind from the single-marker pass.
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")
      // Line-leading markers: headings, quotes, list bullets.
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}[-*+]\s+/gm, "")
      .replace(/^\s{0,3}\d+\.\s+/gm, "")
      // Collapse to a single line: these fields are rendered as one.
      .replace(/\s+/g, " ")
      .trim()
  );
}
