"use client";

import { BookOpen, CalendarClock, Compass, FlaskConical, GraduationCap, Star, UserRound } from "lucide-react";
import type { Route } from "next";
import { useMemo } from "react";

import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { labs } from "@/features/labs/model/catalog";
import { useLabRecommendations } from "@/features/labs/model/use-lab-recommendations";
import { skillLabels } from "@/features/labs/model/types";
import { cn } from "@/lib/cn";
import { catalogProductHref } from "@/lib/shop/product-links";
import { formatNumber } from "@/lib/format";

import { pickConsultations, pickExperts, type MockConsultation, type MockExpert } from "../model/growth-mocks";
import type { LabInsights, SkillStat } from "../model/lab-insights";
import { formatPercent } from "../model/format";

function DemoBadge() {
  return <span className="rounded-chip bg-lilac px-2 py-0.5 text-[11px] font-bold text-ink">بيانات تجريبية</span>;
}

function SkillChips({ skills }: { skills: readonly (keyof typeof skillLabels)[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="المهارات المستهدفة">
      {skills.map((skill) => (
        <li key={skill} className="rounded-chip bg-surface-alt px-2 py-0.5 text-[11px] text-fg-muted">
          {skillLabels[skill]}
        </li>
      ))}
    </ul>
  );
}

function ConsultationCard({ item }: { item: MockConsultation }) {
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-photo border border-line p-4">
      <div className="flex items-start gap-2.5">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-ink", brandBg[item.color])} aria-hidden>
          <CalendarClock className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h4 className="m-0 text-sm leading-6 font-bold">{item.title}</h4>
          <p className="m-0 text-xs text-fg-muted">
            {item.expert} · {item.categoryName}
          </p>
        </div>
      </div>
      <p className="m-0 text-[13px] leading-5 text-fg-muted">{item.blurb}</p>
      <p className="m-0 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
        <span>{item.format}</span>
        <span aria-hidden>·</span>
        <span>{item.sessions === 1 ? "جلسة واحدة" : `${formatNumber(item.sessions)} جلسات`}</span>
        <span aria-hidden>·</span>
        <span>{formatNumber(item.minutes)} دقيقة</span>
        <span className="inline-flex items-center gap-0.5">
          <Star className="size-3.5 text-yellow" aria-hidden /> {item.rating}
        </span>
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-sm font-bold tabular-nums">{formatNumber(item.price)} ر.س</span>
        <ButtonLink href={routes.consultations} variant="secondary" size="sm">
          احجز استشارة
        </ButtonLink>
      </div>
    </article>
  );
}

function ExpertCard({ item }: { item: MockExpert }) {
  const initials = item.name.trim().charAt(0);
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-photo border border-line p-4">
      <div className="flex items-start gap-2.5">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-ink", brandBg[item.color])} aria-hidden>
          {initials}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h4 className="m-0 text-sm leading-6 font-bold">{item.name}</h4>
          <p className="m-0 text-xs text-fg-muted">{item.title}</p>
        </div>
      </div>
      <p className="m-0 text-[13px] leading-5 text-fg-muted">{item.bio}</p>
      <p className="m-0 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-0.5">
          <Star className="size-3.5 text-yellow" aria-hidden /> {item.rating}
        </span>
        <span aria-hidden>·</span>
        <span>{formatNumber(item.sessions)} جلسة</span>
        <span aria-hidden>·</span>
        <span>أقرب موعد: {item.nextSlot}</span>
      </p>
      <div className="mt-auto pt-1">
        <ButtonLink href={routes.experts} variant="secondary" size="sm">
          <UserRound className="size-4" aria-hidden /> الملف والخبرة
        </ButtonLink>
      </div>
    </article>
  );
}

/**
 * The closure of the report: the next lab to retry, catalog programs for the weakest skill, then
 * demo consultation services and experts that address it. Courses come from the catalog API; the
 * coaching block is local mock data and is labelled as such.
 */
export function GrowthPathPanel({ insight }: { insight: LabInsights }) {
  const gapSkills: SkillStat[] = insight.gaps.length ? insight.gaps : insight.rankedSkills.slice(0, 2);
  const weakest = gapSkills[0] ?? null;

  const seedLab = useMemo(() => {
    if (!weakest) return labs[0];
    const eligible = labs.filter((lab) => lab.skills.includes(weakest.skill));
    const pool = eligible.length ? eligible : labs;
    return (
      [...pool].sort((a, b) => {
        const scoreOf = (slug: string) => insight.compass.find((point) => point.slug === slug)?.score;
        return (scoreOf(a.slug) ?? -1) - (scoreOf(b.slug) ?? -1);
      })[0] ?? labs[0]
    );
  }, [weakest, insight.compass]);

  const { courses, diplomas, categorySlug, pending, error } = useLabRecommendations(seedLab);
  const programs = [...courses.slice(0, 2), ...diplomas.slice(0, 1)];
  const consultations = pickConsultations(gapSkills, 2);
  const experts = pickExperts(gapSkills, 2);

  return (
    <DashboardPanel
      id="insights-growth-path-title"
      title="خطتك القادمة من نقاط ضعفك"
      subtitle="ابدأ بمختبر يعالج أضعف محور، ثم برنامج يقوّيه، ثم جلسة مع مختص."
    >
      <div className="grid gap-3 @xl:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-photo border border-pink/40 bg-pink/10 p-4">
          <header className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
              <FlaskConical className="size-4 text-pink" aria-hidden /> أعد التجربة
            </h3>
            {weakest ? (
              <span className="rounded-chip bg-surface px-2 py-0.5 text-[11px] font-semibold">
                أضعف محور: {weakest.label} {formatPercent(weakest.level)}
              </span>
            ) : null}
          </header>
          <div className="flex flex-col gap-1.5">
            <AppLink href={routes.lab(seedLab.slug)} className="text-base font-bold hover:text-accent">
              {seedLab.title}
            </AppLink>
            <p className="m-0 text-[13px] leading-5 text-fg-muted">{seedLab.tagline}</p>
            <SkillChips skills={seedLab.skills} />
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <ButtonLink href={routes.lab(seedLab.slug)} size="sm">
              ابدأ المحاولة
            </ButtonLink>
            <span className="text-xs text-fg-muted">{formatNumber(seedLab.minutes)} دقيقة</span>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-photo border border-line p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
              <BookOpen className="size-4 text-accent" aria-hidden /> دورات تبني المهارة
            </h3>
            <AppLink href={routes.searchCategory(categorySlug) as Route} className="text-xs text-fg-muted hover:text-fg">
              تصفّح قسم {seedLab.categoryName}
            </AppLink>
          </header>
          {pending ? (
            <div className="grid gap-2">
              <Skeleton className="h-14 rounded-photo" />
              <Skeleton className="h-14 rounded-photo" />
            </div>
          ) : programs.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {programs.map((card) => (
                <li key={card.product_id} className="min-w-0">
                  <AppLink
                    href={catalogProductHref(card.slug, card.product_type) as Route}
                    className="flex items-start gap-2 rounded-photo p-1.5 hover:bg-surface-alt"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-surface-alt" aria-hidden>
                      {card.product_type === "diploma" ? <GraduationCap className="size-4" /> : <BookOpen className="size-4" />}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="line-clamp-2 text-[13px] leading-5 font-semibold">{card.title?.trim() || card.slug}</span>
                      <span className="text-[11px] text-fg-muted">
                        {card.product_type === "diploma" ? "دبلوم" : "دورة"}
                        {card.instructor_name ? ` · ${card.instructor_name}` : ""}
                      </span>
                    </span>
                  </AppLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] leading-5 text-fg-muted">
              {error ? "تعذّر تحميل اقتراحات البرامج الآن." : "لا توجد برامج مطابقة في هذا القسم بعد."}
            </p>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <header className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
            <Compass className="size-4 text-accent" aria-hidden /> استشارات مقترحة بحسب ضعفك
          </h3>
          <DemoBadge />
        </header>
        <div className="grid gap-3 @xl:grid-cols-2">
          {consultations.map((item) => (
            <ConsultationCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex flex-wrap items-center gap-2">
          <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
            <UserRound className="size-4 text-accent" aria-hidden /> خبراء يمكنك التحدث معهم
          </h3>
          <DemoBadge />
        </header>
        <div className="grid gap-3 @xl:grid-cols-2">
          {experts.map((item) => (
            <ExpertCard key={item.key} item={item} />
          ))}
        </div>
      </section>

      <p className="m-0 text-xs leading-5 text-fg-muted">
        البرامج من كتالوج المنصة. الاستشارات وملفات الخبراء بيانات تجريبية لهذا النموذج، والأسعار والمواعيد غير حقيقية.
      </p>
    </DashboardPanel>
  );
}
