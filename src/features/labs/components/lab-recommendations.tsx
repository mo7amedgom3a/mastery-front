"use client";

import { BookOpen, ChevronLeft, Clock, GraduationCap, UserRound } from "lucide-react";
import type { Route } from "next";

import { brandColorAt } from "@/components/ui/brand-colors";
import { ProductCard, type ProductCardMeta } from "@/components/ui/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewAllLink } from "@/components/ui/view-all-link";
import { routes } from "@/config/routes";
import { safeImage } from "@/features/student-dashboard/model/products";
import type { CatalogCard } from "@/lib/api/browse";
import { AppLink } from "@/components/ui/app-link";
import { formatMinutes, toPlainText } from "@/lib/format";
import { toPricing } from "@/lib/pricing";
import { catalogProductHref } from "@/lib/shop/product-links";

import { useLabRecommendations } from "../model/use-lab-recommendations";
import type { LabDefinition } from "../model/types";
import { LabPanel } from "./bits";

const hrefOf = (card: CatalogCard) => catalogProductHref(card.slug, card.product_type) as Route;

export function RecommendedProduct({ card, index, surface = "lab-recommendations" }: { card: CatalogCard; index: number; surface?: string }) {
  const duration = card.duration_seconds ? formatMinutes(Math.round(card.duration_seconds / 60)) : null;
  const meta: ProductCardMeta[] = [
    card.instructor_name ? { icon: UserRound, label: card.instructor_name } : null,
    duration ? { icon: Clock, label: duration } : null,
  ].filter((entry) => entry !== null);
  return (
    <ProductCard
      href={hrefOf(card)}
      title={card.title?.trim() || card.slug}
      image={safeImage(card.image)}
      media="wide"
      color={brandColorAt(index)}
      tag={card.product_type === "diploma" ? "دبلوم" : "دورة"}
      summary={toPlainText(card.short_description, 120)}
      meta={meta}
      price={toPricing(card.price?.amount, card.price?.compare_at_amount, card.price?.currency_code)}
      ctaLabel="اعرف المزيد"
      tracking={{ surface, position: index }}
    />
  );
}

/**
 * After the debrief: courses and diplomas from the lab's catalog category that deepen what the lab
 * practised. Hidden entirely when the catalog is unreachable and there is nothing to show.
 */
export function LabRecommendations({ lab }: { lab: LabDefinition }) {
  const { courses, diplomas, categorySlug, pending, error } = useLabRecommendations(lab);
  if (!pending && error && !courses.length && !diplomas.length) {
    return (
      <LabPanel title="طوّر ما تدرّبت عليه">
        <p className="m-0 text-sm text-fg-muted">تعذّر تحميل الاقتراحات الآن.</p>
        <ViewAllLink href={routes.searchCategory(categorySlug)} label={`تصفّح برامج ${lab.categoryName}`} />
      </LabPanel>
    );
  }

  const groups = [
    { key: "courses", icon: BookOpen, title: "دورات تبني المهارة", items: courses, type: "course" as const },
    { key: "diplomas", icon: GraduationCap, title: "دبلومات للتعمّق والاعتماد", items: diplomas, type: "diploma" as const },
  ];

  return (
    <section aria-labelledby="lab-recs-title" className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5 md:p-7">
      <header className="flex flex-col gap-1">
        <h2 id="lab-recs-title" className="m-0 text-xl leading-8 font-bold">
          طوّر ما تدرّبت عليه
        </h2>
        <p className="m-0 text-sm text-fg-muted">
          برامج من قسم «{lab.categoryName}» تعمّق المهارات التي اختبرها هذا المختبر. عُد بعدها وحسّن نتيجتك.
        </p>
      </header>
      {groups.map((group) =>
        pending || group.items.length ? (
          <div key={group.key} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="m-0 inline-flex items-center gap-2 text-base font-bold">
                <group.icon className="size-5 text-accent" aria-hidden /> {group.title}
              </h3>
              <ViewAllLink href={routes.categoryOf(group.type, categorySlug)} label="عرض الكل" />
            </div>
            <div className="@container">
              <ul className="m-0 grid list-none gap-5 p-0 @xl:grid-cols-2 @4xl:grid-cols-3">
                {pending
                  ? Array.from({ length: group.type === "course" ? 3 : 2 }, (_, i) => (
                      <li key={i}>
                        <Skeleton className="h-80 rounded-panel" />
                      </li>
                    ))
                  : group.items.map((card, index) => (
                      <li key={card.product_id}>
                        <RecommendedProduct card={card} index={index + (group.type === "diploma" ? 3 : 0)} />
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        ) : null,
      )}
    </section>
  );
}

/** Briefing sidebar: a short "learn first" list linking to the most relevant programs. */
export function LabPrepList({ lab }: { lab: LabDefinition }) {
  const { courses, diplomas, pending } = useLabRecommendations(lab);
  const items = [...courses.slice(0, 2), ...diplomas.slice(0, 1)];
  if (!pending && !items.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="m-0 inline-flex items-center gap-2 text-lg font-bold">
        <BookOpen className="size-5 text-sky" aria-hidden /> تعلّم قبل أن تبدأ
      </h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {pending
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-12 rounded-photo" />
              </li>
            ))
          : items.map((card) => (
              <li key={card.product_id}>
                <AppLink
                  href={hrefOf(card)}
                  className="flex items-center justify-between gap-3 rounded-photo border border-line px-3 py-2 text-sm leading-6 hover:border-accent"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{card.title?.trim()}</span>
                    <span className="text-[12px] text-fg-muted">{card.product_type === "diploma" ? "دبلوم" : "دورة"}</span>
                  </span>
                  <ChevronLeft className="size-4 shrink-0 text-fg-muted" aria-hidden />
                </AppLink>
              </li>
            ))}
      </ul>
    </div>
  );
}
