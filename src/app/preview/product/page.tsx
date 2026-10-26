"use client";

import { useRef, useState } from "react";

import { CoursePreview } from "@/features/product-detail/components/course-preview";
import { StudioPreviewKind, type PreviewKind } from "@/features/product-detail/components/studio-preview-kind";
import { PackagePreview } from "@/features/package-detail/components/package-preview";
import { BundlePreview } from "@/features/bundle-detail/components/bundle-preview";
import { ConsultationPreview } from "@/features/consultation-detail/components/consultation-preview";
import type { StudioDocument } from "@/features/product-detail/model/studio-content";
import { useStudioChannel } from "@/features/preview/use-studio-channel";

type StudioRenderMessage = {
  source: "mastery-studio";
  type: "render";
  kind: PreviewKind;
  base: unknown;
  document: StudioDocument;
  /** README being edited in the Studio; overrides the saved one. `null` keeps the saved README. */
  readme?: string | null;
};

type KindPreview = { kind: PreviewKind; base: unknown; document: StudioDocument; readme: string | null };

/** The numeric id of a course/diploma preview base: B2C slugs end in it (`course-50`), legacy payloads carry `course.id`. */
function courseIdOf(base: unknown): number | null {
  const record = (base ?? {}) as { slug?: unknown; course?: { id?: unknown } };
  const fromSlug = typeof record.slug === "string" ? record.slug.match(/(\d+)$/)?.[1] : undefined;
  const id = fromSlug ? Number(fromSlug) : Number(record.course?.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** The legacy id of a consultation preview base (`consultation-21`); null for B2C-native consultations. */
function consultationIdOf(base: unknown): number | null {
  const slug = (base ?? {}) as { slug?: unknown };
  const match = typeof slug.slug === "string" ? slug.slug.match(/^consultation-(\d+)$/) : null;
  return match ? Number(match[1]) : null;
}

export default function ProductPreviewPage() {
  const [kindData, setKindData] = useState<KindPreview | null>(null);
  // Bumped on every studio change so the package preview refetches the real page data in place.
  const [revision, setRevision] = useState(0);
  // The Studio sends the whole page on every keystroke. Server data is refetched only when its own `base`
  // changes (a package member added, say); the document and README are applied in the browser.
  const lastBase = useRef<string | null>(null);
  const [readme, setReadme] = useState<string | null>(null);

  useStudioChannel((message) => {
    if (message.type === "render") {
      const msg = message as unknown as StudioRenderMessage;
      if (!msg.document) return;

      const baseKey = JSON.stringify(msg.base ?? null);
      if (baseKey !== lastBase.current) {
        lastBase.current = baseKey;
        setRevision((value) => value + 1);
      }
      setReadme(typeof msg.readme === "string" ? msg.readme : null);

      setKindData({ kind: msg.kind, base: msg.base, document: msg.document, readme: msg.readme ?? null });
    }

    if (message.type === "scroll") {
      const id = message.blockId || message.targetId;
      if (typeof id === "string" && id) {
        const el = document.getElementById(id) || document.querySelector(`[data-id="${id}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  if (kindData) {
    const base = kindData.base as Record<string, unknown> | null;
    const courseId = kindData.kind === "course" || kindData.kind === "diploma" ? courseIdOf(kindData.base) : null;
    if (courseId !== null && (kindData.kind === "course" || kindData.kind === "diploma")) {
      return (
        <CoursePreview
          slug={`${kindData.kind}-${courseId}`}
          id={courseId}
          revision={revision}
          document={kindData.document}
          readme={readme}
        />
      );
    }
    const packageSlug = kindData.kind === "package" && typeof base?.slug === "string" ? base.slug : null;
    if (packageSlug) {
      return <PackagePreview slug={packageSlug} revision={revision} document={kindData.document} readme={readme} />;
    }
    if (kindData.kind === "bundle") {
      return <BundlePreview base={kindData.base} revision={revision} document={kindData.document} readme={readme} />;
    }
    const generic = <StudioPreviewKind kind={kindData.kind} base={kindData.base} document={kindData.document} readme={readme} />;
    const consultationId = kindData.kind === "consultation" ? consultationIdOf(kindData.base) : null;
    if (consultationId !== null) {
      return (
        <ConsultationPreview
          id={consultationId}
          revision={revision}
          document={kindData.document}
          readme={readme}
          fallback={generic}
        />
      );
    }
    return generic;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface p-8 text-center text-fg-muted" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <div className="size-9 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-fg">جارٍ تجهيز المعاينة الحية…</p>
          <p className="text-sm text-fg-muted">في انتظار بيانات الاستوديو من لوحة التحكم</p>
        </div>
      </div>
    </div>
  );
}
