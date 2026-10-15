"use client";

import { useEffect, useState } from "react";

import { ProductDetailView } from "@/features/product-detail/components/product-detail-view";
import { mapProductDetail } from "@/features/product-detail/model/mappers";
import type { StudioDocument } from "@/features/product-detail/model/studio-content";
import type { ProductDetailData } from "@/features/product-detail/model/types";
import type { LegacyCourseResponse } from "@/lib/api/legacy";

type StudioRenderMessage = {
  source: "mastery-studio";
  type: "render";
  kind: "course" | "diploma" | "package";
  base: LegacyCourseResponse | null;
  document: StudioDocument;
};

export default function ProductPreviewPage() {
  const [data, setData] = useState<ProductDetailData | null>(null);

  useEffect(() => {
    // Notify parent frame (Admin Studio) that preview iframe is ready
    const sendReady = () => {
      window.parent?.postMessage({ source: "mastery-preview", type: "ready" }, "*");
    };

    sendReady();
    const interval = setInterval(sendReady, 600);
    const timeout = setTimeout(() => clearInterval(interval), 6000);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.source !== "mastery-studio") return;

      if (event.data.type === "render") {
        clearInterval(interval);
        const msg = event.data as StudioRenderMessage;
        if (!msg.base) return;

        try {
          const product = mapProductDetail(msg.base, msg.document);
          setData({
            product,
            related: [],
            recommended: [],
          });
        } catch (error) {
          console.error("Failed to map studio preview product:", error);
        }
      }

      if (event.data.type === "scroll") {
        const id = event.data.blockId || event.data.targetId;
        if (id) {
          const el = document.getElementById(id) || document.querySelector(`[data-id="${id}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  if (!data) {
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

  return <ProductDetailView data={data} shareProps={null} preview={true} />;
}
