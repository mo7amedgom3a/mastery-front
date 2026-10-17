"use client";

import { Markdown } from "@/components/content/markdown";
import { cn } from "@/lib/cn";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { formatDateTime, formatDurationFromSeconds, formatPrice } from "@/lib/format";

import { ContentBlocks } from "./content-blocks";
import { StudioBanner } from "./studio-banner";
import { studioSections, type StudioDocument } from "../model/studio-content";

export type PreviewKind = "course" | "diploma" | "package" | "bundle" | "consultation" | "live_diploma";

const KIND_LABEL: Record<PreviewKind, string> = {
  course: "دورة",
  diploma: "دبلوم",
  package: "باقة",
  bundle: "حزمة",
  consultation: "استشارة",
  live_diploma: "دبلوم مباشر",
};

type Base = Record<string, unknown>;

const asRecord = (value: unknown): Base => (value && typeof value === "object" ? (value as Base) : {});
const str = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);
const num = (value: unknown): number | null => (typeof value === "number" ? value : value != null && value !== "" ? Number(value) : null);

/**
 * Storefront-style preview of a product page built in the Course Studio for a non-course kind (package, bundle,
 * consultation, live diploma). Renders the authored page (banner, intro video, content blocks) over a product
 * hero and the kind's essentials (members, included courses, cohorts) so admin edits show up live.
 */
export function StudioPreviewKind({
  kind,
  base,
  document,
  readme,
}: {
  kind: PreviewKind;
  base: unknown;
  document: StudioDocument;
  readme?: string | null;
}) {
  const b = asRecord(base);
  const collection = asRecord(b.collection);

  const title = str(document.meta?.title) || str(b.title) || str(collection.name) || `معاينة ${KIND_LABEL[kind]}`;
  const summary = str(document.meta?.summary) || str(b.short_description) || str(b.description) || str(collection.description);
  const image =
    str(document.meta?.cover?.url) ||
    str(b.image_url) ||
    str(b.image) ||
    str(collection.image) ||
    null;
  const price = num(b.amount) ?? num(b.price_usd) ?? num(collection.price);
  const currency = str(b.currency_code) || "USD";

  const sections = studioSections(document.blocks ?? []);
  const banner = document.meta?.banner?.url
    ? { url: document.meta.banner.url, alt: document.meta.banner.alt ?? "", headline: document.meta.banner.headline ?? "" }
    : null;

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <section className="border-b border-line bg-surface-alt">
          <div className="ma-container grid gap-8 py-12 md:py-16 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="flex flex-col gap-4">
              <span className="w-fit rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                {KIND_LABEL[kind]}
              </span>
              <h1 className="m-0 text-3xl font-bold text-fg md:text-4xl">{title}</h1>
              {summary ? <p className="max-w-[60ch] text-base leading-relaxed text-fg-muted">{summary}</p> : null}
              {price != null ? (
                <p className="text-lg font-semibold text-fg">
                  {formatPrice(price)}
                  {currency !== "USD" ? ` ${currency}` : ""}
                </p>
              ) : null}
            </div>
            {image ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-panel border border-line bg-surface">
                <img src={image} alt="" className="size-full object-cover" />
              </div>
            ) : null}
          </div>
        </section>

        <div className="ma-container flex flex-col gap-16 py-12 md:py-16">
          {banner ? <StudioBanner banner={banner} /> : null}

          {kind === "bundle" ? <BundleMembers base={b} /> : null}
          {kind === "package" ? <PackageCourses base={b} /> : null}
          {kind === "live_diploma" ? <LiveCohorts base={b} /> : null}

          {readme ? <Markdown source={readme} /> : null}
          {sections.length > 0 ? (
            <ContentBlocks sections={sections} />
          ) : (
            readme ? null : <p className="text-center text-fg-muted">لا يوجد محتوى بعد — اكتب الصفحة من الاستوديو.</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function BundleMembers({ base }: { base: Base }) {
  const members = Array.isArray(base.members) ? (base.members as Base[]) : [];
  if (members.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 text-2xl font-bold text-fg">محتوى الحزمة</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {members.map((member, index) => {
          const memberType = str(member.product_type);
          return (
            <li key={String(member.product_id ?? index)} className="rounded-panel border border-line bg-surface p-4">
              <span className="block font-semibold text-fg">{str(member.title) ?? str(member.slug) ?? "عنصر"}</span>
              <span className="text-sm text-fg-muted">
                {memberType && memberType in KIND_LABEL ? KIND_LABEL[memberType as PreviewKind] : memberType ?? "دورة"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PackageCourses({ base }: { base: Base }) {
  const members = Array.isArray(base.members) ? (base.members as Base[]) : [];
  const info = Array.isArray(base.info) ? (base.info as Base[]) : [];
  const courseIds = Array.isArray(base.course_ids) ? base.course_ids : [];
  const totalDuration = members.reduce((acc, member) => acc + (num(member.duration) ?? 0), 0);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-2xl font-bold text-fg">محتوى الباقة</h2>
        {members.length > 0 ? (
          <span className="text-sm text-fg-muted">
            {members.length} دورة
            {totalDuration > 0 ? ` · ${formatDurationFromSeconds(totalDuration)}` : ""}
          </span>
        ) : null}
      </div>
      {members.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((member, index) => (
            <li key={String(member.product_id ?? index)} className="flex items-center gap-3 rounded-panel border border-line bg-surface p-3">
              {str(member.image) ? (
                <img src={str(member.image) ?? ""} alt="" className="size-16 shrink-0 rounded-panel object-cover" />
              ) : null}
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-fg">{str(member.title) ?? str(member.course_ref) ?? "دورة"}</span>
                <span className="text-sm text-fg-muted">
                  {(num(member.duration) ?? 0) > 0 ? formatDurationFromSeconds(num(member.duration) ?? 0) : ""}
                  {member.required === false ? " · اختيارية" : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : info.length > 0 ? (
        <div className="flex flex-col gap-6">
          {info.map((section, index) => (
            <div key={index}>
              {str(section.header) ? <h3 className="m-0 text-lg font-semibold text-fg">{str(section.header)}</h3> : null}
              {str(section.body) ? (
                <p className="mt-1 whitespace-pre-line text-fg-muted">{str(section.body)}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-fg-muted">تضم هذه الباقة {courseIds.length} دورة.</p>
      )}
    </section>
  );
}

function LiveCohorts({ base }: { base: Base }) {
  const cohorts = Array.isArray(base.cohorts) ? (base.cohorts as Base[]) : [];
  if (cohorts.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 text-2xl font-bold text-fg">الدفعات القادمة</h2>
      <div className="flex flex-col gap-3">
        {cohorts.map((cohort, index) => {
          const taken = num(cohort.seats_taken) ?? 0;
          const capacity = num(cohort.seat_capacity) ?? 0;
          return (
            <div key={String(cohort.cohort_id ?? index)} className="rounded-panel border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-fg">
                  #{num(cohort.cohort_number) ?? index + 1} {str(cohort.title) ?? ""}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", cohort.status === "open" ? "bg-success/15 text-success" : "bg-surface-alt text-fg-muted")}>
                  {str(cohort.status) ?? ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">
                {formatDateTime(str(cohort.starts_at) ?? "")} → {formatDateTime(str(cohort.ends_at) ?? "")}
                {capacity > 0 ? ` · ${taken}/${capacity} مقعد` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
