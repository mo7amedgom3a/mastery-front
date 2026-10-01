import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/cn";

import { TrainerApplicationForm } from "./components/trainer-application-form";
import { trainersPageCopy as copy } from "./content/copy";

const pad = (index: number) => String(index + 1).padStart(2, "0");

/** `/trainers`: why trainers join Mastery, how it works, and the application form. */
export function TrainersPage({ specialities }: { specialities: readonly string[] }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <header data-theme="dark" className="bg-surface-alt text-fg">
          <div className="ma-container flex flex-col items-start py-16 md:py-20">
            <span className="ma-tag ma-tag--coral">{copy.kicker}</span>
            <h1 className="t-hero m-0 mt-6">{copy.title}</h1>
            <p className="t-lead m-0 mt-6 max-w-[40rem]">{copy.lead}</p>
            <a href="#apply" className={cn(buttonClass({ variant: "primary", size: "lg" }), "mt-8")}>
              {copy.primaryAction}
            </a>
          </div>
        </header>

        <Section aria-labelledby="why-title">
          <SectionHeader id="why-title" label={copy.why.label} title={copy.why.title} />
          <ul className="m-0 mt-10 grid list-none gap-px border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-3">
            {copy.why.items.map((item, index) => (
              <li key={item.title} className="flex flex-col gap-3 bg-surface p-6">
                <span className="text-sm font-bold text-accent" aria-hidden="true">
                  {pad(index)}
                </span>
                <h3 className="m-0 text-xl font-bold">{item.title}</h3>
                <p className="m-0 text-fg-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section tone="alt" aria-labelledby="join-steps-title">
          <SectionHeader id="join-steps-title" label={copy.steps.label} title={copy.steps.title} />
          <ol className="m-0 mt-10 grid list-none gap-px border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-4">
            {copy.steps.items.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3 bg-surface-alt p-6">
                <span className="text-sm font-bold text-accent" aria-hidden="true">
                  {pad(index)}
                </span>
                <h3 className="m-0 text-xl font-bold">{step.title}</h3>
                <p className="m-0 text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="apply" aria-labelledby="apply-title" className="scroll-mt-20">
          <div className="mx-auto max-w-[56rem]">
            <SectionHeader id="apply-title" label={copy.form.label} title={copy.form.title} lead={copy.form.lead} />
            <div className="mt-10 border border-line-strong bg-surface-alt p-5 sm:p-8">
              <TrainerApplicationForm specialities={specialities} />
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
