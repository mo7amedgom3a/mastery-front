import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { safeImage } from "./model/products";

type StudentProgramDetailProps = {
  title: string;
  typeLabel: string;
  image: string | null;
  summary: string | null;
  /** Short facts under the title: what's inside, its length and how long access lasts. */
  meta: readonly string[];
  children: ReactNode;
};

/**
 * The student's own page for a bundle or package: its cover and facts, then every resource inside
 * it (the storefront sections, without prices — the student already owns it).
 */
export function StudentProgramDetail({ title, typeLabel, image, summary, meta, children }: StudentProgramDetailProps) {
  const cover = safeImage(image);
  const facts = meta.filter((fact) => fact.trim().length > 0);

  return (
    <div className="@container flex flex-col gap-6">
      <div>
        <AppLink href={routes.studentAccess} className="ma-btn ma-btn--ghost ma-btn--sm gap-2">
          <ArrowRight aria-hidden="true" className="size-4 fill-none" />
          تعلّمي
        </AppLink>
      </div>

      <header className="flex flex-col gap-5 rounded-panel border border-line bg-surface-alt p-5 md:flex-row md:items-center md:gap-6 md:p-6">
        {cover ? (
          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-panel md:w-56">
            <Image src={cover} alt="" fill sizes="(min-width: 768px) 224px, 100vw" className="object-cover" />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-2">
          <span className="ma-tag ma-tag--soft w-fit">{typeLabel}</span>
          <h1 className="m-0 text-2xl leading-[1.35] font-bold text-pretty md:text-3xl">{title}</h1>
          {summary ? <p className="m-0 max-w-[70ch] leading-7 text-fg-muted">{summary}</p> : null}
          {facts.length > 0 ? <p className="m-0 text-sm text-fg-muted">{facts.join(" · ")}</p> : null}
        </div>
      </header>

      {children}
    </div>
  );
}
