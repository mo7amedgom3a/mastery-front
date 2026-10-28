import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { isolateChildren, type TextDir } from "@/components/content/bidi";
import { safeHref } from "@/components/content/markdown";

/** Element renderers whose text gets its foreign-script runs isolated (see `components/content/bidi`). */
function bidiComponents(dir: TextDir): Components {
  const text = (children: ReactNode) => isolateChildren(children, dir);
  return {
    p: ({ children }) => <p className="m-0 text-pretty">{text(children)}</p>,
    ul: ({ children }) => <ul className="m-0 grid list-disc gap-1.5 ps-5 marker:text-accent">{children}</ul>,
    ol: ({ children }) => <ol className="m-0 grid list-decimal gap-1.5 ps-5 marker:text-accent">{children}</ol>,
    li: ({ children }) => <li className="ps-1 text-pretty">{text(children)}</li>,
    strong: ({ children }) => <strong className="font-bold">{text(children)}</strong>,
    em: ({ children }) => <em>{text(children)}</em>,
    h1: ({ children }) => <p className="m-0 font-bold">{text(children)}</p>,
    h2: ({ children }) => <p className="m-0 font-bold">{text(children)}</p>,
    h3: ({ children }) => <p className="m-0 font-bold">{text(children)}</p>,
    h4: ({ children }) => <p className="m-0 font-bold">{text(children)}</p>,
    a: ({ href, children }) => {
      const safe = safeHref(href);
      return safe ? (
        <a href={safe} className="text-accent underline underline-offset-4" rel="noopener noreferrer">
          {text(children)}
        </a>
      ) : (
        <span>{text(children)}</span>
      );
    },
    code: ({ children }) => (
      <bdi dir="ltr" className="rounded-chip bg-(--fill-soft) px-1 font-mono text-[0.9em]">
        {children}
      </bdi>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-start">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border border-line p-2 text-start font-bold">{text(children)}</th>,
    td: ({ children }) => <td className="border border-line p-2">{text(children)}</td>,
    img: () => null,
  };
}

const COMPONENTS: Record<TextDir, Components> = { rtl: bidiComponents("rtl"), ltr: bidiComponents("ltr") };

/**
 * An advisor answer as compact markdown in its own reading direction. Answers mix Arabic with course
 * codes, prices and English skill names; each such run is isolated so it can't drag neighbouring
 * punctuation or numbers out of place.
 */
export function AdvisorMarkdown({ source, dir }: { source: string; dir: TextDir }) {
  return (
    <div dir={dir} className="flex flex-col gap-2 text-start text-sm leading-7 text-fg">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS[dir]} skipHtml>
        {source}
      </ReactMarkdown>
    </div>
  );
}
