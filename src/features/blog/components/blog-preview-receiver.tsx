"use client";

import { useState } from "react";

import { useStudioChannel } from "@/features/preview/use-studio-channel";

import { BlogPostPage } from "../blog-post-page";
import { previewPostVM } from "../model/mappers";
import type { BlogDocument, BlogPostVM } from "../model/types";

type BlogRenderMessage = {
  source: "mastery-studio";
  type: "render";
  kind?: string;
  base?: unknown;
  document?: BlogDocument;
};

/**
 * The iframe the Blog Studio frames: announce `ready` (done by useStudioChannel) and render every
 * `{kind:"blog-post"}` render message from its payload. The post page itself fetches nothing here.
 */
export function BlogPreviewReceiver() {
  const [post, setPost] = useState<BlogPostVM | null>(null);

  useStudioChannel((message) => {
    if (message.type === "render") {
      const data = message as unknown as BlogRenderMessage;
      // Product previews share this endpoint's handshake; only blog renders belong here.
      if (data.kind && data.kind !== "blog-post") return;
      if (!data.document) return;
      setPost(previewPostVM(data.base, data.document));
      return;
    }

    if (message.type === "scroll") {
      const id = message.blockId || message.targetId;
      if (typeof id === "string" && id) {
        const element = document.getElementById(id) || document.querySelector(`[data-id="${id}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  if (post) {
    return <BlogPostPage post={post} preview />;
  }

  return (
    <div className="grid min-h-svh place-items-center p-8 text-center" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <span className="spinner" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="type-body-16 m-0" style={{ color: "var(--fg)", fontWeight: 600 }}>
            جارٍ تجهيز المعاينة الحية…
          </p>
          <p className="type-caption-13 m-0" style={{ color: "var(--muted)" }}>
            في انتظار بيانات مقال الاستوديو من لوحة التحكم
          </p>
        </div>
      </div>
    </div>
  );
}
