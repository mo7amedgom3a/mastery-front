import { ArrowLeft, ArrowUpLeft, Check, MoveUpLeft, Quote } from "lucide-react";
import Image from "next/image";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/routes";
import type { CatalogChipVM } from "@/features/business/api/get-business-catalog";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { testimonials } from "@/features/landing/content/testimonials";

import { SalesLandingMotion } from "./components/sales-landing-motion";
import { salesLanding as copy } from "./content/sales-landing";

const salesTestimonials = testimonials.filter((item) =>
  ["idris-mohammed", "mohammed-arslan", "abdullatif-adnan"].includes(item.id),
);

/** Sales training for companies. Course links come only from the public catalog's eligible facets. */
export function SalesLandingPage({ salesCategory }: { salesCategory?: CatalogChipVM }) {
  return (
    <>
      <SiteHeader brand="business" />
      <main id="main" tabIndex={-1} className="outline-none">
        <SalesLandingMotion>
          <header className="sales-hero" aria-labelledby="sales-title">
            <div className="ma-container sales-hero__grid">
              <div className="sales-hero__copy">
                <span className="ma-tag ma-tag--coral">{copy.hero.eyebrow}</span>
                <h1 id="sales-title" className="sales-hero__title">{copy.hero.title}</h1>
                <p className="sales-hero__lead">{copy.hero.lead}</p>
                <div className="sales-hero__actions">
                  <ButtonLink href={routes.businessRequest()} size="lg">
                    {copy.hero.action} <ArrowUpLeft aria-hidden="true" className="size-5" />
                  </ButtonLink>
                  <a href="#skills" className="ma-btn ma-btn--soft ma-btn--lg">
                    {copy.hero.secondary} <ArrowLeft aria-hidden="true" className="size-5" />
                  </a>
                </div>
                <p className="sales-hero__note"><Check aria-hidden="true" className="size-4" />{copy.hero.note}</p>
              </div>
              <div className="sales-hero__art" aria-hidden="true">
                <div className="sales-hero__art-head"><span>رحلة البيع</span><span dir="ltr">01 — 05</span></div>
                <div className="sales-hero__art-orbit">
                  <span className="sales-hero__art-core">من المهارة<br />إلى التطبيق</span>
                  <span className="sales-hero__art-point sales-hero__art-point--one">افهم</span>
                  <span className="sales-hero__art-point sales-hero__art-point--two">قدّم</span>
                  <span className="sales-hero__art-point sales-hero__art-point--three">تابع</span>
                </div>
                <div className="sales-hero__art-foot"><span>فريق أوضح في كل خطوة</span><MoveUpLeft className="size-6" /></div>
              </div>
            </div>
            <div className="sales-hero__rail" aria-hidden="true"><span>افهم العميل</span><span>قدّم القيمة</span><span>ابنِ العلاقة</span></div>
          </header>

          <Section id="friction" aria-labelledby="friction-title">
            <SectionHeader id="friction-title" label={copy.friction.label} index="01" title={copy.friction.title} lead={copy.friction.lead} />
            <div className="sales-friction" data-sales-stagger>
              {copy.friction.items.map((item, index) => (
                <article key={item.issue} className="sales-friction__item">
                  <span className="sales-friction__index">0{index + 1}</span>
                  <h3>{item.issue}</h3>
                  <p>{item.response}</p>
                  <ArrowUpLeft aria-hidden="true" className="sales-friction__arrow" />
                </article>
              ))}
            </div>
          </Section>

          <section id="vision" className="sales-vision" aria-labelledby="vision-title">
            <div className="ma-container">
              <p className="sales-overline">{copy.vision.label} / 02</p>
              <h2 id="vision-title" className="sales-vision__title">{copy.vision.title}</h2>
              <p className="sales-vision__lead">{copy.vision.lead}</p>
              <ol className="sales-journey">
                {copy.vision.stages.map((stage, index) => (
                  <li key={stage.number} className="sales-journey__step">
                    <span className="sales-journey__number">{stage.number}</span>
                    <span className="sales-journey__dot" aria-hidden="true" />
                    {index < copy.vision.stages.length - 1 ? (
                      <span className="sales-journey__connector" aria-hidden="true">
                        <span className="sales-journey__fill" />
                      </span>
                    ) : null}
                    <h3>{stage.title}</h3>
                    <p>{stage.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <Section id="skills" aria-labelledby="skills-title" tone="alt">
            <SectionHeader id="skills-title" label={copy.skills.label} index="03" title={copy.skills.title} lead={copy.skills.lead} />
            <ol className="sales-skills" data-sales-stagger>
              {copy.skills.items.map((skill) => (
                <li key={skill.number} className={`sales-skill sales-skill--${skill.color}`}>
                  <span className="sales-skill__number" dir="ltr">{skill.number} / {String(copy.skills.items.length).padStart(2, "0")}</span>
                  <span className="sales-skill__field" aria-hidden="true" />
                  <h3>{skill.title}</h3>
                  <p>{skill.detail}</p>
                  <span className="sales-skill__outcome">{skill.outcome}</span>
                </li>
              ))}
            </ol>
            {salesCategory ? (
              <AppLink href={salesCategory.href} className="ma-link sales-catalog-link">
                استكشف البرامج المنشورة في {salesCategory.label} <ArrowLeft aria-hidden="true" className="size-5" />
              </AppLink>
            ) : null}
          </Section>

          <Section id="approach" aria-labelledby="approach-title">
            <div className="sales-value">
              <div className="sales-value__intro">
                <SectionHeader id="approach-title" label={copy.value.label} index="04" title={copy.value.title} lead={copy.value.lead} />
                <ButtonLink href={routes.businessRequest()} variant="secondary" className="mt-8">ناقش احتياج فريقك <ArrowUpLeft aria-hidden="true" className="size-4" /></ButtonLink>
              </div>
              <ol className="sales-value__steps">
                {copy.value.items.map((item, index) => (
                  <li key={item.number}>
                    <span className="sales-value__number">{item.number}</span>
                    {index < copy.value.items.length - 1 ? (
                      <span className="sales-value__connector" aria-hidden="true">
                        <span className="sales-value__fill" />
                      </span>
                    ) : null}
                    <div><h3>{item.title}</h3><p>{item.detail}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </Section>

          <Section id="tracks" aria-labelledby="tracks-title" tone="alt">
            <SectionHeader id="tracks-title" label={copy.tracks.label} index="05" title={copy.tracks.title} lead="أمثلة لمسارات يمكن بناؤها بعد فهم أهداف الشركة ونطاق التدريب." />
            <div className="sales-tracks" data-sales-stagger>
              {copy.tracks.items.map((track, index) => (
                <article key={track.role} className="sales-track">
                  <div className="sales-track__top"><span>مسار 0{index + 1}</span><ArrowUpLeft aria-hidden="true" className="size-5" /></div>
                  <h3>{track.role}</h3>
                  <p className="sales-track__focus">{track.focus}</p>
                  <div className="sales-track__practice"><span>تطبيق مقترح</span><p>{track.practice}</p></div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="experts" aria-labelledby="sales-experts-title">
            <SectionHeader
              id="sales-experts-title"
              label={copy.experts.label}
              index="06"
              title={copy.experts.title}
              lead={copy.experts.lead}
              action={<AppLink href={routes.experts} className="ma-link sales-experts__all">كل المدربين والخبراء <ArrowLeft aria-hidden="true" className="size-5" /></AppLink>}
            />
            <div className="sales-experts" data-sales-experts>
              {copy.experts.people.map((expert) => (
                <AppLink key={expert.key} href={routes.expert(expert.key, expert.profileName)} className="sales-expert">
                  <span className="sales-expert__photo">
                    <Image
                      src={`/business/sales/experts/${expert.image}`}
                      alt={`صورة ${expert.name}`}
                      fill
                      sizes="(min-width: 1200px) 380px, (min-width: 700px) 33vw, (min-width: 450px) 50vw, 100vw"
                      className="sales-expert__image"
                    />
                  </span>
                  <span className="sales-expert__body">
                    <span className="sales-expert__field">{expert.field}</span>
                    <span className="sales-expert__name">{expert.name}</span>
                    <ArrowUpLeft aria-hidden="true" className="sales-expert__arrow" />
                  </span>
                </AppLink>
              ))}
            </div>
            <p className="sales-experts__note">{copy.experts.note}</p>
          </Section>

          <section id="measurement" className="sales-measure" aria-labelledby="measure-title">
            <div className="ma-container sales-measure__grid">
              <div>
                <p className="sales-overline">{copy.measure.label} / 07</p>
                <h2 id="measure-title">{copy.measure.title}</h2>
                <p className="sales-measure__lead">{copy.measure.lead}</p>
                <p className="sales-measure__note">تختار شركتك مؤشرات البيع المناسبة وتزوّدنا بخط الأساس. لا تُعد نتائج المبيعات وعداً من منصة التدريب.</p>
              </div>
              <ol className="sales-measure__layers">
                {copy.measure.layers.map((layer, index) => (
                  <li key={layer.title} data-sales-reveal>
                    <span>0{index + 1}</span><div><h3>{layer.title}</h3><p>{layer.detail}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <Section id="testimonials" aria-labelledby="sales-testimonials-title" tone="alt">
            <SectionHeader
              id="sales-testimonials-title"
              label={copy.testimonials.label}
              index="08"
              title={copy.testimonials.title}
              lead={copy.testimonials.lead}
            />
            <div className="sales-testimonials" data-sales-stagger>
              {salesTestimonials.map((review) => (
                <figure key={review.id} className="sales-testimonial">
                  <Quote aria-hidden="true" className="sales-testimonial__mark" />
                  <blockquote>«{review.quote}»</blockquote>
                  <figcaption>
                    <span className="sales-testimonial__avatar" aria-hidden="true">{review.name.charAt(0)}</span>
                    <span>{review.name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="sales-testimonials__note">{copy.testimonials.note}</p>
          </Section>

          <Section id="start" aria-labelledby="start-title">
            <SectionHeader id="start-title" label={copy.steps.label} index="09" title={copy.steps.title} />
            <ol className="sales-start" data-sales-stagger>
              {copy.steps.items.map((step, index) => (
                <li key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.detail}</p></li>
              ))}
            </ol>
          </Section>

          <FaqSection faqs={copy.faq} id="sales-faq" title="أسئلة تسبق القرار" tone="alt" />

          <section className="sales-closing" aria-labelledby="closing-title">
            <div className="ma-container sales-closing__inner">
              <div>
                <p className="sales-overline">{copy.closing.label}</p>
                <h2 id="closing-title">{copy.closing.title}</h2>
                <p>{copy.closing.lead}</p>
              </div>
              <ButtonLink href={routes.businessRequest()} variant="on-color" size="lg">
                {copy.hero.action} <ArrowUpLeft aria-hidden="true" className="size-5" />
              </ButtonLink>
            </div>
          </section>
        </SalesLandingMotion>
      </main>
      <SiteFooter />
    </>
  );
}
