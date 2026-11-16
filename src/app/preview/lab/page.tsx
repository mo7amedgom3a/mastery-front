"use client";

import { useState } from "react";

import { SchemaLab } from "@/features/labs/components/schema/schema-lab";
import type { LabRuntime } from "@/features/labs/api";
import { useStudioChannel } from "@/features/preview/use-studio-channel";

type RenderMessage = {
  source: "mastery-studio";
  type: "render";
  lab?: LabRuntime;
};

/**
 * The admin Studio frames this page and sends the draft lab definition with
 * `{ source: "mastery-studio", type: "render", lab }`. It renders the schema-driven runtime
 * without writing attempts or analytics.
 */
export default function LabPreviewPage() {
  const [runtime, setRuntime] = useState<LabRuntime | null>(null);

  useStudioChannel((message) => {
    const data = message as unknown as RenderMessage;
    if (data.type === "render" && data.lab) setRuntime(data.lab);
  });

  if (!runtime) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface p-8 text-center text-fg-muted" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="size-9 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-fg">جارٍ تجهيز معاينة المختبر…</p>
            <p className="text-sm text-fg-muted">في انتظار تعريف المختبر من لوحة التحكم</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface">
      <SchemaLab runtime={runtime} preview />
    </div>
  );
}
