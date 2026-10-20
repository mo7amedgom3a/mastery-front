import { Markdown } from "@/components/content/markdown";
import { FaqSection } from "@/features/landing/sections/faq-section";
import type { SectionNavItem } from "@/features/product-detail/components/section-nav";

import { detailCopy } from "../content/copy";
import type { LiveTrainingDetailVM } from "../model/types";
import {
  Block,
  CertificatesBand,
  Checklist,
  LevelCards,
  MethodList,
  OutcomeCards,
  TrainerCard,
  TrainingColumns,
} from "../sections/detail-sections";
import { sectionElements, type LiveElement, type LiveSection } from "./parse-live-readme";

/** Sections drawn as full-width bands under the main column, like the structured page. */
const BAND_KINDS = new Set<LiveElement["kind"]>(["certificates", "features", "faq"]);

export const isBandSection = (section: LiveSection) => {
  const first = sectionElements(section)[0];
  return first !== undefined && BAND_KINDS.has(first.kind);
};

/** Section nav: the page's usual short labels for the known anchors, else the section's own heading. */
export function liveReadmeNav(sections: LiveSection[]): SectionNavItem[] {
  const labels: Record<string, string> = detailCopy.nav;
  return sections
    .filter((section) => section.title)
    .map((section) => ({ id: section.id, label: labels[section.id] ?? section.title }));
}

function ElementView({ element, training }: { element: LiveElement; training: LiveTrainingDetailVM }) {
  switch (element.kind) {
    case "outcomes":
    case "certificates":
    case "features":
      return <OutcomeCards items={element.items.map((item) => ({ label: item.title, text: item.text }))} />;
    case "faq":
      return <MethodList items={element.items.map((item) => ({ label: item.title, text: item.text }))} />;
    case "levels":
      return <LevelCards items={element.items} />;
    case "training":
      return <TrainingColumns groups={element.groups} />;
    case "checklist":
      return <Checklist items={element.items} />;
    case "method":
      return <MethodList items={element.items} />;
    case "trainer":
      return <TrainerCard training={training} bio={element} />;
  }
}

/** One main-column section: its prose and card elements in the order the README gives them. */
function MainSection({ section, training }: { section: LiveSection; training: LiveTrainingDetailVM }) {
  const prose = sectionElements(section).length === 0;
  return (
    <Block id={section.id} title={section.title}>
      <div className="flex flex-col gap-6">
        {section.segments.map((segment, index) =>
          segment.kind === "markdown" ? (
            <Markdown
              key={index}
              source={segment.text}
              className={prose ? "max-w-none text-lg leading-9 text-fg-muted" : "max-w-none text-fg-muted"}
            />
          ) : (
            <ElementView key={index} element={segment.element} training={training} />
          ),
        )}
      </div>
    </Block>
  );
}

/** A band section: certificates (+ features) or the FAQ, with any prose under its header. */
function BandSection({ section }: { section: LiveSection }) {
  const elements = sectionElements(section);
  const prose = section.segments.flatMap((segment) => (segment.kind === "markdown" ? [segment.text] : []));
  const faq = elements.find((element) => element.kind === "faq");
  if (faq && faq.kind === "faq") {
    return (
      <FaqSection
        id={section.id}
        title={section.title || detailCopy.faqTitle}
        faqs={faq.items.map((item) => ({ question: item.title, answer: item.text }))}
      />
    );
  }
  const certificates = elements.find((element) => element.kind === "certificates");
  const features = elements.find((element) => element.kind === "features");
  return (
    <CertificatesBand
      id={section.id}
      title={section.title || detailCopy.certificatesTitle}
      certificates={certificates?.kind === "certificates" ? certificates.items : []}
      features={features?.kind === "features" ? features.items.map((item) => ({ label: item.title, text: item.text })) : []}
      featuresTitle={(features?.kind === "features" && features.title) || detailCopy.featuresTitle}
    >
      {prose.length > 0 ? <Markdown source={prose.join("\n\n")} className="text-fg-muted" /> : null}
    </CertificatesBand>
  );
}

export function LiveReadmeMain({ sections, training }: { sections: LiveSection[]; training: LiveTrainingDetailVM }) {
  return sections
    .filter((section) => !isBandSection(section))
    .map((section) => <MainSection key={section.id} section={section} training={training} />);
}

export function LiveReadmeBands({ sections }: { sections: LiveSection[] }) {
  return sections.filter(isBandSection).map((section) => <BandSection key={section.id} section={section} />);
}
