import { UserRound } from "lucide-react";

import type { TextBlock } from "@/lib/format";

import { TextBlocks } from "../components/text-blocks";
import type { InfoSectionVM } from "../model/types";

/** Audience lists read best as one row per group of learners. */
function AudienceList({ blocks }: { blocks: readonly TextBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) =>
        block.type === "p" ? (
          <p key={index} className="m-0 max-w-[68ch] leading-8">
            {block.text}
          </p>
        ) : (
          <ul key={index} className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start gap-3 rounded-panel border border-line p-4 leading-7">
                <UserRound aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

/** The product's own info blocks (intro, goals, audience…), in the order the CMS lists them. */
export function AboutSection({ sections, title }: { sections: readonly InfoSectionVM[]; title: string }) {
  if (sections.length === 0) {
    return null;
  }
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
      <h2 id="about-title" className="sr-only">
        {title}
      </h2>
      <div className="flex flex-col gap-12">
        {sections.map((section, index) => (
          <div key={`${section.heading}-${index}`} className="flex flex-col gap-5">
            <h3 className="m-0 text-2xl font-bold">{section.heading}</h3>
            {section.variant === "audience" ? (
              <AudienceList blocks={section.blocks} />
            ) : (
              <TextBlocks blocks={section.blocks} listStyle={section.variant === "goals" ? "check" : "default"} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
