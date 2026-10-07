"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { commerceQueries } from "@/lib/api/commerce";
import { cn } from "@/lib/cn";

import { AccessCard } from "./components/order-sections";

const FILTERS = [
  { status: "active", label: "الفعّال" },
  { status: "expired", label: "المنتهي" },
] as const;

type Filter = (typeof FILTERS)[number]["status"];

/** What the student can open, with when access started and when it ends. */
export function AccessPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const access = useQuery({
    ...commerceQueries.entitlements({ status: filter, limit: 100 }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-6">
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

      {access.isPending ? (
        <div role="status" className="grid gap-4 md:grid-cols-2">
          <span className="sr-only">جارٍ التحميل…</span>
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : access.isError ? (
        <div className="ma-alert ma-alert--warning" role="alert">
          <div>
            <p className="ma-alert__title">تعذّر تحميل وصولك</p>
            <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
          </div>
        </div>
      ) : access.data.items.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
          <KeyRound aria-hidden="true" className="size-8 fill-none text-accent" />
          <p className="m-0 text-fg-muted">
            {filter === "active" ? "لا يوجد لديك وصول فعّال حالياً." : "لا يوجد وصول منتهٍ."}
          </p>
          {filter === "active" ? (
            <ButtonLink href={routes.search} variant="primary">
              تصفّح البرامج
            </ButtonLink>
          ) : null}
        </div>
      ) : (
        <div aria-busy={access.isFetching} className="grid gap-4 md:grid-cols-2">
          {access.data.items.map((entitlement) => (
            <AccessCard key={entitlement.entitlement_id} entitlement={entitlement} now={access.dataUpdatedAt} />
          ))}
        </div>
      )}
    </div>
  );
}
