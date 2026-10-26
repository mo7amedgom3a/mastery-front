"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { studioSections, type StudioDocument } from "@/features/product-detail/model/studio-content";

import { ConsultationDetailView } from "../consultation-detail-view";
import type { ConsultationDetailData } from "../model/types";

/**
 * The real consultation page for the admin Studio's live preview: the consultation is fetched once per
 * `revision` and the unsaved Studio page (blocks, banner, README) is laid over it in the browser, so typing
 * shows at once. `fallback` renders while it loads or when the consultation can't be read (a draft, say).
 */
export function ConsultationPreview({
  id,
  revision,
  document,
  readme,
  fallback,
}: {
  id: number;
  revision: number;
  document: StudioDocument;
  readme: string | null;
  fallback: ReactNode;
}) {
  const [base, setBase] = useState<ConsultationDetailData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/preview/consultation?id=${id}&v=${revision}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as { data: ConsultationDetailData };
      })
      .then((body) => {
        if (!cancelled) {
          setBase(body.data);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, revision]);

  const data = useMemo(() => {
    if (!base) return null;
    const blocks = document.blocks ?? [];
    const banner = document.meta?.banner?.url
      ? { url: document.meta.banner.url, alt: document.meta.banner.alt ?? "", headline: document.meta.banner.headline ?? "" }
      : null;
    return {
      ...base,
      consultation: {
        ...base.consultation,
        content: blocks.length > 0 ? studioSections(blocks) : null,
        banner,
        ...(typeof readme === "string" ? { readme } : {}),
      },
    };
  }, [base, document, readme]);

  if (!data || failed) return <>{fallback}</>;
  return <ConsultationDetailView data={data} preview />;
}
