import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { FaqSection } from "@/features/landing/sections/faq-section";
import { cn } from "@/lib/cn";

import type { BusinessCatalogVM, CatalogChipVM } from "./api/get-business-catalog";
import { B2BLeadForm } from "./components/b2b-lead-form";
import { TrustedCompanies } from "./components/trusted-companies";
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
              className="inline-flex min-h-11 items-center gap-2 border border-line-strong px-4 text-sm font-bold no-underline hover:border-accent hover:text-accent"
            >
              {chip.label}
              <span className="text-fg-muted" aria-label={`${chip.count} برنامج`}>
                {chip.count}
              </span>
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** `/business`: corporate training, the programmes companies need, and the training request form. */
export function BusinessPage({ catalog }: { catalog: BusinessCatalogVM }) {
  const categoryHref = new Map(catalog.categories.map((category) => [category.code, category.href]));

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <header data-theme="dark" className="bg-surface-alt text-fg">
          <div className="ma-container flex flex-col items-start py-16 md:py-20">
            <span className="ma-tag ma-tag--coral">{copy.kicker}</span>
            <h1 className="t-hero m-0 mt-6">{copy.title}</h1>
            <p className="t-lead m-0 mt-6 max-w-[40rem]">{copy.lead}</p>
            <a href="#request" className={cn(buttonClass({ variant: "primary", size: "lg" }), "mt-8")}>
              {copy.primaryAction.label}
            </a>
          </div>
        </header>

        <TrustedCompanies className="border-t-0" />

        <Section aria-labelledby="steps-title">
          <SectionHeader id="steps-title" label={copy.steps.label} title={copy.steps.title} />
          <ol className="m-0 mt-10 grid list-none gap-px border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-4">
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

        <Section tone="alt" aria-labelledby="programs-title">
          <SectionHeader id="programs-title" label={copy.programs.label} title={copy.programs.title} lead={copy.programs.lead} />
          <ul className="m-0 mt-10 grid list-none gap-px border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="self-start border border-line-strong bg-surface p-5 sm:p-8">
              <h3 className="m-0 mb-6 text-2xl font-bold">{copy.form.title}</h3>
              <B2BLeadForm />
            </div>
          </div>
        </Section>

        <FaqSection faqs={copy.faq.items} id="business-faq" title={copy.faq.title} />
      </main>
      <SiteFooter />
    </>
  );
}
