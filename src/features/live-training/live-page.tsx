import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

import { LiveTrainingCard } from "./components/live-training-card";
import { livePageCopy } from "./content/copy";
import type { LiveTrainingVM } from "./model/types";

/** `/live`: every open live training, soonest first. */
export function LivePage({ trainings }: { trainings: LiveTrainingVM[] }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <header data-theme="dark" className="bg-surface-alt text-fg">
          <div className="ma-container flex flex-col items-start py-16 md:py-20">
            <span className="ma-tag ma-tag--coral">{livePageCopy.kicker}</span>
            <h1 className="t-hero m-0 mt-6">{livePageCopy.title}</h1>
            <p className="t-lead m-0 mt-6 max-w-[40rem]">{livePageCopy.lead}</p>
          </div>
        </header>

        <Section aria-label={livePageCopy.title}>
          {trainings.length > 0 ? (
            <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2">
              {trainings.map((training, index) => (
                <li key={training.id}>
                  <LiveTrainingCard training={training} priority={index === 0} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-4 border border-line p-8">
              <h2 className="m-0 text-xl font-bold">{livePageCopy.empty.title}</h2>
              <p className="m-0 text-fg-muted">{livePageCopy.empty.lead}</p>
              <ButtonLink href={livePageCopy.empty.action.href} variant="primary">
                {livePageCopy.empty.action.label}
              </ButtonLink>
            </div>
          )}
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
