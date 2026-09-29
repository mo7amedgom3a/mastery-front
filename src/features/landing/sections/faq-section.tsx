import { Plus } from "lucide-react";

import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

import type { FaqVM } from "../model/types";

/** Native disclosure list: no JS, answers are always in the HTML. */
export function FaqSection({
  faqs,
  id = "faq",
  title = "أسئلة يطرحها المتعلّمون كثيراً",
  tone,
}: {
  faqs: readonly FaqVM[];
  id?: string;
  title?: string;
  tone?: "base" | "alt";
}) {
  if (faqs.length === 0) {
    return null;
  }
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} tone={tone} deferRender>
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16">
        <SectionHeader id={titleId} label="الأسئلة الشائعة" title={title} />
        <div className="border-t border-line-strong">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-bold marker:hidden [&::-webkit-details-marker]:hidden">
                <h3 className="m-0 text-lg font-bold">{faq.question}</h3>
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 text-accent transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <p className="m-0 max-w-[60ch] pb-6 text-fg-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
