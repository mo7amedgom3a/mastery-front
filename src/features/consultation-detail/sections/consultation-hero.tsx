import { CalendarClock, ChevronLeft, Clock, Video, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { TrainerAvatar } from "@/features/product-detail/components/trainer-avatar";

import { consultationFacts, type ConsultationFactKey } from "../model/facts";
import type { ConsultationDetailVM } from "../model/types";

const AVATAR_SIZE = 96;
const factIcon: Record<ConsultationFactKey, LucideIcon> = {
  sessions: CalendarClock,
  length: Clock,
  format: Video,
};

/**
 * Consultation hero, in the course page's visual language: breadcrumb, title, summary, the headline
 * facts as tiles, and share, with the expert's square cover artwork on a lilac field beside them
 * (under them on phones). The expert's avatar straddles the bottom edge and links to their profile
 * when they have one. Server-rendered; the H1 is the LCP element on phones, the cover on desktop.
 */
export function ConsultationHero({ consultation, share }: { consultation: ConsultationDetailVM; share?: ReactNode }) {
  const facts = consultationFacts(consultation);
  const { expert } = consultation;
  // The avatar doesn't link when nothing is behind it: the profile stays a plain label.
  const avatar = expert ? (
    <>
      <TrainerAvatar
        trainer={expert}
        size={AVATAR_SIZE}
        className="ring-4 ring-surface transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none"
      />
      <span className="flex flex-col pb-1">
        <span className="text-xs text-fg-muted">الخبير</span>
        <span className="font-bold underline-offset-4 group-hover:underline">{expert.name}</span>
      </span>
    </>
  ) : null;

  return (
    <>
      <section aria-labelledby="product-title" className="bg-surface-alt text-fg">
        <div className="ma-container pt-8 pb-24 md:pt-12 md:pb-28">
          <nav aria-label="مسار التصفح">
            <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm text-fg-muted">
              <li>
                <AppLink href={routes.home} className="text-fg-muted no-underline hover:text-fg">
                  الرئيسية
                </AppLink>
              </li>
              <li aria-hidden="true">
                <ChevronLeft className="size-4" />
              </li>
              <li>
                <AppLink href={routes.consultations} className="text-fg-muted no-underline hover:text-fg">
                  الاستشارات
                </AppLink>
              </li>
              <li aria-hidden="true">
                <ChevronLeft className="size-4" />
              </li>
              <li aria-current="page" className="line-clamp-1 max-w-[40ch] text-fg">
                {consultation.title}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid items-start gap-10 md:mt-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
            <div className="flex min-w-0 flex-col items-start">
              <div className="ma-cluster gap-2">
                <span className="ma-tag ma-tag--lilac">استشارة</span>
                <span className="ma-tag ma-tag--soft">جلسة فردية</span>
              </div>
              {/* Share sits beside the title (below it on phones), where the decision to share is made. */}
              <div className="mt-6 flex w-full flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-8">
                <h1
                  id="product-title"
                  className="m-0 text-[clamp(2rem,1.3rem+2.8vw,3.5rem)] leading-[1.35] font-bold text-balance"
                >
                  {consultation.title}
                </h1>
                {share ? <div className="sm:mt-3">{share}</div> : null}
              </div>
              {consultation.summary ? (
                <p className="m-0 mt-6 max-w-[44rem] text-lg leading-8 text-fg-muted text-pretty">
                  {consultation.summary}
                </p>
              ) : null}
              <ul aria-label="تفاصيل الاستشارة" className="m-0 mt-10 flex list-none flex-wrap gap-3 p-0">
                {facts.map(({ key, label }) => {
                  const Icon = factIcon[key];
                  return (
                    <li key={key} className="flex items-center gap-3 rounded-panel border border-line bg-surface px-4 py-3">
                      <Icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
                      <span className="text-lg font-bold md:text-xl">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {consultation.image ? (
              // The artwork carries the expert's name along its bottom edge: shown whole, never cropped.
              <div className="w-full max-w-[24rem] justify-self-center overflow-hidden rounded-photo bg-lilac lg:justify-self-end">
                <Image
                  src={consultation.image}
                  alt={expert ? `صورة ${expert.name}` : consultation.title}
                  width={640}
                  height={640}
                  priority
                  sizes="(min-width: 600px) 384px, 100vw"
                  className="block h-auto w-full"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {expert ? (
        <div className="ma-container relative z-10">
          <div className="flex" style={{ marginTop: -AVATAR_SIZE / 2 }}>
            {expert.href ? (
              <AppLink href={expert.href} className="group flex items-end gap-4 text-fg no-underline">
                {avatar}
              </AppLink>
            ) : (
              <div className="flex items-end gap-4">{avatar}</div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
