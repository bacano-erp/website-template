/* eslint-disable @next/next/no-img-element -- product images come pre-sized from the Bacano CDN with a srcset, which next/image cannot pass under static export */
import type React from "react";

import { resolveBacanoContentMediaSrc } from "@/lib/bacano/media";
import type {
  BacanoRichTextDocument,
  BacanoRichTextMark,
  BacanoRichTextNode,
} from "@/lib/bacano/rich-text";

type BacanoRichTextProps = {
  documents?: BacanoRichTextDocument[];
  className?: string;
};

export function BacanoRichText({
  documents,
  className = "grid gap-5 text-base leading-8 text-muted",
}: BacanoRichTextProps) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className={className}>
      {documents.flatMap((document, documentIndex) =>
        renderNodes(document.content ?? [], `doc-${documentIndex}`),
      )}
    </div>
  );
}

function renderNodes(nodes: BacanoRichTextNode[], keyPrefix: string) {
  return nodes.map((node, index) => renderNode(node, `${keyPrefix}-${index}`));
}

function renderNode(node: BacanoRichTextNode, key: string): React.ReactNode {
  const children = renderNodes(node.content ?? [], key);

  switch (node.type) {
    case "text":
      return (
        <span key={key}>
          {applyMarks(node.text ?? "", node.marks ?? [], key)}
        </span>
      );
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading":
      return renderHeading(node, key, children);
    case "hardBreak":
      return <br key={key} />;
    case "bulletList":
      return (
        <ul key={key} className="list-disc space-y-2 pl-6">
          {children}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="list-decimal space-y-2 pl-6">
          {children}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-accent border-l-4 bg-accent-soft py-3 pr-4 pl-5 text-foreground"
        >
          {children}
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-lg bg-foreground p-4 text-muted text-sm leading-7"
        >
          <code>{getNodeText(node)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} className="border-border" />;
    case "bacanoImage":
      return renderBacanoImage(node, key);
    case "bacanoVideo":
      return renderBacanoVideo(node, key);
    case "externalVideo":
      return renderExternalVideo(node, key);
    case "table":
      return (
        <div
          key={key}
          className="overflow-x-auto rounded-lg border border-black"
        >
          <table className="min-w-full border-collapse bg-white text-left text-black text-sm">
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{children}</tr>;
    case "tableHeader":
      return (
        <th
          key={key}
          className="border border-black bg-black px-4 py-3 font-black text-white"
        >
          {children}
        </th>
      );
    case "tableCell":
      return (
        <td
          key={key}
          className="border border-black bg-white px-4 py-3 align-top text-black"
        >
          {children}
        </td>
      );
    default:
      return children.length > 0 ? <div key={key}>{children}</div> : null;
  }
}

function renderHeading(
  node: BacanoRichTextNode,
  key: string,
  children: React.ReactNode[],
) {
  const level = readNumber(node.attrs?.level);
  const className = "font-black leading-tight text-foreground";

  if (level === 1) {
    return (
      <h2 key={key} className={`${className} text-3xl`}>
        {children}
      </h2>
    );
  }

  if (level === 3) {
    return (
      <h3 key={key} className={`${className} text-xl`}>
        {children}
      </h3>
    );
  }

  return (
    <h2 key={key} className={`${className} text-2xl`}>
      {children}
    </h2>
  );
}

function renderBacanoImage(node: BacanoRichTextNode, key: string) {
  const attrs = node.attrs ?? {};
  const src = resolveBacanoContentMediaSrc({
    src: readString(attrs.src),
    originalUrl: readString(attrs.originalUrl),
    thumbnailUrl: readString(attrs.thumbnailUrl),
    cardUrl: readString(attrs.cardUrl),
    detailUrl: readString(attrs.detailUrl),
    purpose: "detail",
  });
  if (!src) return null;

  const alt = readString(attrs.altText) ?? readString(attrs.alt) ?? "";
  const caption =
    attrs.showCaption === true ? readString(attrs.caption) : undefined;

  return (
    <figure
      key={key}
      className={`grid gap-2 ${alignmentClass(attrs.textAlign)}`}
    >
      {/* biome-ignore lint/performance/noImgElement: CDN srcset; next/image cannot pass one under static export */}
      <img
        referrerPolicy="no-referrer"
        src={src}
        alt={alt}
        className="max-h-[520px] max-w-full rounded-lg object-contain"
        loading="lazy"
      />
      {caption ? (
        <figcaption className="text-muted text-sm leading-6">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function renderBacanoVideo(node: BacanoRichTextNode, key: string) {
  const attrs = node.attrs ?? {};
  const src = resolveBacanoContentMediaSrc({
    src: readString(attrs.src),
    originalUrl: readString(attrs.originalUrl),
    thumbnailUrl: readString(attrs.thumbnailUrl),
    cardUrl: readString(attrs.cardUrl),
    detailUrl: readString(attrs.detailUrl),
    purpose: "detail",
  });
  if (!src) return null;
  const caption =
    attrs.showCaption === true ? readString(attrs.caption) : undefined;

  return (
    <figure
      key={key}
      className={`grid gap-2 ${alignmentClass(attrs.textAlign)}`}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: editorial video from Content, which carries no caption track */}
      <video
        src={src}
        controls
        preload="metadata"
        className="max-h-[520px] max-w-full rounded-lg bg-foreground"
      />
      {caption ? (
        <figcaption className="text-muted text-sm leading-6">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function renderExternalVideo(node: BacanoRichTextNode, key: string) {
  const attrs = node.attrs ?? {};
  const url = readSafeUrl(attrs.url);
  if (!url) return null;

  const embedUrl = getExternalVideoEmbedUrl(url, readString(attrs.provider));
  if (!embedUrl) {
    return (
      <a
        key={key}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="font-bold text-accent underline underline-offset-4"
      >
        Ver video
      </a>
    );
  }

  return (
    <div
      key={key}
      className="aspect-video overflow-hidden rounded-lg bg-foreground"
    >
      <iframe
        src={embedUrl}
        title="Video"
        className="h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

function applyMarks(
  text: string,
  marks: BacanoRichTextMark[],
  keyPrefix: string,
): React.ReactNode {
  return marks.reduce<React.ReactNode>((content, mark, index) => {
    const key = `${keyPrefix}-mark-${index}`;

    switch (mark.type) {
      case "bold":
        return <strong key={key}>{content}</strong>;
      case "italic":
        return <em key={key}>{content}</em>;
      case "underline":
        return (
          <span key={key} className="underline underline-offset-4">
            {content}
          </span>
        );
      case "strike":
        return <s key={key}>{content}</s>;
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-surface-secondary px-1.5 py-0.5 text-foreground text-sm"
          >
            {content}
          </code>
        );
      case "link":
        return renderLinkMark(mark, key, content);
      case "textStyle":
        return renderTextStyleMark(mark, key, content);
      default:
        return content;
    }
  }, text);
}

function renderLinkMark(
  mark: BacanoRichTextMark,
  key: string,
  children: React.ReactNode,
) {
  const href = readSafeUrl(mark.attrs?.href);
  if (!href) return children;

  return (
    <a
      key={key}
      href={href}
      target={
        href.startsWith("/") || href.startsWith("#") ? undefined : "_blank"
      }
      rel={
        href.startsWith("/") || href.startsWith("#") ? undefined : "noreferrer"
      }
      className="font-bold text-accent underline underline-offset-4"
    >
      {children}
    </a>
  );
}

function renderTextStyleMark(
  mark: BacanoRichTextMark,
  key: string,
  children: React.ReactNode,
) {
  const color = readSafeHexColor(mark.attrs?.color);
  if (!color) return children;

  return (
    <span key={key} style={{ color }}>
      {children}
    </span>
  );
}

function alignmentClass(value: unknown) {
  const textAlign = readString(value);
  if (textAlign === "center") return "justify-items-center text-center";
  if (textAlign === "right") return "justify-items-end text-right";
  return "justify-items-start text-left";
}

function readSafeUrl(value: unknown) {
  const href = readString(value);
  if (!href) return undefined;
  if (href.startsWith("/") || href.startsWith("#")) return href;

  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function getExternalVideoEmbedUrl(url: string, provider: string | undefined) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const normalizedProvider = provider?.toLowerCase();

    if (
      normalizedProvider === "youtube" ||
      host === "youtube.com" ||
      host === "youtu.be"
    ) {
      const id =
        host === "youtu.be"
          ? parsed.pathname.slice(1)
          : parsed.searchParams.get("v");
      return id
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
        : null;
    }

    if (normalizedProvider === "vimeo" || host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id
        ? `https://player.vimeo.com/video/${encodeURIComponent(id)}`
        : null;
    }

    return null;
  } catch {
    return null;
  }
}

function getNodeText(node: BacanoRichTextNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(getNodeText).join("");
}

function readSafeHexColor(value: unknown) {
  const color = readString(value);
  return color && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color)
    ? color
    : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}
