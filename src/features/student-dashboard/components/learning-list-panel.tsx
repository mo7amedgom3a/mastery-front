import { BookOpen, GraduationCap, MessagesSquare, Package, type LucideIcon } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import type { LearningProgram } from "../model/learning";
import { startsWithLatin } from "../model/products";
import { ContinueLearningButton } from "./continue-learning-button";
import { DashboardPanel } from "./dashboard-panel";
import { LearningProgress } from "./learning-progress";

const TYPE_ICONS: Record<string, LucideIcon> = {
  course: BookOpen,
  diploma: GraduationCap,
  package: Package,
  consultation: MessagesSquare,
};

type LearningListPanelProps = {
  programs: readonly LearningProgram[];
  source?: "lms" | "snapshot";
  pending?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

/** The demo's compact «قيد التعلّم» rows, fed by live LMS courses. */
export function LearningListPanel({ programs, source = "lms", pending, error, onRetry }: LearningListPanelProps) {
  return (
    <DashboardPanel
      id="learning-list-title"
      title="قيد التعلّم"
      subtitle={source === "snapshot" ? "آخر تقدّم محفوظ من حسابك" : "مرتّبة حسب آخر نشاط"}
      action={
        <AppLink href={routes.studentAccess} className="ma-btn ma-btn--ghost ma-btn--sm">
          كل البرامج
        </AppLink>
      }
    >
      {pending ? (
        <div role="status" className="flex flex-col gap-3">
          <span className="sr-only">جارٍ تحميل برامجك…</span>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3">
          <p className="m-0 text-fg-muted">تعذّر تحميل برامجك الآن.</p>
          {onRetry ? (
            <Button variant="soft" size="sm" onClick={onRetry}>
              إعادة المحاولة
            </Button>
          ) : null}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="m-0 text-fg-muted">لا يوجد برنامج قيد التعلّم حالياً.</p>
          <ButtonLink href={routes.search} variant="soft" size="sm">
            تصفّح البرامج
          </ButtonLink>
        </div>
      ) : (
        <div className="@container">
          <ul className="m-0 flex list-none flex-col p-0">
            {programs.map((program, index) => {
              const latin = startsWithLatin(program.title);
              const Icon = TYPE_ICONS[program.typeLabel] ?? BookOpen;

              return (
                <li
                  key={program.id}
                  className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0 @2xl:grid-cols-[48px_minmax(0,1.4fr)_minmax(140px,1fr)_auto]"
                >
                  {program.image ? (
                    <Image
                      src={program.image}
                      alt=""
                      width={48}
                      height={48}
                      sizes="48px"
                      className="size-12 rounded-photo object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={cn("grid size-12 place-items-center rounded-photo text-ink", brandBg[brandColorAt(index)])}
                    >
                      <Icon className="size-5 fill-none" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3
                      dir={latin ? "ltr" : "auto"}
                      className={cn("m-0 truncate leading-6 font-semibold", latin && "text-right")}
                    >
                      {program.title}
                    </h3>
                    <p className="m-0 text-[13px] leading-5 text-fg-muted">
                      {program.typeLabel}
                      {program.instructor ? (
                        <>
                          ، <bdi>{program.instructor}</bdi>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="col-span-2 min-w-0 @2xl:col-auto">
                    <LearningProgress percent={program.progress} />
                  </div>
                  <div className="col-span-2 @2xl:col-auto">
                    {program.detailsHref ? (
                      <ButtonLink href={program.detailsHref} variant="soft" size="sm">
                        عرض التفاصيل
                      </ButtonLink>
                    ) : program.entitlementId ? (
                      <ContinueLearningButton
                        entitlementId={program.entitlementId}
                        title={program.title}
                        variant="soft"
                        size="sm"
                        block={false}
                        label={program.progress > 0 ? "كمّل" : "ابدأ"}
                      />
                    ) : (
                      <ButtonLink href={routes.studentAccess} variant="soft" size="sm">
                        عرض
                      </ButtonLink>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </DashboardPanel>
  );
}
