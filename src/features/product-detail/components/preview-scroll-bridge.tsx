"use client";

import { useEffect } from "react";

/**
 * The admin Course Studio preview renders the product page inside an iframe and asks it to scroll
 * to the block being edited. That listener is the only client-side behaviour the product page
 * wrapper needs; keeping it in this small island lets `ProductDetailView` stay a server component
 * (previously the whole page — header, footer, content blocks — was in the client bundle).
 */
export function PreviewScrollBridge() {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.source !== "mastery-studio" || event.data?.type !== "scroll" || !event.data?.blockId) {
        return;
      }
      const id = String(event.data.blockId);
      const target =
        document.querySelector(`[data-block-id="${id}"]`) ||
        document.getElementById(`s-${id}`) ||
        document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
