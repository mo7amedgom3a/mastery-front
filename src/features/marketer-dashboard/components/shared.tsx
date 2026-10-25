"use client";

import { Check, Copy, Share2, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/** A KPI tile: label, value and an optional note. */
export function StatTile({
  label,
  value,
  note,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "accent" | "green";
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-2 rounded-panel border bg-surface p-4",
        tone === "accent" ? "border-accent/30 bg-accent/5" : tone === "green" ? "border-green/30 bg-green/5" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-muted sm:text-sm">{label}</span>
        {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0 text-fg-muted" /> : null}
      </div>
      <div>
        <strong className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</strong>
        {note ? <p className="m-0 mt-0.5 text-xs text-fg-muted">{note}</p> : null}
      </div>
    </div>
  );
}

/** Previous / next for an offset-paged list. */
export function Pager({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);
  return (
    <nav aria-label="الصفحات" className="flex items-center justify-between gap-3 text-sm">
      <span className="text-fg-muted">صفحة {page} من {pages} · {total} نتيجة</span>
      <span className="flex gap-2">
        <button type="button" className="ma-btn ma-btn--soft text-sm" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          السابق
        </button>
        <button type="button" className="ma-btn ma-btn--soft text-sm" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>
          التالي
        </button>
      </span>
    </nav>
  );
}

export const COMMISSION_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "بانتظار الاعتماد", tone: "ma-tag--sky" },
  approved: { label: "معتمدة — في رصيدك", tone: "ma-tag--green" },
  paid: { label: "صُرفت لك", tone: "ma-tag--green" },
  rejected: { label: "مرفوضة", tone: "ma-tag--soft" },
  refunded: { label: "مستردة", tone: "ma-tag--soft" },
};

export const SALE_STATUS: Record<string, { label: string; tone: string }> = {
  refunded: { label: "مستردة", tone: "ma-tag--soft" },
  refund_pending: { label: "مستردة", tone: "ma-tag--soft" },
  partially_refunded: { label: "استرداد جزئي", tone: "ma-tag--pink" },
  skipped: { label: "بدون مبلغ نقدي", tone: "ma-tag--soft" },
};

export function StatusTag({ map, status }: { map: Record<string, { label: string; tone: string }>; status: string | null | undefined }) {
  if (!status) return <span className="text-fg-muted">—</span>;
  const def = map[status] ?? { label: "مكتملة", tone: "ma-tag--green" };
  return <span className={cn("ma-tag text-xs", def.tone)}>{def.label}</span>;
}

const dayFormatter = new Intl.DateTimeFormat("ar-u-nu-latn", { day: "numeric", month: "short", timeZone: "UTC" });

/** "25 أكتوبر" for an ISO calendar day (the series is in UTC days). */
export function dayLabel(isoDay: string): string {
  return dayFormatter.format(new Date(`${isoDay.slice(0, 10)}T00:00:00Z`));
}

/** The marketer's referral link with copy and share actions. */
export function ReferralLinkCard({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const text = encodeURIComponent(`تعلّم مع ماستري أكاديمي واحصل على خصم: ${link}`);
  const copy = (value: string, which: "link" | "code") => {
    void navigator.clipboard?.writeText(value);
    setCopied(which);
  };
  return (
    <section aria-labelledby="referral-link-title" className="flex flex-col gap-3 rounded-panel border border-line-strong bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="referral-link-title" className="m-0 text-lg font-bold">رابط الإحالة</h2>
        <button type="button" className="ma-btn ma-btn--soft gap-2 text-sm" onClick={() => copy(code, "code")}>
          الكود <bdi dir="ltr" className="font-mono font-bold">{code}</bdi>
          {copied === "code" ? <Check aria-hidden="true" className="size-4 fill-none" /> : <Copy aria-hidden="true" className="size-4 fill-none" />}
        </button>
      </div>
      <div className="flex flex-wrap items-stretch gap-2">
        <input readOnly dir="ltr" value={link} aria-label="رابط الإحالة" className="ma-input min-w-0 flex-1 font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="ma-btn ma-btn--primary gap-2" onClick={() => copy(link, "link")}>
          {copied === "link" ? <Check aria-hidden="true" className="size-4 fill-none" /> : <Copy aria-hidden="true" className="size-4 fill-none" />}
          {copied === "link" ? "تم النسخ" : "انسخ الرابط"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="ma-btn ma-btn--soft gap-2 text-sm" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer">
          <Share2 aria-hidden="true" className="size-4 fill-none" /> واتساب
        </a>
        <a className="ma-btn ma-btn--soft gap-2 text-sm" href={`https://twitter.com/intent/tweet?text=${text}`} target="_blank" rel="noopener noreferrer">
          <Share2 aria-hidden="true" className="size-4 fill-none" /> X
        </a>
        <a className="ma-btn ma-btn--soft gap-2 text-sm" href={`https://t.me/share/url?url=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">
          <Share2 aria-hidden="true" className="size-4 fill-none" /> تيليجرام
        </a>
      </div>
    </section>
  );
}

export function LoadError() {
  return <p role="alert" className="ma-alert ma-alert--warning m-0">تعذّر التحميل. حدّث الصفحة وحاول مجدداً.</p>;
}
