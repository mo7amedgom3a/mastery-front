import { BadgeCheck, Check } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/cn";

import { detailCopy } from "../content/copy";
import type { LiveTrainingDetailVM } from "../model/types";

type Details = LiveTrainingDetailVM["details"];

/** Two-digit counter, e.g. 1 → "01". */
const counter = (index: number) => String(index + 1).padStart(2, "0");

/** A titled block in the main column; `scroll-mt` keeps it clear of the sticky header and nav. */
function Block({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
      <h2 id={titleId} className="m-0 text-2xl font-bold">
        {title}
      </h2>
      {lead ? <p className="m-0 mt-3 text-fg-muted">{lead}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function AboutBlock({ about, summary }: { about: Details["about"]; summary: string | null }) {
  return (
    <Block id="about" title={about.title}>
      <div className="flex flex-col gap-4 text-lg leading-9">
        {summary ? <p className="m-0 font-medium">{summary}</p> : null}
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph} className="m-0 text-fg-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </Block>
  );
}

export function ObjectivesBlock({ objectives }: { objectives: Details["objectives"] }) {
  if (objectives.length === 0) return null;
  return (
    <Block id="objectives" title={detailCopy.objectivesTitle}>
      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {objectives.map((item, index) => (
          <li key={item.label} className="flex gap-4 rounded-panel border border-line p-5">
            <span aria-hidden="true" className="text-2xl font-bold text-accent tabular-nums">
              {counter(index)}
            </span>
            <span className="flex flex-col gap-1">
              <strong className="font-bold">{item.label}</strong>
              <span className="text-[15px] leading-7 text-fg-muted">{item.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </Block>
  );
}

export function AudienceBlock({ audience }: { audience: Details["audience"] }) {
  if (audience.items.length === 0) return null;
  return (
    <Block id="audience" title={detailCopy.audienceTitle} lead={audience.lead}>
      <ul className="m-0 grid list-none gap-x-6 gap-y-3 p-0 sm:grid-cols-2">
        {audience.items.map((item) => (
          <li key={item} className="flex items-start gap-3 border-b border-line pb-3">
            <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
            {item}
          </li>
        ))}
      </ul>
    </Block>
  );
}

/** The four axes: each on its own solid brand field (kit: colour in big fields, ink text on it). */
export function AxesBlock({ axes }: { axes: Details["axes"] }) {
  if (axes.items.length === 0) return null;
  return (
    <Block id="curriculum" title={axes.title} lead={axes.lead}>
      <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
        {axes.items.map((axis, index) => (
          <li key={axis.title_en} className="flex flex-col overflow-hidden rounded-panel border border-line">
            <div className={cn("flex items-end justify-between gap-4 p-5 text-ink", brandBg[brandColorAt(index)])}>
              <span className="text-xl font-bold">
                {counter(index)}. {axis.title}
              </span>
              <span dir="ltr" lang="en" className="t-poster text-[2.5rem] leading-none">
                {axis.title_en}
              </span>
            </div>
            <p className="m-0 p-5 text-[15px] leading-7 text-fg-muted">{axis.text}</p>
          </li>
        ))}
      </ol>
    </Block>
  );
}

export function ActivitiesBlock({ activities }: { activities: Details["activities"] }) {
  if (activities.groups.length === 0) return null;
  return (
    <Block id="activities" title={detailCopy.activitiesTitle} lead={activities.lead}>
      <div className="grid gap-4 md:grid-cols-3">
        {activities.groups.map((group, index) => (
          <div key={group.title} className="border-t-[3px] border-line-strong pt-4">
            <h3 className="m-0 text-lg font-bold">
              <span className="text-accent tabular-nums">{counter(index)}.</span> {group.title}
            </h3>
            <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[15px] leading-7 text-fg-muted">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Block>
  );
}

export function MethodBlock({ method }: { method: Details["method"] }) {
  if (method.length === 0) return null;
  return (
    <Block id="method" title={detailCopy.methodTitle}>
      <dl className="m-0 grid gap-0 border-t border-line-strong">
        {method.map((item) => (
          <div key={item.label} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-6">
            <dt className="font-bold">{item.label}</dt>
            <dd className="m-0 text-fg-muted">{item.text}</dd>
          </div>
        ))}
      </dl>
    </Block>
  );
}

export function InstructorBlock({ training }: { training: LiveTrainingDetailVM }) {
  const bio = training.details.trainer_bio;
  return (
    <Block id="instructor" title={detailCopy.instructorTitle}>
      <article className="grid gap-6 rounded-panel border border-line p-6 sm:grid-cols-[10rem_minmax(0,1fr)] md:gap-8">
        {training.heroImage ? (
          <div className={cn("relative h-52 self-start overflow-hidden sm:h-56", brandBg[training.color])}>
            <Image
              src={training.heroImage}
              alt={training.trainerName}
              fill
              sizes="160px"
              className="object-contain object-bottom"
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <h3 className="m-0 text-xl font-bold">{training.trainerName}</h3>
            <p className="m-0 mt-1 text-sm text-fg-muted">{bio.roles}</p>
          </div>
          {bio.credentials.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {bio.credentials.map((credential) => (
                <li key={credential} className="ma-tag ma-tag--soft">
                  {credential}
                </li>
              ))}
            </ul>
          ) : null}
          {bio.paragraphs.map((paragraph) => (
            <p key={paragraph} className="m-0 leading-8 text-fg-muted">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </Block>
  );
}

/** Full-width band: the training's features beside its two certificates. */
export function CertificatesSection({ details }: { details: Details }) {
  if (details.certificates.length === 0 && details.features.length === 0) return null;
  return (
    <Section id="certificate" aria-labelledby="certificate-title" tone="alt" deferRender>
      <SectionHeader id="certificate-title" label={detailCopy.certificatesLabel} title={detailCopy.certificatesTitle} />
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ul className="m-0 grid list-none gap-4 p-0">
          {details.certificates.map((certificate) => (
            <li key={certificate.title} className="flex items-start gap-4 rounded-panel border border-line bg-surface p-5">
              <BadgeCheck aria-hidden="true" className="mt-1 size-6 shrink-0 text-accent" />
              <span className="flex flex-col gap-2">
                <strong className="font-bold">{certificate.title}</strong>
                <span className="text-[15px] leading-7 text-fg-muted">{certificate.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div>
          <h3 className="m-0 text-xl font-bold">{detailCopy.featuresTitle}</h3>
          <ul className="m-0 mt-6 grid list-none gap-3 p-0 sm:grid-cols-2">
            {details.features.map((feature) => (
              <li key={feature.label} className="flex flex-col gap-1 rounded-panel border border-line bg-surface p-4 text-[15px] leading-7">
                <strong className="font-bold">{feature.label}</strong>
                <span className="text-fg-muted">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
