import { AnimatedCheck } from "@/components/motion/animated-check";
import { AutoplayTabs } from "@/components/motion/autoplay-tabs";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

import { offerings, type Offering } from "../content/offerings";

function OfferingPanel({ offering, position }: { offering: Offering; position: number }) {
  return (
    <div className="grid gap-10 md:min-h-[min(22rem,45svh)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12">
      <div className="flex flex-col items-start gap-6">
        <span data-tab-animate className="text-sm text-fg-muted tabular-nums" dir="ltr">
          {String(position).padStart(2, "0")} / {String(offerings.length).padStart(2, "0")}
        </span>
        <h3 data-tab-animate className="m-0 text-2xl leading-snug font-bold md:text-4xl md:leading-tight">
          {offering.title}
        </h3>
        <p data-tab-animate className="t-lead m-0">
          {offering.body}
        </p>
        <div data-tab-animate className="mt-2">
          <ButtonLink href={offering.cta.href} variant="secondary">
            {offering.cta.label}
          </ButtonLink>
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col self-center border-t border-line p-0">
        {offering.points.map((point, index) => (
          <li key={point} data-tab-animate className="flex items-center gap-4 border-b border-line py-5 text-lg">
            <AnimatedCheck index={index} />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Every way to learn at Mastery, as timed step tabs. All panels are in the HTML for crawlers. */
export function OfferingsSection() {
  return (
    <Section id="offerings" aria-labelledby="offerings-title" deferRender>
      <SectionHeader
        id="offerings-title"
        label="ماذا نقدّم"
        title="كل طرق التعلّم في منصة واحدة"
        lead="دورات ودبلومات وبث مباشر وباقات واستشارات فردية — وبرامج تدريب مخصّصة للشركات."
      />
      <AutoplayTabs
        idPrefix="offerings"
        label="خدمات أكاديمية ماستري"
        className="mt-14 short:mt-8"
        tabs={offerings.map(({ id, label }) => ({ id, label }))}
        panels={offerings.map((offering, index) => (
          <OfferingPanel key={offering.id} offering={offering} position={index + 1} />
        ))}
      />
    </Section>
  );
}
