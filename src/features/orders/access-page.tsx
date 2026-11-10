"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { KeyRound, Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { TypeFilter } from "@/features/student-dashboard/components/type-filter";
import { safeLmsImage } from "@/features/student-dashboard/model/learning";
import { countByType, productTypePluralLabel } from "@/features/student-dashboard/model/products";
import { useCatalogArtwork } from "@/features/student-dashboard/model/use-artwork";
import { commerceQueries, type EntitlementResponse } from "@/lib/api/commerce";
import { lmsQueries } from "@/lib/api/lms";
import { cn } from "@/lib/cn";

import { ConsultationAccessCard } from "./components/consultation-card";
import { AccessCard } from "./components/order-sections";

/** "Inactive" groups what support paused or ended (suspended and revoked access). */
const FILTERS = [
  { status: "active", label: "الفعّال", statuses: ["active"] },
  { status: "expired", label: "المنتهي", statuses: ["expired"] },
  { status: "inactive", label: "الموقوف", statuses: ["suspended", "revoked"] },
] as const;

type Filter = (typeof FILTERS)[number]["status"];

/** One card per product: several orders can grant the same course, so the longest access wins. */
function pickBestEntitlement(current: EntitlementResponse, candidate: EntitlementResponse): EntitlementResponse {
  const expiry = (item: EntitlementResponse) =>
    item.expires_at ? Date.parse(item.expires_at) : Number.POSITIVE_INFINITY;
  if (expiry(candidate) !== expiry(current)) return expiry(candidate) > expiry(current) ? candidate : current;
  const created = (item: EntitlementResponse) => (item.created_at ? Date.parse(item.created_at) : 0);
  return created(candidate) > created(current) ? candidate : current;
}

/** Arabic-aware, case-insensitive name search (the titles are mostly Arabic). */
function normalizeQuery(value: string): string {
  return value.toLocaleLowerCase("ar").replace(/\s+/g, " ").trim();
}

/** The API caps one page at 100; a bundle-heavy library needs several of them. */
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** Sized by the content column, not the window: the sidebar takes a share of wide screens. */
const GRID = "m-0 grid list-none gap-5 p-0 @xl:grid-cols-2 @4xl:grid-cols-3";

/**
 * What the student can open, with when access started and when it ends. Filtered by status, and by
 * product type through `?type=` (so a link from the dashboard home lands already filtered).
 */
export function AccessPage() {
  const [filter, setFilter] = useState<Filter>("active");
  // Client-side narrowing of the loaded page: a program (bundle/package), a category, or a name.
  const [query, setQuery] = useState("");
  const [programId, setProgramId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || null;
  const setType = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("type", next);
    else params.delete("type");
    const nextQuery = params.toString();
    // `history.replaceState` updates the query string without a server round trip.
    window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const statuses = FILTERS.find((option) => option.status === filter)?.statuses ?? ["active"];
  const firstPages = useQueries({
    queries: statuses.map((status) => ({
      ...commerceQueries.entitlements({ status, limit: PAGE_SIZE, offset: 0 }),
      placeholderData: keepPreviousData,
    })),
  });
  // The first page reports how many rows exist; fetch the rest so a large library (bundle members
  // plus individual courses) is never cut off at 100.
  const restQueries = statuses.flatMap((status, index) => {
    const total = firstPages[index]?.data?.total ?? 0;
    const pageCount = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES);
    return Array.from({ length: Math.max(0, pageCount - 1) }, (_, page) => ({
      ...commerceQueries.entitlements({ status, limit: PAGE_SIZE, offset: (page + 1) * PAGE_SIZE }),
      placeholderData: keepPreviousData,
    }));
  });
  const restPages = useQueries({ queries: restQueries });
  const pages = [...firstPages, ...restPages];
  const access = {
    isPending: firstPages.some((page) => page.isPending),
    isError: pages.some((page) => page.isError),
    isFetching: pages.some((page) => page.isFetching),
    dataUpdatedAt: Math.max(0, ...pages.map((page) => page.dataUpdatedAt)),
  };
  // Several orders can grant the same product (a package plus a later single purchase): one card.
  const byProduct = new Map<string, EntitlementResponse>();
  for (const item of pages.flatMap((page) => page.data?.items ?? [])) {
    const current = byProduct.get(item.product_id);
    byProduct.set(item.product_id, current ? pickBestEntitlement(current, item) : item);
  }
  const items = [...byProduct.values()];
  const artwork = useCatalogArtwork(items.flatMap((item) => (item.product_slug ? [item.product_slug] : [])));
  // The LMS is the only place with a real cover for a course; the catalog art is the fallback.
  const lmsCourses = useQuery(lmsQueries.courses({ page: 1, page_size: 50 }));
  const lmsByEntitlement = useMemo(() => {
    const map = new Map<string, { image: string | null; instructor: string | null }>();
    for (const course of lmsCourses.data?.items ?? []) {
      if (!course.entitlement_id) continue;
      map.set(course.entitlement_id, {
        image: safeLmsImage(course.image_url),
        instructor: course.trainer?.trim() || null,
      });
    }
    return map;
  }, [lmsCourses.data]);
  // A program is a bundle/package the customer owns; its contents are the rows that point at it.
  const programs = (() => {
    const byId = new Map<string, { id: string; title: string; type: string; count: number }>();
    for (const item of items) {
      if (item.product_type !== "bundle" && item.product_type !== "package") continue;
      if (!byId.has(item.product_id)) {
        byId.set(item.product_id, {
          id: item.product_id,
          title: item.product_title ?? item.product_slug ?? "برنامج",
          type: item.product_type,
          count: 0,
        });
      }
    }
    for (const program of byId.values()) {
      program.count = items.filter(
        (item) => item.product_id !== program.id && (item.program_ids ?? []).includes(program.id),
      ).length;
    }
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, "ar"));
  })();

  // Categories come from the customer's own resources, not the whole catalog.
  const categories = (() => {
    const byId = new Map<string, { id: string; name: string; count: number }>();
    for (const item of items) {
      if (!item.category_id || !item.category_name) continue;
      const entry = byId.get(item.category_id) ?? { id: item.category_id, name: item.category_name, count: 0 };
      entry.count += 1;
      byId.set(item.category_id, entry);
    }
    return [...byId.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ar"));
  })();

  const needle = normalizeQuery(query);
  const scoped = items.filter((item) => {
      if (programId && item.product_id !== programId && !(item.program_ids ?? []).includes(programId)) return false;
      if (categoryId && item.category_id !== categoryId) return false;
      if (!needle) return true;
      return (
        normalizeQuery(item.product_title ?? "").includes(needle) ||
        normalizeQuery(item.product_slug ?? "").includes(needle)
      );
  });

  const counts = countByType(scoped, (item) => item.product_type ?? "");
  // A type that isn't in this list (e.g. after switching status) filters nothing out of sight.
  const selected = type && counts.some((count) => count.type === type) ? type : null;
  const visible = selected ? scoped.filter((item) => item.product_type === selected) : scoped;
  const narrowed = Boolean(programId || categoryId || query.trim() || selected);

  const extended = searchParams.get("extended") === "1";

  return (
    <div className="@container flex flex-col gap-6">
      {extended ? (
        <div className="ma-alert ma-alert--success" role="status">
          <div>
            <p className="ma-alert__title">تم الدفع بنجاح</p>
            <p className="ma-alert__text">يُضاف التمديد إلى تاريخ انتهاء وصولك خلال لحظات بعد تأكيد الدفع.</p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <TypeFilter counts={counts} total={scoped.length} value={selected} onChange={setType} />
        <div role="group" aria-label="تصفية حسب الحالة" className="ma-cluster">
          {FILTERS.map((option) => (
            <button
              key={option.status}
              type="button"
              aria-pressed={filter === option.status}
              onClick={() => setFilter(option.status)}
              className={cn("ma-btn ma-btn--sm min-h-11", filter === option.status ? "ma-btn--secondary" : "ma-btn--soft")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 fill-none text-fg-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="ابحث باسم الدورة أو البرنامج"
              placeholder="ابحث باسم الدورة…"
              className="ma-input min-h-11 w-full ps-9"
            />
          </div>
          {programs.length > 0 ? (
            <select
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
              aria-label="تصفية حسب البرنامج"
              className="ma-input min-h-11 max-w-[280px]"
            >
              <option value="">كل البرامج</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title} ({program.count})
                </option>
              ))}
            </select>
          ) : null}
          {categories.length > 0 ? (
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              aria-label="تصفية حسب التصنيف"
              className="ma-input min-h-11 max-w-[240px]"
            >
              <option value="">كل التصنيفات</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          ) : null}
        </div>
        {narrowed ? (
          <p className="m-0 text-sm text-fg-muted" role="status">
            عرض {visible.length} من {items.length}
          </p>
        ) : null}
      </div>

      {access.isPending ? (
        <div role="status" className={GRID}>
          <span className="sr-only">جارٍ التحميل…</span>
          <Skeleton className="h-96" />
          <Skeleton className="h-96 @max-xl:hidden" />
          <Skeleton className="h-96 @max-4xl:hidden" />
        </div>
      ) : access.isError ? (
        <div className="ma-alert ma-alert--warning" role="alert">
          <div>
            <p className="ma-alert__title">تعذّر تحميل وصولك</p>
            <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
          <KeyRound aria-hidden="true" className="size-8 fill-none text-accent" />
          <p className="m-0 text-fg-muted">
            {narrowed
              ? "لا توجد نتائج مطابقة لهذه التصفية."
              : filter === "active"
                ? "لا يوجد لديك وصول فعّال حالياً."
                : filter === "expired"
                  ? "لا يوجد وصول منتهٍ."
                  : "لا يوجد وصول موقوف."}
          </p>
          {narrowed ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setProgramId("");
                setCategoryId("");
                setType(null);
              }}
              className="ma-btn ma-btn--soft min-h-11"
            >
              إزالة التصفية
            </button>
          ) : filter === "active" ? (
            <ButtonLink href={routes.search} variant="primary">
              تصفّح البرامج
            </ButtonLink>
          ) : null}
        </div>
      ) : (
        <ul
          aria-label={selected ? productTypePluralLabel(selected) : "كل البرامج"}
          aria-busy={access.isFetching}
          className={GRID}
        >
          {visible.map((entitlement, index) => {
            const known = entitlement.product_slug ? artwork.get(entitlement.product_slug) : undefined;
            const lms = lmsByEntitlement.get(entitlement.entitlement_id);
            return (
              <li key={entitlement.entitlement_id} className="min-w-0">
                {entitlement.product_type === "consultation" ? (
                  <ConsultationAccessCard
                    entitlement={entitlement}
                    title={known?.title}
                    image={lms?.image ?? known?.image}
                    instructor={known?.instructor ?? lms?.instructor}
                    duration={known?.duration}
                    index={index}
                  />
                ) : (
                  <AccessCard
                    entitlement={entitlement}
                    now={access.dataUpdatedAt}
                    title={known?.title}
                    image={lms?.image ?? known?.image}
                    instructor={known?.instructor ?? lms?.instructor}
                    index={index}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
