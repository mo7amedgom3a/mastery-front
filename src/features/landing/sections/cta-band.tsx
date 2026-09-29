import { ButtonLink } from "@/components/ui/button";

import { ctaBandCopy } from "../content/copy";

/** Kit closing CTA band: a coral field with the on-colour button. */
export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="bg-coral text-ink">
      <div className="ma-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-end md:justify-between md:py-24">
        <div className="flex flex-col gap-3">
          <h2 id="cta-title" className="t-section m-0">
            {ctaBandCopy.title}
          </h2>
          <p className="m-0 text-lg">{ctaBandCopy.lead}</p>
        </div>
        <ButtonLink href={ctaBandCopy.action.href} variant="on-color" size="lg">
          {ctaBandCopy.action.label}
        </ButtonLink>
      </div>
    </section>
  );
}
