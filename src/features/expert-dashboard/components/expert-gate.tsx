"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { consultationQueries } from "@/lib/api/consultations";

/**
 * Shows the dashboard only to customers linked to a consultant. It asks the quiet capability
 * endpoint (`/experts/me/capability`, 200 for everyone) rather than probing `/experts/me`, whose
 * 403 for non-experts would surface as a console error. The backend checks every call anyway.
 */
export function ExpertGate({ children }: { children: ReactNode }) {
  const capability = useQuery(consultationQueries.expertCapability());

  if (capability.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (capability.isError) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">تعذّر التحميل</p>
          <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
        </div>
      </div>
    );
  }
  if (!capability.data.is_expert) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">هذا الحساب غير مرتبط بخبير</p>
          <p className="ma-alert__text">تواصل مع فريق ماستري لتفعيل حساب الخبير لهذا البريد.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
