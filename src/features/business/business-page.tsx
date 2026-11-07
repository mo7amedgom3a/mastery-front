import { ArrowLeft, ArrowUpLeft, Check } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/routes";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { ContactSalesCard } from "@/features/subscriptions/components/contact-sales-card";
import { PlanCard } from "@/features/subscriptions/components/plan-card";
import type { PlanVM } from "@/features/subscriptions/model/plans";
import { formatNumber } from "@/lib/format";

import { B2bMotion } from "./components/b2b-motion";
import { FieldGrid } from "./components/field-grid";
import { HeroStoryVideo } from "./components/hero-story-video";
import { LogoMarquee } from "./components/logo-marquee";
import { ServiceCards } from "./components/service-cards";
import { StatBand } from "./components/stat-band";
import { StoriesSpotlight } from "./components/stories-spotlight";
import { businessPageCopy as copy } from "./content/b2b";
import { b2bCta, b2bHero, b2bHeroVideo } from "./content/b2b-landing";
import type { LandingVM } from "./model/b2b-view";

/** `/business`: the corporate entry page. The full platform story lives at `/business/b2b`. */
export function BusinessPage({ data, plans }: { data: LandingVM; plans: PlanVM[] }) {
  const largestTeam = Math.max(0, ...plans.filter((plan) => plan.perSeat).map((plan) => plan.maxSeats));
  const contactFrom = largestTeam > 0 ? largestTeam + 1 : 50;

  return (
    <>
      <SiteHeader brand="business" />
      <main id="main" tabIndex={-1} className="outline-none">
        <B2bMotion>
          <header className="b2b-hero b2b-hero--compact" aria-labelledby="business-hero-title">
            <div className="ma-container b2b-hero__grid">
              <div className="b2b-hero__copy" data-b2b-hero>
                <span className="ma-tag ma-tag--coral">{copy.kicker}</span>
                <h1 id="business-hero-title" className="b2b-hero__title">
                  {copy.title}
                </h1>
                <p className="b2b-hero__lead">{copy.lead}</p>
                <div className="b2b-hero__actions">
                  <ButtonLink href={routes.businessRequest()} size="lg">
                    {copy.primaryAction.label}
                    <ArrowUpLeft aria-hidden="true" className="size-5" />
                  </ButtonLink>
                  <AppLink href={copy.secondaryAction.href} className="ma-btn ma-btn--secondary ma-btn--lg">
                    {copy.secondaryAction.label}
                    <ArrowLeft aria-hidden="true" className="size-5" />
                  </AppLink>
                </div>
                <ul className="b2b-hero__points">
                  {copy.heroPoints.map((point) => (
                    <li key={point}>
                      <Check aria-hidden="true" className="size-4" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <HeroStoryVideo
                youtubeId={b2bHeroVideo.youtubeId}
                title={b2bHeroVideo.title}
                eyebrow={b2bHeroVideo.eyebrow}
                duration={b2bHeroVideo.duration}
                steps={b2bHero.steps}
              />
            </div>
          </header>

          <div className="b2b-stats-band">
            <div className="ma-container">
              <StatBand stats={data.stats.slice(0, 4)} className="b2b-stats--compact" />
            </div>
          </div>

          <Section id="why" aria-labelledby="business-why-title">
            <SectionHeader
              id="business-why-title"
              label={copy.pillars.label}
              index="01"
              title={copy.pillars.title}
            />
            <div className="b2b-pillars" data-b2b-stagger>
              {copy.pillars.items.map((pillar, index) => (
                <article key={pillar.title} className="b2b-pillar">
                  <span className="b2b-pillar__num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="services" tone="alt" aria-labelledby="business-services-title">
            <SectionHeader
              id="business-services-title"
              label={copy.services.label}
              index="02"
              title={copy.services.title}
              lead={copy.services.lead}
              action={
                <AppLink href={routes.businessB2b} className="ma-link inline-flex items-center gap-2 font-bold">
                  {copy.services.action}
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </AppLink>
              }
            />
            <ServiceCards items={copy.services.items} className="b2b-service-grid--flat" />
          </Section>

          <Section id="fields" aria-labelledby="business-fields-title">
            <SectionHeader
              id="business-fields-title"
              label={copy.fields.label}
              index="03"
              title={copy.fields.title}
              lead={copy.fields.lead}
            />
            <FieldGrid fields={data.fields} compact />
          </Section>

          <Section id="plans" aria-labelledby="business-plans-title">
            <SectionHeader
              id="business-plans-title"
              label={copy.plans.label}
              index="04"
              title={copy.plans.title}
              lead={copy.plans.lead}
            />
            <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
              <ContactSalesCard fromSeats={contactFrom} />
            </div>
            <div className="mt-8 flex justify-center">
              <ButtonLink href={routes.subscriptionsFor("company")} variant="secondary">
                {copy.plans.action}
              </ButtonLink>
            </div>
          </Section>

          {data.companies.length > 0 ? (
            <Section id="companies" tone="alt" aria-labelledby="business-companies-title">
              <SectionHeader
                id="business-companies-title"
                label={copy.companies.label}
                index="05"
                title={copy.companies.title}
              />
              <LogoMarquee companies={data.companies} />
              <p className="b2b-companies-note">{copy.companies.note}</p>
            </Section>
          ) : null}

          {data.stories.length > 0 ? (
            <StoriesSpotlight
              stories={data.stories}
              label={copy.stories.label}
              title={copy.stories.title}
              lead={copy.stories.lead}
              note={copy.stories.note}
              watchLabel="شاهد على يوتيوب"
            />
          ) : null}

          <section className="b2b-process" id="process" aria-labelledby="business-process-title">
            <div className="ma-container">
              <div className="b2b-process__head">
                <div>
                  <p className="b2b-process__overline">{copy.process.label} / 07</p>
                  <h2 id="business-process-title" className="b2b-process__title">
                    {copy.process.title}
                  </h2>
                </div>
                <p className="b2b-process__lead">{copy.process.lead}</p>
              </div>
              <ol className="b2b-process__steps b2b-process__steps--four">
                {copy.process.items.map((step, index) => (
                  <li key={step.title} className="b2b-step" data-b2b-step>
                    <span className="b2b-step__dot" aria-hidden="true" />
                    {index < copy.process.items.length - 1 ? (
                      <span className="b2b-step__connector" aria-hidden="true">
                        <span className="b2b-step__fill" data-b2b-step-fill />
                      </span>
                    ) : null}
                    <span className="b2b-step__number">0{index + 1}</span>
                    <h3 className="b2b-step__title">{step.title}</h3>
                    <p className="b2b-step__body">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <FaqSection faqs={copy.faq.items} id="business-faq" title={copy.faq.title} />

          <section className="b2b-cta" id="request" aria-labelledby="business-cta-title">
            <div className="ma-container b2b-cta__grid">
              <div data-b2b-reveal>
                <p className="b2b-process__overline">{b2bCta.label}</p>
                <h2 id="business-cta-title" className="b2b-cta__title">
                  {copy.cta.title}
                </h2>
                <p className="b2b-cta__lead">{copy.cta.lead}</p>
                <div className="b2b-cta__actions">
                  <ButtonLink href={routes.businessRequest()} size="lg">
                    {copy.cta.primary}
                    <ArrowUpLeft aria-hidden="true" className="size-5" />
                  </ButtonLink>
                  <AppLink href={routes.businessB2b} className="ma-btn ma-btn--soft ma-btn--lg">
                    {copy.cta.secondary}
                    <ArrowLeft aria-hidden="true" className="size-5" />
                  </AppLink>
                </div>
              </div>
              <div className="b2b-cta__card" data-b2b-reveal>
                <span className="ma-tag">أرقام المكتبة</span>
                <p className="b2b-cta__card-title">
                  {formatNumber(data.totals.programs || 195)} برنامجاً و{formatNumber(data.fields.length)} مجالاً تدريبياً.
                </p>
                <p>محتوى قابل للتخصيص حسب أدوار فريقك، مع متابعة وتقارير وشهادات إتمام.</p>
                <ButtonLink href={routes.businessB2b} variant="on-color">
                  تعرّف على المنصة
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </ButtonLink>
              </div>
            </div>
          </section>
        </B2bMotion>
      </main>
      <SiteFooter />
    </>
  );
}
