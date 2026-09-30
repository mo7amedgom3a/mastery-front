"use client";

import { CalendarClock, Clock, Layers, UserRound } from "lucide-react";
import { useState } from "react";

import { actionsFor } from "@/components/shop/card-actions-for";
import { buttonClass } from "@/components/ui/button";
import type { ProductCardMeta } from "@/components/ui/product-card";
import { routes } from "@/config/routes";
import { formatCount, formatNumber } from "@/lib/format";

import { ProductRailSection } from "../components/product-rail-section";
import { MAX_CARDS } from "../model/mappers";
import type { ConsultationCardVM, CourseCardVM, FilterVM, PackageCardVM } from "../model/types";

const COURSE_FORMS = { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" };
const SESSION_FORMS = { one: "جلسة واحدة", two: "جلستان", few: "جلسات", many: "جلسة" };

/** Selected chip (null = all) and the cards it shows. */
function useFilter<T extends { filterKeys: string[] }>(items: T[], filters: FilterVM[]) {
  const [active, setActive] = useState<string | null>(null);
  const filter = filters.find((item) => item.key === active) ?? null;
  const visible = (filter ? items.filter((item) => item.filterKeys.includes(filter.key)) : items).slice(
    0,
    MAX_CARDS,
  );
  return { filter, visible, select: setActive };
}

function FilterChips({
  label,
  filters,
  active,
  onSelect,
}: {
  label: string;
  filters: FilterVM[];
  active: FilterVM | null;
  onSelect: (key: string | null) => void;
}) {
  if (filters.length < 2) {
    return null;
  }
  const chips: { key: string | null; label: string }[] = [{ key: null, label: "الكل" }, ...filters];
  return (
    <div role="group" aria-label={label} className="mt-10">
      <ul className="-mx-4 m-0 flex list-none gap-2 overflow-x-auto p-0 px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((chip) => {
          const selected = (active?.key ?? null) === chip.key;
          return (
            <li key={chip.key ?? "all"} className="shrink-0">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(chip.key)}
                className={buttonClass({ variant: selected ? "secondary" : "outline", size: "sm" })}
              >
                {chip.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function courseMeta(course: CourseCardVM): ProductCardMeta[] {
  const meta: ProductCardMeta[] = [];
  if (course.instructor) meta.push({ icon: UserRound, label: course.instructor });
  if (course.duration) meta.push({ icon: Clock, label: course.duration });
  return meta;
}

export function CoursesSection({
  courses,
  total,
  filters,
}: {
  courses: CourseCardVM[];
  total: number;
  filters: FilterVM[];
}) {
  const { filter, visible, select } = useFilter(courses, filters);
  return (
    <ProductRailSection
      id="courses"
      label="الدورات"
      title="دورات مختارة من خبراء ماستري"
      lead={
        total > 0
          ? `أكثر من ${formatNumber(total)} دورة مسجّلة في التسويق والإدارة والمبيعات والمالية وغيرها — ابدأ بما يناسب هدفك.`
          : undefined
      }
      viewAll={
        filter?.href ? { label: `كل دورات ${filter.label}`, href: filter.href } : { label: "كل الدورات", href: routes.courses }
      }
      railKey={filter?.key}
      cards={visible.map((course) => ({
        key: course.id,
        href: course.href,
        title: course.title,
        image: course.image,
        color: "coral",
        tag: course.category,
        summary: course.summary ?? "دورة مسجّلة يقدّمها خبراء ماستري، تتعلّمها بإيقاعك ومن أي جهاز.",
        meta: courseMeta(course),
        price: course.price,
        actions: actionsFor("course", course),
      }))}
    >
      <FilterChips label="تصفية الدورات حسب المجال" filters={filters} active={filter} onSelect={select} />
    </ProductRailSection>
  );
}

export function DiplomasSection({ diplomas, filters }: { diplomas: CourseCardVM[]; filters: FilterVM[] }) {
  const { filter, visible, select } = useFilter(diplomas, filters);
  return (
    <ProductRailSection
      id="diplomas"
      label="الدبلومات"
      title="دبلومات احترافية بدفعات مباشرة"
      lead="برامج متكاملة متعددة الوحدات تُقدَّم على دفعات مع الخبراء — سجّل في الدفعة القادمة."
      tone="alt"
      viewAll={{ label: "كل الدبلومات", href: routes.diplomas }}
      railKey={filter?.key}
      cards={visible.map((diploma) => ({
        key: diploma.id,
        href: diploma.href,
        title: diploma.title,
        image: diploma.image,
        color: "yellow",
        tag: "دبلوم",
        summary: diploma.summary ?? "برنامج متكامل متعدد الوحدات يُقدَّم على دفعات مع خبراء ماستري.",
        meta: courseMeta(diploma),
        price: diploma.price,
        actions: actionsFor("diploma", diploma),
      }))}
    >
      <FilterChips label="تصفية الدبلومات حسب المجال" filters={filters} active={filter} onSelect={select} />
    </ProductRailSection>
  );
}

export function PackagesSection({ packages, filters }: { packages: PackageCardVM[]; filters: FilterVM[] }) {
  const { filter, visible, select } = useFilter(packages, filters);
  return (
    <ProductRailSection
      id="packages"
      label="الباقات"
      title="باقات تجمع عدة دورات حول هدف واحد"
      lead="مسارات جاهزة في التسويق والمالية والمبيعات والتميز الوظيفي، تحصل فيها على عدد من الدورات معاً."
      viewAll={{ label: "كل الباقات", href: routes.packages }}
      railKey={filter?.key}
      cards={visible.map((pkg) => {
        const courses = pkg.courseCount > 0 ? formatCount(pkg.courseCount, COURSE_FORMS) : null;
        return {
          key: pkg.id,
          href: pkg.href,
          title: pkg.title,
          image: pkg.image,
          color: "green",
          tag: "باقة",
          summary: pkg.summary ?? (courses ? `مسار يضم ${courses} مختارة حول هدف مهني واحد.` : null),
          meta: courses ? [{ icon: Layers, label: courses }] : [],
          price: pkg.price,
          actions: actionsFor("package", pkg),
        };
      })}
    >
      <FilterChips label="تصفية الباقات حسب المجال" filters={filters} active={filter} onSelect={select} />
    </ProductRailSection>
  );
}

export function ConsultationsSection({
  consultations,
  filters,
}: {
  consultations: ConsultationCardVM[];
  filters: FilterVM[];
}) {
  const { filter, visible, select } = useFilter(consultations, filters);
  return (
    <ProductRailSection
      id="consultations"
      label="الاستشارات"
      title="استشارات فردية مع الخبراء"
      lead="احجز جلسة مع خبير في مجالك واحصل على إجابات مخصّصة لمشروعك أو مسيرتك المهنية."
      tone="alt"
      viewAll={{ label: "كل الاستشارات", href: routes.consultations }}
      railKey={filter?.key}
      cards={visible.map((consultation) => {
        const meta: ProductCardMeta[] = [];
        if (consultation.consultant) meta.push({ icon: UserRound, label: consultation.consultant });
        if (consultation.sessions > 0) {
          const sessions = formatCount(consultation.sessions, SESSION_FORMS);
          meta.push({
            icon: CalendarClock,
            label: consultation.sessionLength ? `${sessions} · ${consultation.sessionLength}` : sessions,
          });
        }
        return {
          key: consultation.id,
          href: consultation.href,
          title: consultation.title,
          image: consultation.image,
          // Consultant artwork puts the expert's name at the bottom edge: full width, uncropped.
          media: "natural" as const,
          color: "lilac",
          tag: "استشارة",
          summary:
            consultation.summary ??
            (consultation.consultant ? `جلسة فردية عبر اجتماع مرئي مع ${consultation.consultant}.` : null),
          meta,
          price: consultation.price,
          actions: actionsFor("consultation", consultation),
        };
      })}
    >
      <FilterChips label="تصفية الاستشارات حسب المجال" filters={filters} active={filter} onSelect={select} />
    </ProductRailSection>
  );
}
