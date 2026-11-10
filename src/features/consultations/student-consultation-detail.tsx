import { ArrowRight, CalendarClock, UserRound } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { buttonClass } from "@/components/ui/button";
import { routes } from "@/config/routes";
import type { ConsultationDetailData } from "@/features/consultation-detail/model/types";
import { ContentBlocks } from "@/features/product-detail/components/content-blocks";
import { AboutSection } from "@/features/product-detail/sections/about-section";
import { cn } from "@/lib/cn";

/**
 * A consultation the customer owns, inside the dashboard: consultant, session length, the published
 * description, and the way to book a slot. Mirrors the public page without the marketing rails.
 */
export function StudentConsultationDetail({ data }: { data: ConsultationDetailData }) {
  const consultation = data.consultation;
  const expert = consultation.expert;
  const facts = [
    expert?.name ? { icon: UserRound, label: expert.name } : null,
    consultation.sessionLength ? { icon: CalendarClock, label: consultation.sessionLength } : null,
  ].filter((fact) => fact !== null);
  const hasStudioContent = Boolean(consultation.content && consultation.content.length > 0);

  return (
    <div className="@container flex flex-col gap-6">
      <div>
        <AppLink href={routes.studentAccess} className="ma-btn ma-btn--ghost ma-btn--sm gap-2">
          <ArrowRight aria-hidden="true" className="size-4 fill-none" />
          تعلّمي
        </AppLink>
      </div>

      <header className="flex flex-col gap-5 rounded-panel border border-line bg-surface-alt p-5 md:flex-row md:items-center md:gap-6 md:p-6">
        {consultation.image ? (
          <div className="relative w-40 shrink-0 self-center overflow-hidden rounded-photo md:w-48">
            <Image
              src={consultation.image}
              alt=""
              width={640}
              height={640}
              sizes="(min-width: 768px) 192px, 160px"
              className="block h-auto w-full"
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-3">
          <span className="ma-tag ma-tag--soft w-fit">استشارة</span>
          <h1 className="m-0 text-2xl leading-[1.35] font-bold text-pretty md:text-3xl">{consultation.title}</h1>
          {facts.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-fg-muted">
              {facts.map(({ icon: Icon, label }) => (
                <li key={label} className="flex min-w-0 items-center gap-1.5">
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <bdi className="truncate">{label}</bdi>
                </li>
              ))}
            </ul>
          ) : null}
          {consultation.summary ? (
            <p className="m-0 max-w-[70ch] leading-7 text-fg-muted">{consultation.summary}</p>
          ) : null}
          <div className="flex flex-wrap gap-2.5">
            <AppLink href={consultation.href} className={cn(buttonClass({ variant: "primary" }), "gap-2")}>
              <CalendarClock aria-hidden="true" className="size-5 fill-none" />
              احجز موعداً
            </AppLink>
            <AppLink href={routes.studentConsultations} className={cn(buttonClass({ variant: "soft" }), "gap-2")}>
              استشاراتي
            </AppLink>
          </div>
        </div>
      </header>

      {hasStudioContent && consultation.content ? (
        <ContentBlocks sections={consultation.content} />
      ) : (
        <AboutSection sections={consultation.sections} readme={consultation.readme} title="عن الاستشارة" />
      )}
    </div>
  );
}
