export type BacanoRichTextDocument = {
  type: "doc";
  content?: BacanoRichTextNode[];
};

export type BacanoRichTextNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown> | null;
  marks?: BacanoRichTextMark[];
  content?: BacanoRichTextNode[];
};

export type BacanoRichTextMark = {
  type?: string;
  attrs?: Record<string, unknown> | null;
};

export function isBacanoRichTextDocument(
  value: unknown,
): value is BacanoRichTextDocument {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as { type?: unknown }).type === "doc" &&
    Array.isArray((value as { content?: unknown }).content)
  );
}

export function readRichTextDocuments(value: unknown) {
  if (isBacanoRichTextDocument(value)) return [value];
  if (!Array.isArray(value)) return [];

  return value.filter(isBacanoRichTextDocument);
}

export function richTextToPlainText(value: BacanoRichTextDocument) {
  return readRichTextNodesText(value.content ?? [])
    .replace(/\s+/g, " ")
    .trim();
}

function readRichTextNodesText(nodes: BacanoRichTextNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "hardBreak") return "\n";
      return readRichTextNodesText(node.content ?? []);
    })
    .join(" ");
}
