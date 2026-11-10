"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { insightsKeys, insightsQueries, refreshInsightsSummary, type InsightsRange } from "@/lib/api/insights";
import { formatDateTime } from "@/lib/format";

const SECTIONS = [
  { key: "strengths", title: "نقاط قوتك" },
  { key: "habits", title: "عاداتك في التعلّم" },
  { key: "next_steps", title: "خطوتك التالية" },
] as const;

/** The AI-written narrative. Hidden entirely when the service could not write one. */
export function SummaryCard({ range }: { range: InsightsRange }) {
  const queryClient = useQueryClient();
  const summary = useQuery(insightsQueries.summary(range));
  const refresh = useMutation({
    mutationFn: () => refreshInsightsSummary(range),
    onSuccess: (data) => queryClient.setQueryData(insightsKeys.summary(range), data),
  });

  if (summary.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-panel border border-line bg-surface-alt p-5 md:p-6">
        <span className="sr-only">جارٍ كتابة ملخصك…</span>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20" />
      </div>
    );
  }
  const data = summary.data?.summary;
  if (summary.isError || !data) return null;

  return (
    <section
      aria-labelledby="insights-summary-title"
      className="flex flex-col gap-5 rounded-panel border border-line-strong bg-surface-alt p-5 md:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-lilac text-ink">
            <Sparkles className="size-5 fill-none" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-[13px] text-fg-muted">ملخصك الشخصي</p>
            <h2 id="insights-summary-title" className="m-0 text-lg leading-8 font-bold md:text-xl">
              {data.headline}
            </h2>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          aria-label="حدّث الملخص"
        >
          <RefreshCw className={refresh.isPending ? "size-4 animate-spin fill-none" : "size-4 fill-none"} aria-hidden="true" />
          تحديث
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) =>
          data[section.key].length ? (
            <div key={section.key} className="flex flex-col gap-2 rounded-photo border border-line bg-surface p-4">
              <h3 className="m-0 text-sm font-bold">{section.title}</h3>
              <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-sm leading-6 text-fg-muted">
                {data[section.key].map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null,
        )}
      </div>

      <p className="m-0 text-xs text-fg-muted">
        مكتوب آلياً من أرقام نشاطك فقط · آخر تحديث {formatDateTime(data.generated_at)}
        {refresh.isError ? " · تعذّر التحديث الآن، حاول لاحقاً." : null}
      </p>
    </section>
  );
}
