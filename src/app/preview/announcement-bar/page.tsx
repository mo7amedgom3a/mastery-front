"use client";

import { useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { BarView } from "@/features/announcements/components/announcement-bar";
import { AnnouncementsProvider } from "@/features/announcements/components/announcements-context";
import { useStudioChannel } from "@/features/preview/use-studio-channel";
import type { AnnouncementBar } from "@/lib/api/announcements";

/**
 * Admin live preview of an announcement bar (framed by the admin bar editor). The admin posts the bar in the
 * public API shape — saved data with unsaved edits on top — and this renders it above the real header.
 */
export default function AnnouncementBarPreviewPage() {
  const [bar, setBar] = useState<AnnouncementBar | null>(null);

  useStudioChannel((message) => {
    if (message.type !== "render" || message.kind !== "announcement-bar" || !message.bar) return;
    setBar(message.bar as AnnouncementBar);
  });

  return (
    // An empty provider: the live bars must not show above the previewed one.
    <AnnouncementsProvider bars={[]}>
      {bar && bar.items.length > 0 ? (
        <BarView
          key={JSON.stringify(bar.style) + bar.layout}
          bar={bar}
          preview
          onClose={bar.dismissible ? () => undefined : undefined}
        />
      ) : (
        <div className="grid min-h-11 place-items-center bg-surface-alt px-4 text-center text-sm text-fg-muted">
          {bar ? "أضف عنصراً واحداً على الأقل لعرض الشريط" : "جارٍ تجهيز المعاينة الحية…"}
        </div>
      )}
      <SiteHeader />
      <div className="ma-container py-10 text-fg-muted" aria-hidden="true">
        <div className="h-48 rounded-panel bg-surface-alt" />
      </div>
    </AnnouncementsProvider>
  );
}
