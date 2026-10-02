import { BadgeCheck } from "lucide-react";

import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";

import { benefits, certificateCopy } from "../content/copy";

/** Learning benefits and certification, shared by every course and diploma. */
export function CertificateSection() {
  return (
    <Section id="certificate" aria-labelledby="certificate-title" tone="alt" deferRender>
      <SectionHeader
        id="certificate-title"
        label="الشهادات"
        title={certificateCopy.title}
        lead={certificateCopy.lead}
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ul className="m-0 grid list-none gap-4 p-0">
          {certificateCopy.points.map((point) => (
            <li key={point} className="flex items-start gap-3 leading-8">
              <BadgeCheck aria-hidden="true" className="mt-1.5 size-5 shrink-0 text-accent" />
              {point}
            </li>
          ))}
        </ul>
        <div>
          <h3 className="m-0 text-xl font-bold">تمتّع بتجربة تعليمية فريدة</h3>
          <ul className="m-0 mt-6 grid list-none gap-3 p-0 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 rounded-panel border border-line bg-surface p-4 text-[15px] leading-7">
                <Icon aria-hidden="true" className="mt-1 size-5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
