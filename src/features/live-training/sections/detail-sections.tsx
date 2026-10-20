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
type LabelledText = { label: string; text: string };

/** Two-digit counter, e.g. 1 → "01". */
const counter = (index: number) => String(index + 1).padStart(2, "0");

/** A titled block in the main column; `scroll-mt` keeps it clear of the sticky header and nav. */
export function Block({ id, title, lead, children }: { id: string; title: string; lead?: string; children: ReactNode }) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={title ? titleId : undefined} className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
      {title ? (
        <h2 id={titleId} className="m-0 text-2xl font-bold">
          {title}
        </h2>
      ) : null}
      {lead ? <p className="m-0 mt-3 text-fg-muted">{lead}</p> : null}
      <div className={title || lead ? "mt-6" : undefined}>{children}</div>
    </section>
  );
}

/* ---- Card layouts, shared by the structured `details` and the page README (`readme/`). ---- */

/** Numbered outcome cards, two per row. */
export function OutcomeCards({ items }: { items: LabelledText[] }) {
  if (items.length === 0) return null;
  return (
    <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={`${index}-${item.label}`} className="flex gap-4 rounded-panel border border-line p-5">
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
  );
}

/** Ticked statements on a two-column grid. */
export function Checklist({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="m-0 grid list-none gap-x-6 gap-y-3 p-0 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex items-start gap-3 border-b border-line pb-3">
          <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Sequential levels: each on its own solid brand field (kit: colour in big fields, ink text on it). */
export function LevelCards({ items }: { items: { title: string; label: string; text: string }[] }) {
  if (items.length === 0) return null;
  return (
    <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
      {items.map((level, index) => (
        <li key={`${index}-${level.title}`} className="flex flex-col overflow-hidden rounded-panel border border-line">
          <div className={cn("flex items-end justify-between gap-4 p-5 text-ink", brandBg[brandColorAt(index)])}>
            <span className="text-xl font-bold">
              {counter(index)}. {level.title}
            </span>
            {level.label ? (
              <span dir="ltr" lang="en" className="t-poster text-[2.5rem] leading-none">
                {level.label}
              </span>
            ) : null}
          </div>
          {level.text ? <p className="m-0 p-5 text-[15px] leading-7 text-fg-muted">{level.text}</p> : null}
        </li>
      ))}
    </ol>
  );
}

/** Numbered practice groups in columns, each with its points. */
export function TrainingColumns({ groups }: { groups: { title: string; items: string[] }[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((group, index) => (
        <div key={`${index}-${group.title}`} className="border-t-[3px] border-line-strong pt-4">
          <h3 className="m-0 text-lg font-bold">
            <span className="text-accent tabular-nums">{counter(index)}.</span> {group.title}
          </h3>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[15px] leading-7 text-fg-muted">
            {group.items.map((item, itemIndex) => (
              <li key={`${itemIndex}-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Label / description rows. */
export function MethodList({ items }: { items: LabelledText[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="m-0 grid gap-0 border-t border-line-strong">
      {items.map((item, index) => (
        <div
          key={`${index}-${item.label}`}
          className="grid gap-1 border-b border-line py-4 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="font-bold">{item.label}</dt>
          <dd className="m-0 text-fg-muted">{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The trainer's portrait (from the training) beside their roles, credentials and bio. */
export function TrainerCard({ training, bio }: { training: LiveTrainingDetailVM; bio: Details["trainer_bio"] }) {
  return (
    <article className="grid gap-6 rounded-panel border border-line p-6 sm:grid-cols-[10rem_minmax(0,1fr)] md:gap-8">
      {training.heroImage ? (
        <div className={cn("relative h-52 self-start overflow-hidden sm:h-56", brandBg[training.color])}>
          <Image src={training.heroImage} alt={training.trainerName} fill sizes="160px" className="object-contain object-bottom" />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h3 className="m-0 text-xl font-bold">{training.trainerName}</h3>
          {bio.roles ? <p className="m-0 mt-1 text-sm text-fg-muted">{bio.roles}</p> : null}
        </div>
        {bio.credentials.length > 0 ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {bio.credentials.map((credential, index) => (
              <li key={`${index}-${credential}`} className="ma-tag ma-tag--soft">
                {credential}
              </li>
            ))}
          </ul>
        ) : null}
        {bio.paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph}`} className="m-0 leading-8 text-fg-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}

/** Full-width band: the certificates beside the training's features. */
export function CertificatesBand({
  id = "certificate",
  title,
  certificates,
  features,
  featuresTitle,
  children,
}: {
  id?: string;
  title: string;
  certificates: { title: string; text: string }[];
  features: LabelledText[];
  featuresTitle: string;
  /** Free text shown under the header. */
  children?: ReactNode;
}) {
  if (certificates.length === 0 && features.length === 0 && !children) return null;
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} tone="alt" deferRender>
      <SectionHeader id={titleId} label={detailCopy.certificatesLabel} title={title} />
      {children ? <div className="mt-8">{children}</div> : null}
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {certificates.length > 0 ? (
          <ul className="m-0 grid list-none gap-4 p-0">
            {certificates.map((certificate, index) => (
              <li
                key={`${index}-${certificate.title}`}
                className="flex items-start gap-4 rounded-panel border border-line bg-surface p-5"
              >
                <BadgeCheck aria-hidden="true" className="mt-1 size-6 shrink-0 text-accent" />
                <span className="flex flex-col gap-2">
                  <strong className="font-bold">{certificate.title}</strong>
                  <span className="text-[15px] leading-7 text-fg-muted">{certificate.text}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {features.length > 0 ? (
          <div>
            <h3 className="m-0 text-xl font-bold">{featuresTitle}</h3>
            <ul className="m-0 mt-6 grid list-none gap-3 p-0 sm:grid-cols-2">
              {features.map((feature, index) => (
                <li
                  key={`${index}-${feature.label}`}
                  className="flex flex-col gap-1 rounded-panel border border-line bg-surface p-4 text-[15px] leading-7"
                >
                  <strong className="font-bold">{feature.label}</strong>
                  <span className="text-fg-muted">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/* ---- Sections of the structured `details` (used when the training has no README). ---- */

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
      <OutcomeCards items={objectives} />
    </Block>
  );
}

export function AudienceBlock({ audience }: { audience: Details["audience"] }) {
  if (audience.items.length === 0) return null;
  return (
    <Block id="audience" title={detailCopy.audienceTitle} lead={audience.lead}>
      <Checklist items={audience.items} />
    </Block>
  );
}

export function AxesBlock({ axes }: { axes: Details["axes"] }) {
  if (axes.items.length === 0) return null;
  return (
    <Block id="curriculum" title={axes.title} lead={axes.lead}>
      <LevelCards items={axes.items.map((axis) => ({ title: axis.title, label: axis.title_en, text: axis.text }))} />
    </Block>
  );
}

export function ActivitiesBlock({ activities }: { activities: Details["activities"] }) {
  if (activities.groups.length === 0) return null;
  return (
    <Block id="activities" title={detailCopy.activitiesTitle} lead={activities.lead}>
      <TrainingColumns groups={activities.groups} />
    </Block>
  );
}

export function MethodBlock({ method }: { method: Details["method"] }) {
  if (method.length === 0) return null;
  return (
    <Block id="method" title={detailCopy.methodTitle}>
      <MethodList items={method} />
    </Block>
  );
}

export function InstructorBlock({ training }: { training: LiveTrainingDetailVM }) {
  return (
    <Block id="instructor" title={detailCopy.instructorTitle}>
      <TrainerCard training={training} bio={training.details.trainer_bio} />
    </Block>
  );
}

export function CertificatesSection({ details }: { details: Details }) {
  return (
    <CertificatesBand
      title={detailCopy.certificatesTitle}
      certificates={details.certificates}
      features={details.features}
      featuresTitle={detailCopy.featuresTitle}
    />
  );
}
