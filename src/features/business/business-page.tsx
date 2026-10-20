import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { ContactSalesCard } from "@/features/subscriptions/components/contact-sales-card";
import { PlanCard } from "@/features/subscriptions/components/plan-card";
import type { PlanVM } from "@/features/subscriptions/model/plans";

import type { BusinessCatalogVM, CatalogChipVM } from "./api/get-business-catalog";
import { b2bCopy, businessPageCopy as copy, corporatePrograms } from "./content/b2b";

const pad = (index: number) => String(index + 1).padStart(2, "0");

function ChipList({ title, chips }: { title: string; chips: CatalogChipVM[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <h3 className="m-0 text-lg font-bold">{title}</h3>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {chips.map((chip) => (
          <li key={chip.code}>
            <AppLink
              href={chip.href}
              className="ma-btn ma-btn--soft ma-btn--sm min-h-11 gap-2 font-bold no-underline"
            >
              {chip.label}
              <span className="tabular-nums opacity-70" aria-label={`${chip.count} برنامج`}>
                {chip.count}
              </span>
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** `/business`: corporate training, the programmes companies need, and the way to request an offer. */
export function BusinessPage({ catalog, plans }: { catalog: BusinessCatalogVM; plans: PlanVM[] }) {
  const categoryHref = new Map(catalog.categories.map((category) => [category.code, category.href]));
  // Teams above the largest self-serve plan talk to the business team instead of paying online.
  const largestTeam = Math.max(0, ...plans.filter((plan) => plan.perSeat).map((plan) => plan.maxSeats));
  const contactFrom = largestTeam > 0 ? largestTeam + 1 : 50;

  return (
    <>
      <SiteHeader brand="business" />
      <main id="main" tabIndex={-1} className="outline-none">
        <header data-theme="dark" className="bg-surface-alt text-fg">
          <div className="ma-container flex flex-col items-start py-16 md:py-20">
            <span className="ma-tag ma-tag--coral">{copy.kicker}</span>
            <h1 className="t-hero m-0 mt-6">{copy.title}</h1>
            <p className="t-lead m-0 mt-6 max-w-[40rem]">{copy.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={routes.businessRequest()} variant="primary" size="lg">
                {copy.primaryAction.label}
              </ButtonLink>
              {/* Smaller teams can subscribe online, priced per employee. */}
              <ButtonLink href={routes.subscriptionsFor("company")} variant="secondary" size="lg">
                اشترك لفريقك الآن
              </ButtonLink>
            </div>
          </div>
        </header>

        <Section aria-labelledby="steps-title">
          <SectionHeader id="steps-title" label={copy.steps.label} title={copy.steps.title} />
          <ol className="m-0 mt-10 grid list-none gap-px overflow-hidden rounded-panel border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-4">
            {copy.steps.items.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3 bg-surface p-6">
                <span className="text-sm font-bold text-accent" aria-hidden="true">
                  {pad(index)}
                </span>
                <h3 className="m-0 text-xl font-bold">{step.title}</h3>
                <p className="m-0 text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section aria-labelledby="plans-title">
          <SectionHeader id="plans-title" label={copy.plans.label} title={copy.plans.title} lead={copy.plans.lead} />
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

        <Section tone="alt" aria-labelledby="programs-title">
          <SectionHeader id="programs-title" label={copy.programs.label} title={copy.programs.title} lead={copy.programs.lead} />
          <ul className="m-0 mt-10 grid list-none gap-px overflow-hidden rounded-panel border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-3">
            {corporatePrograms.map((program) => {
              const href = categoryHref.get(program.category);
              return (
                <li key={program.title} className="flex flex-col gap-3 bg-surface-alt p-6">
                  <h3 className="m-0 text-xl font-bold">{program.title}</h3>
                  <p className="m-0 flex-1 text-fg-muted">{program.body}</p>
                  {href ? (
                    <AppLink href={href} className="ma-link inline-flex items-center gap-1 self-start text-sm font-bold">
                      تصفّح البرامج
                      <ArrowLeft aria-hidden="true" className="size-4" />
                    </AppLink>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>

        {catalog.categories.length > 0 || catalog.tags.length > 0 ? (
          <Section aria-labelledby="catalog-title" deferRender>
            <SectionHeader id="catalog-title" label={copy.catalog.label} title={copy.catalog.title} lead={copy.catalog.lead} />
            <div className="mt-10 flex flex-col gap-10">
              <ChipList title={copy.catalog.categoriesTitle} chips={catalog.categories} />
              <ChipList title={copy.catalog.tagsTitle} chips={catalog.tags} />
            </div>
          </Section>
        ) : null}

        <Section id="request" tone="alt" aria-labelledby="request-title" className="scroll-mt-20">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <SectionHeader id="request-title" label={copy.benefits.label} title={copy.benefits.title} lead={copy.form.lead} />
              <dl className="m-0 mt-10 flex flex-col">
                {b2bCopy.benefits.map((benefit) => (
                  <div key={benefit.title} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
                    <dt className="text-lg font-bold">{benefit.title}</dt>
                    <dd className="m-0 text-fg-muted">{benefit.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col items-start gap-5 self-start rounded-panel border border-line-strong bg-surface p-5 sm:p-8">
              <h3 className="m-0 text-2xl font-bold">{copy.form.title}</h3>
              <p className="m-0 leading-7 text-fg-muted">{copy.form.cta.body}</p>
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {copy.form.cta.points.map((point, index) => (
                  <li key={point} className="flex items-center gap-3">
                    <span aria-hidden="true" className="text-sm font-bold text-accent tabular-nums">
                      {pad(index)}
                    </span>
                    {point}
                  </li>
                ))}
              </ol>
              <ButtonLink href={routes.businessRequest()} variant="primary" size="lg">
                {copy.primaryAction.label}
              </ButtonLink>
            </div>
          </div>
        </Section>

        <FaqSection faqs={copy.faq.items} id="business-faq" title={copy.faq.title} />
      </main>
      <SiteFooter />
    </>
  );
}
