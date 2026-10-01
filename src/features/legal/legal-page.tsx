import { Plus } from "lucide-react";
import type { Route } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { formatCalendarDate } from "@/lib/format";

import { OpenLinkedSection } from "./components/open-linked-section";
import type { LegalBlock, LegalDocument } from "./content/types";

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "h") {
    return <h3 className="m-0 mt-2 text-base font-bold text-fg">{block.text}</h3>;
  }
  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return (
      <List className="m-0 flex flex-col gap-2 ps-5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    );
  }
  return <p className="m-0">{block.text}</p>;
}

/**
 * Terms and privacy: a title band, a contents list, and each section as a native disclosure (no JS,
 * the text is always in the HTML). Every section has its own anchor; the first starts open, and a
 * link to another one opens it.
 */
export function LegalPage({ document, related }: { document: LegalDocument; related: { label: string; href: Route } }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <header className="border-b border-line bg-surface-alt">
          <div className="ma-container flex flex-col items-start py-14 md:py-20">
            <span className="ma-tag ma-tag--outline">ماستري أكاديمي</span>
            <h1 className="t-section m-0 mt-5">{document.title}</h1>
            <p className="t-lead m-0 mt-4 max-w-[44rem] text-fg-muted">{document.description}</p>
            <p className="m-0 mt-6 text-sm text-fg-muted">
              آخر تحديث: <time dateTime={document.updated}>{formatCalendarDate(document.updated)}</time>
            </p>
          </div>
        </header>

        <div className="ma-container grid gap-10 py-12 md:py-16 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="محتويات الصفحة" className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
            <h2 className="m-0 mb-4 text-sm font-bold">المحتويات</h2>
            <ol className="m-0 flex list-none flex-col gap-3 border-s-2 border-line p-0 ps-4">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-fg-muted no-underline hover:text-fg">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-8 text-sm text-fg-muted">
              اقرأ أيضاً:{" "}
              <AppLink href={related.href} className="ma-link">
                {related.label}
              </AppLink>
            </p>
          </nav>

          <div className="border-t border-line-strong">
            {document.sections.map((section, index) => (
              <details
                key={section.id}
                id={section.id}
                open={index === 0}
                className="group scroll-mt-[calc(var(--header-h)+1rem)] border-b border-line"
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 marker:hidden [&::-webkit-details-marker]:hidden">
                  <h2 className="m-0 text-xl font-bold">{section.title}</h2>
                  <Plus
                    aria-hidden="true"
                    className="size-5 shrink-0 text-accent transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                  />
                </summary>
                <div className="flex max-w-[68ch] flex-col gap-4 pb-8 leading-8 text-fg-muted">
                  {section.blocks.map((block, blockIndex) => (
                    <Block key={blockIndex} block={block} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
        <OpenLinkedSection />
      </main>
      <SiteFooter />
    </>
  );
}
