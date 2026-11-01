"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

/** Copy link and share; native share sheet when the browser has one, X otherwise. */
export function ArticleActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Restricted contexts (no clipboard permission) simply keep the button as it was.
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // The visitor closed the share sheet: don't open a second one.
        return;
      }
    }
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="icon-btn"
        onClick={copyLink}
        aria-label={copied ? "تم نسخ الرابط" : "نسخ رابط المقال"}
        title={copied ? "تم النسخ" : "نسخ الرابط"}
      >
        {copied ? (
          <Check aria-hidden="true" style={{ color: "var(--crimson)" }} />
        ) : (
          <Link2 aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={share}
        aria-label="مشاركة المقال"
        title="مشاركة"
      >
        <Share2 aria-hidden="true" />
      </button>
    </div>
  );
}
