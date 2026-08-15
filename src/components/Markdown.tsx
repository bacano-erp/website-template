import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders a Markdown string from the Bacano catalogue.
 *
 * Product descriptions are Markdown, not plain text — staff write them in the
 * ERP's rich-text editor, which stores Markdown (tiptap-markdown). Printing the
 * raw string put literal `**asterisks**` in front of shoppers on every product
 * page that used any formatting at all.
 *
 * A Server Component with no "use client": this runs at build time and the
 * resulting HTML is baked into the export, so no Markdown parser reaches the
 * browser and crawlers see real markup rather than a wall of punctuation.
 *
 * `remark-gfm` for tables and strikethrough, matching what the ERP editor can
 * produce. HTML embedded in the Markdown is NOT rendered: react-markdown
 * ignores raw HTML unless rehype-raw is added, which is the behaviour we want
 * for text that ultimately comes from a form.
 *
 * Element classes are set by hand because @tailwindcss/typography is not
 * installed; adding a plugin to style four elements is not worth the build
 * weight for a template every customer inherits.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="mt-4 space-y-3 text-neutral-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-900">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="underline hover:text-neutral-900"
              rel="nofollow noopener"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h2 className="mt-6 font-semibold text-neutral-900 text-xl">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 font-semibold text-lg text-neutral-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 font-semibold text-base text-neutral-900">
              {children}
            </h3>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
