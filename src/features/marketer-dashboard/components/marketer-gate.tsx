"use client";

import { useQuery } from "@tanstack/react-query";
import { Hourglass, Megaphone } from "lucide-react";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import { marketerQueries } from "@/lib/api/marketer";

/**
 * Shows the dashboard only to marketers (`/me/affiliate/profile` answers 403 for everyone else; a
 * marketer is linked to this account on first visit when the emails match). The backend checks every
 * call anyway; this only avoids empty, failing pages.
 */
export function MarketerGate({ children }: { children: ReactNode }) {
  const profile = useQuery(marketerQueries.profile());

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
    if (profile.error instanceof ApiError && profile.error.status === 403) {
      return (
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line bg-surface p-6 md:p-10">
          <Megaphone aria-hidden="true" className="size-8 text-accent" />
          <h1 className="m-0 text-2xl font-bold">هذا الحساب غير مسجّل كمسوّق</h1>
          <p className="m-0 max-w-[60ch] text-fg-muted">
            سجّل الدخول بالبريد الذي قدّمت به طلب الانضمام لبرنامج المسوقين، أو قدّم طلبًا جديدًا وسنراجعه خلال 48 ساعة.
          </p>
          <ButtonLink href={routes.marketers} variant="primary">انضم لبرنامج المسوقين</ButtonLink>
        </div>
      );
    }
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">تعذّر التحميل</p>
          <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
        </div>
      </div>
    );
  }
  if (profile.data.partner.status === "pending") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line bg-surface p-6 md:p-10">
        <Hourglass aria-hidden="true" className="size-8 text-accent" />
        <h1 className="m-0 text-2xl font-bold">طلب انضمامك قيد المراجعة</h1>
        <p className="m-0 max-w-[60ch] text-fg-muted">
          سنرسل لك بريدًا عند الموافقة على <bdi dir="ltr">{profile.data.partner.email}</bdi>، وبعدها تظهر هنا إحصاءاتك وروابطك وأرباحك.
        </p>
      </div>
    );
  }
  if (profile.data.partner.status !== "active") {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">حساب المسوّق غير نشط</p>
          <p className="ma-alert__text">تواصل مع فريق ماستري لمعرفة التفاصيل. يمكنك الاطلاع على بياناتك السابقة بعد إعادة التفعيل.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
