"use client";

import { useEffect, useMemo, useState } from "react";

import { PackageDetailPage } from "../package-detail-page";
import type { StudioDocument } from "@/features/product-detail/model/studio-content";
import type { QrMatrix } from "@/features/product-detail/model/qr";
import type { CatalogProductResponse } from "@/lib/api/catalog";

import { mapB2CPackageDetail } from "../model/mappers-b2c";

/**
 * The real package page (`PackageDetailPage`) for the admin Studio's live preview. The B2C product is
 * fetched fresh only when `revision` changes (a package member was added or removed, say); the Studio's
 * unsaved document and README are laid over it in the browser, so every keystroke shows at once.
 */
export function PackagePreview({
  slug,
  revision,
  document,
  readme,
}: {
  slug: string;
  revision: number;
  document: StudioDocument;
  readme: string | null;
}) {
  const [payload, setPayload] = useState<{ dto: CatalogProductResponse; qr: QrMatrix } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/preview/package?slug=${encodeURIComponent(slug)}&v=${revision}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`لا تتوفر بيانات الحزمة (${response.status})`);
        }
        return (await response.json()) as { dto: CatalogProductResponse; qr: QrMatrix };
      })
      .then((body) => {
        if (!cancelled) {
          setPayload(body);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "تعذّر تحميل الحزمة");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, revision]);

  const data = useMemo(() => {
    if (!payload) return null;
    const id = Number(slug.match(/(\d+)\s*$/)?.[1]);
    const mapped = mapB2CPackageDetail(payload.dto, id, document);
    return typeof readme === "string" ? { ...mapped, product: { ...mapped.product, readme } } : mapped;
  }, [payload, slug, document, readme]);

  if (error && !data) {
    return <div dir="rtl" style={{ padding: 24, color: "var(--fg-muted, #666)" }}>{error}</div>;
  }
  if (!payload || !data) {
    return <div dir="rtl" style={{ padding: 24, color: "var(--fg-muted, #666)" }}>جارٍ تحميل الحزمة…</div>;
  }
  return <PackageDetailPage data={data} qrMatrix={payload.qr} />;
}
