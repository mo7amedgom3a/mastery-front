import { ArrowLeft, BookOpen, ChevronDown, Clock, UserRound } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { kindLabel } from "@/features/product-detail/content/copy";
import { formatCount } from "@/lib/format";

import type { PackageItemVM, PackageUnitVM } from "../model/types";

const LESSON_FORMS = { one: "درس واحد", two: "درسان", few: "دروس", many: "درساً" };
const UNIT_FORMS = { one: "وحدة واحدة", two: "وحدتان", few: "وحدات", many: "وحدة" };

function UnitOutline({ item }: { item: PackageItemVM }) {
  return (
    <details className="group mt-4 border-t border-line pt-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium marker:hidden [&::-webkit-details-marker]:hidden">
        محاور ال{kindLabel[item.kind]}
        <span className="text-fg-muted">({formatCount(item.units.length, UNIT_FORMS)})</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-fg-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <ol className="m-0 mt-1 grid list-none gap-1 p-0">
        {item.units.map((unit: PackageUnitVM, index) => (
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

function ItemRow({ item }: { item: PackageItemVM }) {
  const meta = [
    item.trainers.length > 0 ? { icon: UserRound, label: item.trainers.map((trainer) => trainer.name).join("، ") } : null,
    item.duration ? { icon: Clock, label: item.duration } : null,
    item.lessonCount > 0 ? { icon: BookOpen, label: formatCount(item.lessonCount, LESSON_FORMS) } : null,
  ].filter((entry) => entry !== null);
  const titleId = `package-item-${item.key.replace(":", "-")}`;
  const artwork = item.image ? (
    <Image
      src={item.image}
      alt=""
      fill
      sizes="(min-width: 768px) 224px, (min-width: 640px) 192px, 100vw"
      className="object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transition-none"
    />
  ) : null;
  // `self-start`: the row grows when the outline opens; the artwork keeps its 16:10 box.
  const artworkClass = "relative block aspect-[16/10] w-full shrink-0 self-start overflow-hidden bg-surface-alt sm:w-48 md:w-56";

  return (
    <article aria-labelledby={titleId} className="relative flex gap-4 rounded-panel border border-line bg-surface p-4 md:gap-6 md:p-5">
      <span
        aria-hidden="true"
        className="absolute -top-3 start-4 grid size-7 place-items-center rounded-full bg-fg text-sm font-bold text-surface tabular-nums"
      >
        {item.position}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row md:gap-6">
        {item.href ? (
          <AppLink href={item.href} tabIndex={-1} aria-hidden="true" className={artworkClass}>
            {artwork}
          </AppLink>
        ) : (
          <div aria-hidden="true" className={artworkClass}>
            {artwork}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="ma-cluster gap-2">
            <span className={item.kind === "diploma" ? "ma-tag ma-tag--yellow" : "ma-tag ma-tag--coral"}>
              {kindLabel[item.kind]}
            </span>
            {item.category ? <span className="ma-tag ma-tag--soft">{item.category}</span> : null}
          </div>
          <h3 id={titleId} className="m-0 mt-3 text-lg leading-8 font-bold text-pretty">
            {item.href ? (
              <AppLink href={item.href} className="text-fg no-underline underline-offset-4 hover:underline">
                {item.title}
              </AppLink>
            ) : (
              item.title
            )}
          </h3>
          {item.summary ? (
            <p className="m-0 mt-2 line-clamp-2 max-w-[62ch] text-[15px] leading-7 text-fg-muted">{item.summary}</p>
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
            {item.href ? (
              <AppLink
                href={item.href}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-fg no-underline hover:text-accent"
              >
                عرض تفاصيل ال{kindLabel[item.kind]}
                <span className="sr-only">: {item.title}</span>
                <ArrowLeft aria-hidden="true" className="size-4" />
              </AppLink>
            ) : (
              <span className="text-sm text-fg-muted">متاحة ضمن الباقة فقط</span>
            )}
            {item.price.current ? (
              <span className="text-sm text-fg-muted">
                بسعر منفصل{" "}
                <del dir="ltr" className="font-medium tabular-nums">
                  {item.price.current}
                </del>
              </span>
            ) : null}
          </div>

          {item.units.length > 0 ? <UnitOutline item={item} /> : null}
        </div>
      </div>
    </article>
  );
}

/**
 * محتوى الباقة: every included course/diploma in the package's order, each linking to its own page
 * (when it has one),
 * with a native disclosure for its outline (no JS; every title stays in the HTML).
 */
export function PackageContentsSection({
  items,
  title,
  lead,
}: {
  items: readonly PackageItemVM[];
  title: string;
  lead: string | null;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <section id="contents" aria-labelledby="contents-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
      <h2 id="contents-title" className="m-0 text-2xl font-bold">
        {title}
      </h2>
      {lead ? <p className="m-0 mt-2 text-fg-muted">{lead}</p> : null}
      <ol className="m-0 mt-8 grid list-none gap-7 p-0">
        {items.map((item) => (
          <li key={item.key}>
            <ItemRow item={item} />
          </li>
        ))}
      </ol>
    </section>
  );
}
