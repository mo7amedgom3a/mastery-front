"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { SOURCE_META, dayKey, isRange, upcomingWindow } from "@/features/student-planner/model/calendar";
import { plannerQueries } from "@/lib/api/planner";
import { cn } from "@/lib/cn";
import { formatLongDate, formatTimeOfDay } from "@/lib/format";

/** The next 7 days of the learning calendar, with a way into the full planner. */
export function UpcomingPlanPanel() {
  // Fixed at mount so the query key stays stable while the page is open.
  const [{ range, now }] = useState(() => ({
    range: upcomingWindow(7),
    now: Date.now(),
  }));
  const calendar = useQuery(plannerQueries.calendar(range));

  if (calendar.isPending) return <Skeleton className="h-40" />;
  if (calendar.isError) return <p className="m-0 text-sm text-fg-muted">تعذّر تحميل خطتك حالياً.</p>;

  const events = calendar.data.events.filter(
    (e) => !isRange(e) && !(e.source === "todo" && e.is_done) && new Date(e.ends_at ?? e.starts_at).getTime() >= now - 3_600_000,
  );
  const openTodos = calendar.data.events.filter((e) => e.source === "todo" && !e.is_done).length;
  const upcoming = events.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {upcoming.length === 0 ? (
        <p className="m-0 text-fg-muted">لا شيء في الأيام السبعة القادمة. خطّط لوقت تعلّم ثابت كل أسبوع ليسهل عليك الاستمرار.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {upcoming.map((event) => {
            const meta = SOURCE_META[event.source];
            const start = new Date(event.starts_at);
            return (
              <li key={event.id} className="flex items-center gap-3 rounded-control border border-line px-3 py-2">
                <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", meta.swatch)} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{event.title}</span>
                  <span className="text-xs text-fg-muted">
                    {meta.label} · {formatLongDate(start)}
                    {event.all_day ? "" : ` · ${formatTimeOfDay(start)}`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-fg-muted">{openTodos ? `${openTodos} مهام مفتوحة هذا الأسبوع` : "لا مهام مفتوحة هذا الأسبوع"}</p>
        <ButtonLink href={routes.studentPlanner(dayKey(new Date()))} variant="soft" size="sm">
          افتح التقويم
          <ArrowLeft aria-hidden="true" className="size-4 fill-none" />
        </ButtonLink>
      </div>
    </div>
  );
}
