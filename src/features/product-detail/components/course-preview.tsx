"use client";

import { useEffect, useMemo, useState } from "react";

import type { CatalogProductResponse } from "@/lib/api/catalog";

import type { IntroVideoVM } from "../model/types";

import { mapB2CProductDetail } from "../model/mappers-b2c";
import type { StudioDocument } from "../model/studio-content";
import { ProductDetailView } from "./product-detail-view";

/**
 * The real course/diploma page rendered from fresh B2C data for the admin Studio's live preview. The
 * unsaved Studio document (and README) is laid over it in the browser, so typing shows at once without
 * a reload; the product itself is refetched when `revision` changes.
 */
export function CoursePreview({
  slug,
  id,
  revision,
  document,
  readme,
}: {
  slug: string;
  id: number;
  revision: number;
  document: StudioDocument;
  readme: string | null;
}) {
  const [dto, setDto] = useState<CatalogProductResponse | null>(null);
  const [introVideo, setIntroVideo] = useState<IntroVideoVM | null>(null);
  const typedVideoId = document.meta?.intro_video_id?.trim() ?? "";
  // The video id is checked against Bunny on the server, so wait until the field stops changing.
  const [videoId, setVideoId] = useState(typedVideoId);
  useEffect(() => {
    const timer = window.setTimeout(() => setVideoId(typedVideoId), 500);
    return () => window.clearTimeout(timer);
  }, [typedVideoId]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/preview/product?slug=${encodeURIComponent(slug)}&video=${encodeURIComponent(videoId)}&v=${revision}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`لا تتوفر بيانات المنتج (${response.status})`);
        return (await response.json()) as { dto: CatalogProductResponse; introVideo: IntroVideoVM | null };
      })
      .then((body) => {
        if (!cancelled) {
          setDto(body.dto);
          setIntroVideo(body.introVideo);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "تعذّر تحميل المنتج");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, revision, videoId]);

  // Mapped in the browser on every change, so the editor's text shows as it is typed.
  const data = useMemo(() => {
    if (!dto) return null;
    const mapped = mapB2CProductDetail(dto, id, document);
    return { ...mapped, product: { ...mapped.product, introVideo, ...(typeof readme === "string" ? { readme } : {}) } };
  }, [dto, id, document, introVideo, readme]);

  if (error && !data) return <div dir="rtl" style={{ padding: 24 }}>{error}</div>;
  if (!data) return <div dir="rtl" style={{ padding: 24 }}>جارٍ تحميل الصفحة…</div>;
  return <ProductDetailView data={data} shareProps={null} preview={true} />;
}
