import { ArrowLeft, ArrowUpLeft, Check } from "lucide-react";
import type { CSSProperties } from "react";

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
import { QuoteCarousel } from "./components/quote-carousel";
import { ServicesStack } from "./components/services-stack";
import { StatBand } from "./components/stat-band";
import { StoriesSpotlight } from "./components/stories-spotlight";
import {
  b2bCompanies,
  b2bCta,
  b2bFaq,
  b2bFriction,
  b2bHero,
  b2bHeroVideo,
  b2bLibrary,
  b2bPlans,
  b2bProcess,
  b2bServices,
  b2bStories,
  b2bTestimonials,
  b2bValue,
} from "./content/b2b-landing";
import type { LandingVM } from "./model/b2b-view";

/** `/business/b2b`: the full corporate platform story — every service, the library, proof and process. */
export function B2bLandingPage({ data, plans }: { data: LandingVM; plans: PlanVM[] }) {
  const largestTeam = Math.max(0, ...plans.filter((plan) => plan.perSeat).map((plan) => plan.maxSeats));
  const contactFrom = largestTeam > 0 ? largestTeam + 1 : 50;

  return (
    <>
      <SiteHeader brand="business" />
      <main id="main" tabIndex={-1} className="outline-none">
        <B2bMotion>
          <header className="b2b-hero" aria-labelledby="b2b-hero-title">
            <div className="ma-container b2b-hero__grid">
              <div className="b2b-hero__copy" data-b2b-hero>
                <span className="ma-tag ma-tag--coral">{b2bHero.eyebrow}</span>
                <h1 id="b2b-hero-title" className="b2b-hero__title">
                  {b2bHero.title}
                </h1>
                <p className="b2b-hero__lead">{b2bHero.lead}</p>
                <div className="b2b-hero__actions">
                  <ButtonLink href={routes.businessRequest()} size="lg">
                    {b2bHero.primary}
                    <ArrowUpLeft aria-hidden="true" className="size-5" />
                  </ButtonLink>
                  <a href="#services" className="ma-btn ma-btn--soft ma-btn--lg">
                    {b2bHero.secondary}
                    <ArrowLeft aria-hidden="true" className="size-5" />
                  </a>
                </div>
                <p className="b2b-hero__note">
                  <Check aria-hidden="true" className="size-4" />
                  {b2bHero.note}
                </p>
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
              <StatBand stats={data.stats} />
            </div>
          </div>

          <Section id="friction" aria-labelledby="b2b-friction-title">
            <SectionHeader
              id="b2b-friction-title"
              label={b2bFriction.label}
              index="01"
              title={b2bFriction.title}
              lead={b2bFriction.lead}
            />
            <div className="b2b-friction" data-b2b-stagger>
              {b2bFriction.items.map((item, index) => (
                <article key={item.issue} className="b2b-friction__item">
                  <span className="b2b-friction__index" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <h3>{item.issue}</h3>
                  <p>{item.response}</p>
                  <ArrowUpLeft aria-hidden="true" className="b2b-friction__arrow" />
                </article>
              ))}
            </div>
          </Section>

          <section className="b2b-value" id="value" aria-labelledby="b2b-value-title">
            <div className="ma-container">
              <SectionHeader
                id="b2b-value-title"
                label={b2bValue.label}
                index="02"
                title={b2bValue.title}
                lead={b2bValue.lead}
              />
              {b2bValue.blocks.map((block) => (
                <div
                  key={block.number}
                  className="b2b-value__block"
                  data-b2b-value
                  style={{ "--block-accent": `var(--${block.color})` } as CSSProperties}
                >
                  <div className="b2b-value__copy" data-b2b-reveal>
                    <span className="b2b-value__overline">{block.number} — قيمة</span>
                    <h3 className="b2b-value__title">{block.title}</h3>
                    <p className="b2b-value__lead">{block.detail}</p>
                    <ul className="b2b-value__points">
                      {block.points.map((point) => (
                        <li key={point}>
                          <Check aria-hidden="true" className="size-4" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="b2b-value__art" data-b2b-value-art aria-hidden="true">
                    <div className="b2b-value__art-ring" />
                    <div className="b2b-value__art-inner">
                      <span className="b2b-value__art-index">{block.number}</span>
                      <span className="b2b-value__art-label">{block.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Section id="services" aria-labelledby="b2b-services-title">
            <SectionHeader
              id="b2b-services-title"
              label={b2bServices.label}
              index="03"
              title={b2bServices.title}
              lead={b2bServices.lead}
            />
            <ServicesStack pillars={b2bServices.pillars} />
          </Section>

          <Section id="library" tone="alt" aria-labelledby="b2b-library-title">
            <SectionHeader
              id="b2b-library-title"
              label={b2bLibrary.label}
              index="04"
              title={b2bLibrary.title}
              lead={b2bLibrary.lead}
            />
            {data.totals.programs > 0 || data.totals.lessons > 0 ? (
              <p className="b2b-library-totals">
                {data.totals.programs > 0 ? (
                  <span>
                    <b>{formatNumber(data.totals.programs)}</b> برنامجاً
                  </span>
                ) : null}
                <span>
                  <b>{formatNumber(data.fields.length)}</b> مجالاً تدريبياً
                </span>
                {data.totals.lessons > 0 ? (
                  <span>
                    <b>{formatNumber(data.totals.lessons)}</b> درساً
                  </span>
                ) : null}
              </p>
            ) : null}
            <FieldGrid fields={data.fields} />
            <p className="b2b-fields-note">{b2bLibrary.note}</p>
          </Section>

          {data.stories.length > 0 ? (
            <StoriesSpotlight
              stories={data.stories}
              label={b2bStories.label}
              title={b2bStories.title}
              lead={b2bStories.lead}
              note={b2bStories.note}
              watchLabel={b2bStories.watch}
            />
          ) : null}

          {data.companies.length > 0 ? (
            <Section id="companies" tone="alt" aria-labelledby="b2b-companies-title">
              <SectionHeader
                id="b2b-companies-title"
                label={b2bCompanies.label}
                index="06"
                title={b2bCompanies.title}
                lead={b2bCompanies.lead}
              />
              <LogoMarquee companies={data.companies} />
              <p className="b2b-companies-note">{b2bCompanies.note}</p>
            </Section>
          ) : null}

          <Section id="testimonials" aria-labelledby="b2b-testimonials-title">
            <SectionHeader
              id="b2b-testimonials-title"
              label={b2bTestimonials.label}
              index="07"
              title={b2bTestimonials.title}
              lead={b2bTestimonials.lead}
            />
            <QuoteCarousel quotes={b2bTestimonials.items} label={b2bTestimonials.label} />
            <p className="b2b-section-note">{b2bTestimonials.note}</p>
          </Section>

          <Section id="plans" tone="alt" aria-labelledby="b2b-plans-title">
            <SectionHeader
              id="b2b-plans-title"
              label={b2bPlans.label}
              index="08"
              title={b2bPlans.title}
              lead={b2bPlans.lead}
            />
            <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
              <ContactSalesCard fromSeats={contactFrom} />
            </div>
            <div className="mt-8 flex justify-center">
              <ButtonLink href={routes.subscriptionsFor("company")} variant="secondary">
                {b2bPlans.action}
              </ButtonLink>
            </div>
          </Section>

          <section className="b2b-process" id="process" aria-labelledby="b2b-process-title">
            <div className="ma-container">
              <div className="b2b-process__head">
                <div>
                  <p className="b2b-process__overline">{b2bProcess.label} / 09</p>
                  <h2 id="b2b-process-title" className="b2b-process__title">
                    {b2bProcess.title}
                  </h2>
                </div>
                <p className="b2b-process__lead">{b2bProcess.lead}</p>
              </div>
              <ol className="b2b-process__steps">
                {b2bProcess.items.map((step, index) => (
                  <li key={step.title} className="b2b-step" data-b2b-step>
                    <span className="b2b-step__dot" aria-hidden="true" />
                    {index < b2bProcess.items.length - 1 ? (
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

          <FaqSection faqs={b2bFaq.items} id="b2b-faq" title={b2bFaq.title} />

          <section className="b2b-cta" id="request" aria-labelledby="b2b-cta-title">
            <div className="ma-container b2b-cta__grid">
              <div data-b2b-reveal>
                <p className="b2b-process__overline">{b2bCta.label}</p>
                <h2 id="b2b-cta-title" className="b2b-cta__title">
                  {b2bCta.title}
                </h2>
                <p className="b2b-cta__lead">{b2bCta.lead}</p>
                <ul className="b2b-cta__points">
                  {b2bCta.points.map((point) => (
                    <li key={point}>
                      <Check aria-hidden="true" className="size-4" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="b2b-cta__actions">
                  <ButtonLink href={routes.businessRequest()} size="lg">
                    {b2bCta.primary}
                    <ArrowUpLeft aria-hidden="true" className="size-5" />
                  </ButtonLink>
                  <AppLink href={routes.subscriptionsFor("company")} className="ma-btn ma-btn--soft ma-btn--lg">
                    {b2bCta.secondary}
                    <ArrowLeft aria-hidden="true" className="size-5" />
                  </AppLink>
                </div>
              </div>
              <div className="b2b-cta__card" data-b2b-reveal>
                <span className="ma-tag">عرض تدريبي</span>
                <p className="b2b-cta__card-title">أخبرنا عن فريقك، ونبني العرض حول احتياجك.</p>
                <p>
                  نراجع معك الأهداف والأدوار والفجوات، ثم نقترح المسار والجدول وطريقة المتابعة قبل أي التزام.
                </p>
                <ButtonLink href={routes.businessRequest()} variant="on-color">
                  ابدأ الآن
                  <ArrowUpLeft aria-hidden="true" className="size-4" />
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
