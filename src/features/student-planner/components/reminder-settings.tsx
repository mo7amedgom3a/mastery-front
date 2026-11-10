"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { useId } from "react";

import {
  plannerKeys,
  plannerQueries,
  updatePlannerSettings,
  type PlannerSettings,
  type UpdatePlannerSettingsRequest,
} from "@/lib/api/planner";

import { browserTimezone } from "../model/calendar";

/** Optional emails: per-item reminders (master switch) and a morning "your plan today" digest. */
export function ReminderSettings() {
  const queryClient = useQueryClient();
  const timeId = useId();
  const settings = useQuery(plannerQueries.settings());
  const save = useMutation({
    mutationFn: (changes: UpdatePlannerSettingsRequest) => updatePlannerSettings(changes),
    onMutate: (changes) => {
      const previous = queryClient.getQueryData<PlannerSettings>(plannerKeys.settings());
      if (previous)
        queryClient.setQueryData(plannerKeys.settings(), {
          ...previous,
          ...changes,
        });
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) queryClient.setQueryData(plannerKeys.settings(), context.previous);
    },
    onSuccess: (data) => queryClient.setQueryData(plannerKeys.settings(), data),
  });

  const data = settings.data;
  // The digest goes out in the student's own timezone; keep it in step with the browser.
  const withZone = (changes: UpdatePlannerSettingsRequest) => save.mutate({ ...changes, timezone_name: browserTimezone() });

  return (
    <section aria-labelledby="planner-reminders-title" className="flex flex-col gap-3 rounded-panel border border-line p-4">
      <h2 id="planner-reminders-title" className="m-0 flex items-center gap-2 text-base font-bold">
        <BellRing aria-hidden="true" className="size-4 fill-none text-accent" />
        تذكيرات البريد
      </h2>
      {settings.isPending ? (
        <p role="status" className="m-0 text-sm text-fg-muted">
          جارٍ التحميل…
        </p>
      ) : settings.isError || !data ? (
        <p className="m-0 text-sm text-fg-muted">تعذّر تحميل الإعدادات.</p>
      ) : (
        <>
          <label className="ma-check items-start">
            <input type="checkbox" checked={data.reminders_enabled} onChange={(e) => withZone({ reminders_enabled: e.target.checked })} />
            <span className="flex flex-col">
              <span className="font-medium">تذكير قبل مواعيدي</span>
              <span className="text-sm text-fg-muted">للعناصر التي تختار لها تذكيراً فقط.</span>
            </span>
          </label>
          <label className="ma-check items-start">
            <input
              type="checkbox"
              checked={data.daily_digest_enabled}
              onChange={(e) => withZone({ daily_digest_enabled: e.target.checked })}
            />
            <span className="flex flex-col">
              <span className="font-medium">ملخّص يومي بخطتي</span>
              <span className="text-sm text-fg-muted">رسالة صباحية بما ينتظرك اليوم، ولا تصل في الأيام الفارغة.</span>
            </span>
          </label>
          {data.daily_digest_enabled ? (
            <div className="ma-field ps-8">
              <label htmlFor={timeId} className="ma-label">
                وقت الملخّص
              </label>
              <input
                id={timeId}
                type="time"
                className="ma-input max-w-40"
                value={data.digest_local_time.slice(0, 5)}
                onChange={(e) => e.target.value && withZone({ digest_local_time: `${e.target.value}:00` })}
              />
            </div>
          ) : null}
          {save.isError ? (
            <p role="alert" className="m-0 text-sm font-medium">
              تعذّر حفظ الإعداد.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
