import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

import { B2BLeadForm } from "../components/b2b-lead-form";
import { b2bCopy } from "../content/b2b";

export function BusinessSection() {
  return (
    <Section id="business" aria-labelledby="business-title" deferRender>
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeader id="business-title" label={b2bCopy.label} title={b2bCopy.title} lead={b2bCopy.lead} />
          <dl className="m-0 mt-10 flex flex-col">
            {b2bCopy.benefits.map((benefit) => (
              <div key={benefit.title} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
                <dt className="text-lg font-bold">{benefit.title}</dt>
                <dd className="m-0 text-fg-muted">{benefit.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="self-start border border-line-strong bg-surface-alt p-5 sm:p-8">
          <h3 className="m-0 mb-6 text-2xl font-bold">{b2bCopy.form.title}</h3>
          <B2BLeadForm />
        </div>
      </div>
    </Section>
  );
}
