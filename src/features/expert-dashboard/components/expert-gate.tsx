"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { consultationQueries } from "@/lib/api/consultations";

/**
 * Shows the dashboard only to customers linked to a consultant (`/experts/me` answers 403 for
 * everyone else). The backend checks every call anyway; this only avoids empty, failing pages.
 */
export function ExpertGate({ children }: { children: ReactNode }) {
  const profile = useQuery(consultationQueries.expert());

  if (profile.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (profile.isError) {
    const forbidden = profile.error instanceof ApiError && profile.error.status === 403;
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">{forbidden ? "هذا الحساب غير مرتبط بخبير" : "تعذّر التحميل"}</p>
          <p className="ma-alert__text">
            {forbidden ? "تواصل مع فريق ماستري لتفعيل حساب الخبير لهذا البريد." : "تحقّق من اتصالك ثم حدّث الصفحة."}
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
