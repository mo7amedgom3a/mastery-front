"use client";

import { clsx as cn } from "clsx";
import { Check, Copy, Download, Link2, Send, Share2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { formatCount } from "@/lib/format";

import type { QrMatrix } from "../api/share-qr";
import { QrCode, qrSvgMarkup } from "./qr-code";

export type ShareTrainer = { name: string; avatar: string | null; initial: string };

/** Avatars stacked on the share card; the rest are counted. */
const MAX_SHARE_AVATARS = 5;
const OTHER_TRAINER_FORMS = { one: "مدرب آخر", two: "مدربان آخران", few: "مدربين آخرين", many: "مدرباً آخر" };

type ShareDialogProps = {
  /** Canonical absolute URL of the course, diploma or package. */
  url: string;
  title: string;
  /** "دورة" | "دبلوم" | "باقة". */
  kindLabel: string;
  /** Kit tag modifier for the kind, e.g. `ma-tag--coral`. */
  tagClassName?: string;
  facts: readonly string[];
  trainers: readonly ShareTrainer[];
  /** What the people on the card are called, singular and plural. Default: "المدرب" / "المدربون". */
  personLabels?: readonly [string, string];
  qr: QrMatrix;
  /** File name for the downloaded QR code, without extension. */
  fileName: string;
  /** `block`: full-width button (purchase card). Default: compact button beside the title. */
  variant?: "compact" | "block";
};

type Network = { key: string; label: string; href: (url: string, text: string) => string };

const NETWORKS: readonly Network[] = [
  { key: "whatsapp", label: "واتساب", href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}` },
  { key: "facebook", label: "فيسبوك", href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  {
    key: "x",
    label: "X (تويتر)",
    href: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "linkedin",
    label: "لينكدإن",
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "telegram",
    label: "تيليجرام",
    href: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

const noSubscribe = () => () => {};
/** Web Share support: read on the client only, `false` during SSR so hydration matches. */
function useCanNativeShare(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
}

/** The shared URL, tagged with where the visit came from (analytics only; the page ignores it). */
function tagged(url: string, source: string): string {
  const next = new URL(url);
  next.searchParams.set("utm_source", source);
  next.searchParams.set("utm_medium", "share");
  return next.toString();
}

/** "أ. كريم" · "أ. كريم وأ. سهل" · "أ. كريم ومدربان آخران" · "أ. كريم و3 مدربين آخرين". */
function trainerNames(trainers: readonly ShareTrainer[]): string {
  const [lead, second] = trainers;
  if (trainers.length === 1) return lead.name;
  if (trainers.length === 2) return `${lead.name} و${second.name}`;
  return `${lead.name} و${formatCount(trainers.length - 1, OTHER_TRAINER_FORMS)}`;
}

/** Every trainer's avatar, overlapping like the hero strip, with their names beside it. */
function ShareTrainers({
  trainers,
  labels = ["المدرب", "المدربون"],
}: {
  trainers: readonly ShareTrainer[];
  labels?: readonly [string, string];
}) {
  const shown = trainers.slice(0, MAX_SHARE_AVATARS);
  const hidden = trainers.length - shown.length;
  return (
    <div className="mt-auto flex items-center gap-3">
      <ul aria-hidden="true" className="m-0 flex shrink-0 list-none p-0">
        {shown.map((trainer, index) => (
          <li
            key={`${trainer.name}-${index}`}
            className={cn(
              "relative grid size-12 place-content-center overflow-hidden rounded-full font-bold text-ink ring-2 ring-surface-alt",
              brandBg[brandColorAt(index)],
              index > 0 && "-ms-3",
            )}
          >
            {trainer.avatar ? (
              <Image src={trainer.avatar} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <span>{trainer.initial}</span>
            )}
          </li>
        ))}
        {hidden > 0 ? (
          <li className="-ms-3 grid size-12 place-content-center rounded-full bg-surface text-sm font-bold tabular-nums ring-2 ring-surface-alt">
            <span dir="ltr">+{hidden}</span>
          </li>
        ) : null}
      </ul>
      <span className="flex min-w-0 flex-col">
        <span className="text-xs text-fg-muted">{trainers.length > 1 ? labels[1] : labels[0]}</span>
        <span className="font-bold text-pretty">{trainerNames(trainers)}</span>
      </span>
    </div>
  );
}

/**
 * "مشاركة" button + dialog: a share card (course, facts, every trainer and a QR code that opens the page),
 * the device's native share sheet where available, social networks, copy link and a QR download.
 */
export function ShareButton(props: ShareDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const canNativeShare = useCanNativeShare();
  // The button appears in the hero and the purchase card: each dialog needs its own ids.
  const titleId = useId();
  const { url, title, kindLabel, tagClassName = "ma-tag--coral", facts, trainers, personLabels, qr, fileName, variant = "compact" } =
    props;
  const text = `${kindLabel} «${title}» على ماستري أكاديمي`;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const close = () => dialogRef.current?.close();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(tagged(url, "copy"));
      setCopied(true);
    } catch {
      // Clipboard blocked (permissions, insecure context): the link stays visible to copy by hand.
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url: tagged(url, "native") });
    } catch {
      // Dismissed by the visitor; nothing to do.
    }
  };

  const downloadQr = () => {
    const blob = new Blob([qrSvgMarkup(qr)], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${fileName}-qr.svg`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        className={cn("ma-btn ma-btn--outline ma-btn--sm gap-2", variant === "block" ? "ma-btn--block" : "shrink-0")}
      >
        <Share2 aria-hidden="true" className="size-4" />
        مشاركة
      </button>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby={titleId}
        className="m-auto max-h-[calc(100svh-2rem)] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
      >
        <div className="flex flex-col gap-6 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="m-0 text-xl font-bold">
              شارك ال{kindLabel}
            </h2>
            <button type="button" onClick={close} aria-label="إغلاق" className="ma-btn ma-btn--ghost ma-btn--icon size-10 min-h-10">
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          {/* Share card: what a friend sees in a screenshot or when scanning the code. */}
          <figure className="m-0 grid gap-5 border border-line bg-surface-alt p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex min-w-0 flex-col gap-4">
              <span className={cn("ma-tag self-start", tagClassName)}>{kindLabel}</span>
              <figcaption className="text-lg leading-8 font-bold text-balance">{title}</figcaption>
              {facts.length > 0 ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm">
                  {facts.map((fact) => (
                    <li key={fact} className="border border-line bg-surface px-2.5 py-1">
                      {fact}
                    </li>
                  ))}
                </ul>
              ) : null}
              {trainers.length > 0 ? <ShareTrainers trainers={trainers} labels={personLabels} /> : null}
            </div>
            <div className="flex flex-col items-center gap-2 self-center">
              <QrCode matrix={qr} label={`رمز QR لفتح صفحة ال${kindLabel}`} className="size-36 bg-white p-1" />
              <span className="text-xs text-fg-muted">امسح الرمز لفتح الصفحة</span>
            </div>
          </figure>

          <div className="flex flex-col gap-3">
            {canNativeShare ? (
              <button type="button" onClick={nativeShare} className="ma-btn ma-btn--primary ma-btn--block gap-2">
                <Send aria-hidden="true" className="size-4" />
                مشاركة عبر الجهاز
              </button>
            ) : null}
            <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
              {NETWORKS.map((network) => (
                <li key={network.key}>
                  <a
                    href={network.href(tagged(url, network.key), text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ma-btn ma-btn--outline ma-btn--sm ma-btn--block"
                  >
                    {network.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-stretch gap-2">
              <span className="flex min-w-0 flex-1 items-center gap-2 border border-line px-3 text-sm text-fg-muted">
                <Link2 aria-hidden="true" className="size-4 shrink-0" />
                <span dir="ltr" className="truncate">
                  {url}
                </span>
              </span>
              <button
                type="button"
                onClick={copyLink}
                className={cn("ma-btn ma-btn--sm shrink-0 gap-2", copied ? "ma-btn--secondary" : "ma-btn--outline")}
              >
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </button>
            </div>
            <span role="status" className="sr-only">
              {copied ? "تم نسخ الرابط" : ""}
            </span>
            <button type="button" onClick={downloadQr} className="ma-btn ma-btn--ghost ma-btn--sm gap-2 self-start">
              <Download aria-hidden="true" className="size-4" />
              تنزيل رمز QR
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
