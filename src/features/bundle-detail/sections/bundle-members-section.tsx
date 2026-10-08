import { ArrowLeft, BookOpen, CalendarClock, ChevronDown, Clock, UserRound } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { formatCount } from "@/lib/format";

import { memberKindLabel } from "../model/mappers";
import type { BundleMemberGroupVM, BundleMemberKind, BundleMemberVM } from "../model/types";

const LESSON_FORMS = { one: "درس واحد", two: "درسان", few: "دروس", many: "درساً" };
const UNIT_FORMS = { one: "وحدة واحدة", two: "وحدتان", few: "وحدات", many: "وحدة" };

const kindTag: Record<BundleMemberKind, string> = {
  diploma: "ma-tag--yellow",
  course: "ma-tag--coral",
  consultation: "ma-tag--lilac",
  package: "ma-tag--green",
  other: "ma-tag--soft",
};

function UnitOutline({ member }: { member: BundleMemberVM }) {
  return (
    <details className="group mt-4 border-t border-line pt-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium marker:hidden [&::-webkit-details-marker]:hidden">
        محاور ال{memberKindLabel[member.kind]}
        <span className="text-fg-muted">({formatCount(member.units.length, UNIT_FORMS)})</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-fg-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <ol className="m-0 mt-1 grid list-none gap-1 p-0">
        {member.units.map((unit, index) => (
          <li key={unit.id} className="flex min-h-9 items-center gap-3 text-[15px]">
            <span aria-hidden="true" className="w-5 shrink-0 text-center text-sm tabular-nums text-fg-muted">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-pretty">{unit.title}</span>
            <span className="shrink-0 text-sm text-fg-muted">
              {[unit.lessonCount > 0 ? formatCount(unit.lessonCount, LESSON_FORMS) : null, unit.duration]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

function MemberRow({ member }: { member: BundleMemberVM }) {
  const meta = [
    member.people.length > 0 ? { icon: UserRound, label: member.people.join("، ") } : null,
    member.duration ? { icon: member.kind === "consultation" ? CalendarClock : Clock, label: member.duration } : null,
    member.lessonCount > 0 ? { icon: BookOpen, label: formatCount(member.lessonCount, LESSON_FORMS) } : null,
  ].filter((entry) => entry !== null);
  const titleId = `bundle-member-${member.position}`;
  const artwork = member.image ? (
    <Image
      src={member.image}
      alt=""
      fill
      sizes="(min-width: 768px) 224px, (min-width: 640px) 192px, 100vw"
      // Consultant artwork sets the expert's name at its bottom edge: never crop it.
      className={
        member.kind === "consultation"
          ? "object-contain"
          : "object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transition-none"
      }
    />
  ) : null;
  const artworkClass = "relative block aspect-[16/10] w-full shrink-0 self-start overflow-hidden bg-surface-alt sm:w-48 md:w-56";
  const kind = memberKindLabel[member.kind];

  return (
    <article aria-labelledby={titleId} className="relative flex gap-4 rounded-panel border border-line bg-surface p-4 md:gap-6 md:p-5">
      <span
        aria-hidden="true"
        className="absolute -top-3 start-4 grid size-7 place-items-center rounded-full bg-fg text-sm font-bold text-surface tabular-nums"
      >
        {member.position}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row md:gap-6">
        {member.href ? (
          <AppLink href={member.href} tabIndex={-1} aria-hidden="true" className={artworkClass}>
            {artwork}
          </AppLink>
        ) : (
          <div aria-hidden="true" className={artworkClass}>
            {artwork}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="ma-cluster gap-2">
            <span className={`ma-tag ${kindTag[member.kind]}`}>{kind}</span>
            {member.category ? <span className="ma-tag ma-tag--soft">{member.category}</span> : null}
          </div>
          <h4 id={titleId} className="m-0 mt-3 text-lg leading-8 font-bold text-pretty">
            {member.href ? (
              <AppLink href={member.href} className="text-fg no-underline underline-offset-4 hover:underline">
                {member.title}
              </AppLink>
            ) : (
              member.title
            )}
          </h4>
          {member.summary ? (
            <p className="m-0 mt-2 line-clamp-2 max-w-[62ch] text-[15px] leading-7 text-fg-muted">{member.summary}</p>
          ) : null}
          {meta.length > 0 ? (
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-fg-muted">
              {meta.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {member.href ? (
              <AppLink
                href={member.href}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-fg no-underline hover:text-accent"
              >
                عرض تفاصيل ال{kind}
                <span className="sr-only">: {member.title}</span>
                <ArrowLeft aria-hidden="true" className="size-4" />
              </AppLink>
            ) : (
              <span className="text-sm text-fg-muted">متاحة ضمن الحزمة فقط</span>
            )}
            {member.price.current ? (
              <span className="text-sm text-fg-muted">
                بسعر منفصل{" "}
                <del dir="ltr" className="font-medium tabular-nums">
                  {member.price.current}
                </del>
              </span>
            ) : null}
          </div>

          {member.units.length > 0 ? <UnitOutline member={member} /> : null}
        </div>
      </div>
    </article>
  );
}

/**
 * محتوى الحزمة: every member in the bundle's order, grouped by kind, each linking to its own page
 * when it has one, with a native disclosure for a course or diploma outline (no JS).
 */
export function BundleMembersSection({ groups, lead }: { groups: readonly BundleMemberGroupVM[]; lead: string | null }) {
  if (groups.length === 0) {
    return null;
  }
  return (
    <section id="contents" aria-labelledby="contents-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
      <h2 id="contents-title" className="m-0 text-2xl font-bold">
        محتوى الحزمة
      </h2>
      {lead ? <p className="m-0 mt-2 text-fg-muted">{lead}</p> : null}
      <div className="mt-8 flex flex-col gap-10">
        {groups.map((group) => (
          <div key={group.kind}>
            <h3 className="m-0 text-lg font-bold text-fg-muted">
              {group.title} <span className="tabular-nums">({group.members.length})</span>
            </h3>
            <ol className="m-0 mt-6 grid list-none gap-7 p-0">
              {group.members.map((member) => (
                <li key={member.key}>
                  <MemberRow member={member} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
