"use client";

import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { TypeFilter } from "@/features/student-dashboard/components/type-filter";
import { countByType, productTypePluralLabel } from "@/features/student-dashboard/model/products";
import { useCatalogArtwork } from "@/features/student-dashboard/model/use-artwork";
import { commerceQueries } from "@/lib/api/commerce";
import { cn } from "@/lib/cn";

import { AccessCard } from "./components/order-sections";

/** "Inactive" groups what support paused or ended (suspended and revoked access). */
const FILTERS = [
  { status: "active", label: "الفعّال", statuses: ["active"] },
  { status: "expired", label: "المنتهي", statuses: ["expired"] },
  { status: "inactive", label: "الموقوف", statuses: ["suspended", "revoked"] },
] as const;

type Filter = (typeof FILTERS)[number]["status"];

/** Sized by the content column, not the window: the sidebar takes a share of wide screens. */
const GRID = "m-0 grid list-none gap-5 p-0 @xl:grid-cols-2 @4xl:grid-cols-3";

/**
 * What the student can open, with when access started and when it ends. Filtered by status, and by
 * product type through `?type=` (so a link from the dashboard home lands already filtered).
 */
export function AccessPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || null;
  const setType = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("type", next);
    else params.delete("type");
    const query = params.toString();
    // `history.replaceState` updates the query string without a server round trip.
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  };

  const statuses = FILTERS.find((option) => option.status === filter)?.statuses ?? ["active"];
  const pages = useQueries({
    queries: statuses.map((status) => ({
      ...commerceQueries.entitlements({ status, limit: 100 }),
      placeholderData: keepPreviousData,
    })),
  });
  const access = {
    isPending: pages.some((page) => page.isPending),
    isError: pages.some((page) => page.isError),
    isFetching: pages.some((page) => page.isFetching),
    dataUpdatedAt: Math.max(0, ...pages.map((page) => page.dataUpdatedAt)),
  };
  const items = pages.flatMap((page) => page.data?.items ?? []);
  const artwork = useCatalogArtwork(items.flatMap((item) => (item.product_slug ? [item.product_slug] : [])));
  const counts = countByType(items, (item) => item.product_type ?? "");
  // A type that isn't in this list (e.g. after switching status) filters nothing out of sight.
  const selected = type && counts.some((count) => count.type === type) ? type : null;
  const visible = selected ? items.filter((item) => item.product_type === selected) : items;

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
        <TypeFilter counts={counts} total={items.length} value={selected} onChange={setType} />
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
            {filter === "active" ? "لا يوجد لديك وصول فعّال حالياً." : filter === "expired" ? "لا يوجد وصول منتهٍ." : "لا يوجد وصول موقوف."}
          </p>
          {filter === "active" ? (
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
            return (
              <li key={entitlement.entitlement_id} className="min-w-0">
                <AccessCard
                  entitlement={entitlement}
                  now={access.dataUpdatedAt}
                  title={known?.title}
                  image={known?.image}
                  instructor={known?.instructor}
                  index={index}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
