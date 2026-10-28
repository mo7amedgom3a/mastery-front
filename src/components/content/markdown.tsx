import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/cn";

/** Only https and site-relative URLs are rendered; anything else is dropped. */
export function safeHref(url: string | undefined): string {
  const value = (url ?? "").trim();
  return value.startsWith("https://") || (value.startsWith("/") && !value.startsWith("//")) ? value : "";
}

const components: Components = {
  h1: ({ children }) => <h2 className="m-0 mt-10 text-3xl font-bold first:mt-0">{children}</h2>,
  h2: ({ children }) => <h3 className="m-0 mt-10 text-2xl font-bold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="m-0 mt-6 text-xl font-bold">{children}</h4>,
  h4: ({ children }) => <h5 className="m-0 mt-4 text-lg font-bold">{children}</h5>,
  p: ({ children }) => <p className="m-0 text-pretty">{children}</p>,
  ul: ({ children }) => <ul className="m-0 grid list-disc gap-2 ps-6 marker:text-accent">{children}</ul>,
  ol: ({ children }) => <ol className="m-0 grid list-decimal gap-2 ps-6 marker:text-accent">{children}</ol>,
  li: ({ children }) => <li className="ps-1 text-pretty">{children}</li>,
  a: ({ href, children }) => {
    const safe = safeHref(href);
    return safe ? (
      <a href={safe} className="text-accent underline underline-offset-4" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    );
  },
  img: ({ src, alt }) => {
    const safe = safeHref(typeof src === "string" ? src : undefined);
    // eslint-disable-next-line @next/next/no-img-element
    return safe ? <img src={safe} alt={alt ?? ""} loading="lazy" className="h-auto max-w-full rounded-panel" /> : null;
  },
  blockquote: ({ children }) => <blockquote className="m-0 border-s-4 border-accent ps-4 text-muted">{children}</blockquote>,
  hr: () => <hr className="border-line" />,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-start">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-line p-2 text-start font-bold">{children}</th>,
  td: ({ children }) => <td className="border border-line p-2">{children}</td>,
  code: ({ children }) => <code className="rounded bg-surface-2 px-1">{children}</code>,
};

/**
 * Renders a product README (markdown). Raw HTML in the source is not interpreted
 * (react-markdown escapes it), and links/images are restricted to https or site paths.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("flex max-w-[68ch] flex-col gap-4 text-base leading-8 text-fg", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {source}
      </ReactMarkdown>
    </div>
  );
}
