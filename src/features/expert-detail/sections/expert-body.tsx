import { Markdown } from "@/components/content/markdown";
import { AppLink } from "@/components/ui/app-link";
import { ContentBlocks } from "@/features/product-detail/components/content-blocks";
import { TextBlocks } from "@/features/product-detail/components/text-blocks";
import type { StudioSectionVM } from "@/features/product-detail/model/studio-content";

import { expertFacts } from "../model/facts";
import type { ExpertDetailData } from "../model/types";
import { ExpertHighlights } from "./expert-highlights";
import { ExpertServices, linkServiceCards, serviceCards, type ExpertServiceGroup } from "./expert-services";

export type ExpertBodyItem = { id: string; label: string };

/** The default body's sections, for the section nav. */
export function defaultBodyNav(data: ExpertDetailData): ExpertBodyItem[] {
  const { expert } = data;
  return [
    expert.readme || expert.bio.length ? { id: "about", label: "نبذة" } : null,
    expert.fields.length || expert.topics.length ? { id: "fields", label: "المجالات" } : null,
    expert.whatTheyDo.length || expert.whoTheyHelp.length ? { id: "highlights", label: "كيف يساعدك" } : null,
    ...serviceGroups(data).map((group) => ({ id: group.id, label: group.title })),
  ].filter((item) => item !== null);
}

/** The built page's sections (each level-2 heading), for the section nav. */
export function pageNav(page: readonly StudioSectionVM[]): ExpertBodyItem[] {
  return page.flatMap((section) => (section.heading ? [{ id: section.id, label: section.heading }] : []));
}

/** Consultations lead: they are the expert's own time, the rest is recorded. */
function serviceGroups(data: ExpertDetailData): ExpertServiceGroup[] {
  const facts = expertFacts(data.expert.counts);
  const countOf = (key: ExpertServiceGroup["id"]) => facts.find((fact) => fact.key === key)?.label ?? "";
  return [
    { id: "consultations" as const, title: "الاستشارات", count: countOf("consultations"), cards: serviceCards(data.consultations) },
    { id: "courses" as const, title: "الدورات", count: countOf("courses"), cards: serviceCards(data.courses) },
    { id: "diplomas" as const, title: "الدبلومات", count: countOf("diplomas"), cards: serviceCards(data.diplomas) },
    { id: "live" as const, title: "البرامج المباشرة", count: countOf("live"), cards: linkServiceCards(data.liveDiplomas) },
    { id: "packages" as const, title: "الباقات", count: countOf("packages"), cards: serviceCards(data.packages) },
    { id: "bundles" as const, title: "الحزم", count: countOf("bundles"), cards: linkServiceCards(data.bundles) },
  ].filter((group) => group.cards.length > 0);
}

/**
 * The body of the expert page, between the section nav and the related experts. With a page built in the expert
 * Studio (`page`), that page is the body: it was pre-filled from the default sections and the admin owns it from
 * then on. Otherwise: about (`readme`, else the legacy bio) → fields and skills → how they help → what they offer.
 * Shared by the page and the Studio preview, which passes the page and README being edited.
 */
export function ExpertBody({
  data,
  page = data.expert.page,
  readme = data.expert.readme,
}: {
  data: ExpertDetailData;
  page?: readonly StudioSectionVM[];
  readme?: string;
}) {
  const { expert } = data;
  if (page.length > 0) {
    return <ContentBlocks sections={page} wide />;
  }
  const groups = serviceGroups(data);
  return (
    <>
      {readme || expert.bio.length ? (
        <section id="about" aria-labelledby="about-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
          <h2 id="about-title" className="m-0 text-2xl font-bold">
            نبذة عن {expert.name}
          </h2>
          {/* Full container width: the bio is the body of this page, not a column beside a card. */}
          <div className="mt-6">
            {readme ? <Markdown source={readme} className="max-w-none" /> : <TextBlocks blocks={expert.bio} className="max-w-none" />}
          </div>
        </section>
      ) : null}
      {expert.fields.length || expert.topics.length ? (
        <section id="fields" aria-labelledby="fields-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
          <h2 id="fields-title" className="m-0 text-2xl font-bold">
            المجالات والمهارات
          </h2>
          {expert.fields.length > 0 ? (
            <ul aria-label="المجالات" className="ma-cluster m-0 mt-6 list-none gap-2 p-0">
              {expert.fields.map((field) => (
                <li key={field.name}>
                  {field.href ? (
                    <AppLink href={field.href} className="ma-tag ma-tag--yellow no-underline">
                      {field.name}
                    </AppLink>
                  ) : (
                    <span className="ma-tag ma-tag--yellow">{field.name}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {expert.topics.length > 0 ? (
            <ul aria-label="المهارات" className="ma-cluster m-0 mt-4 list-none gap-2 p-0">
              {expert.topics.map((topic) => (
                <li key={topic} className="ma-tag ma-tag--soft">
                  {topic}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      <ExpertHighlights name={expert.name} whatTheyDo={expert.whatTheyDo} whoTheyHelp={expert.whoTheyHelp} />
      <ExpertServices groups={groups} />
    </>
  );
}
