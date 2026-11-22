"use client";

import { useState } from "react";

import { BlocksLab } from "@/features/labs/components/blocks/blocks-lab";
import { SchemaLab } from "@/features/labs/components/schema/schema-lab";
import type { LabRuntime, LiveLabRuntime } from "@/features/labs/api";
import { useStudioChannel } from "@/features/preview/use-studio-channel";

type RenderMessage = {
  source: "mastery-studio";
  type: "render";
  /** Schema-engine draft. */
  lab?: LabRuntime;
  /** Blocks-engine draft (runtime shape) and the stage (page id) to open. */
  blocks?: LiveLabRuntime;
  page_id?: string | null;
};

type Draft =
  | { kind: "schema"; lab: LabRuntime }
  | { kind: "blocks"; runtime: LiveLabRuntime; pageId: string | null };

/**
 * The admin Studio frames this page and posts the draft lab with
 * `{ source: "mastery-studio", type: "render", lab }` (schema engine) or
 * `{ source: "mastery-studio", type: "render", blocks, page_id }` (blocks engine, one stage).
 * It renders the learner view without writing sessions, attempts or analytics.
 */
export default function LabPreviewPage() {
  const [draft, setDraft] = useState<Draft | null>(null);

  useStudioChannel((message) => {
    const data = message as unknown as RenderMessage;
    if (data.type !== "render") return;
    if (data.blocks) setDraft({ kind: "blocks", runtime: data.blocks, pageId: data.page_id ?? null });
    else if (data.lab) setDraft({ kind: "schema", lab: data.lab });
  });

  if (!draft) {
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

  if (draft.kind === "blocks") {
    return (
      <div className="bg-surface" dir="rtl">
        {/* A new stage remounts the runner so it opens on that page; edits to the same stage keep its state. */}
        <BlocksLab key={draft.pageId ?? "first"} runtime={draft.runtime} studio={{ pageId: draft.pageId }} />
      </div>
    );
  }

  return (
    <div className="bg-surface">
      <SchemaLab runtime={draft.lab} preview />
    </div>
  );
}
