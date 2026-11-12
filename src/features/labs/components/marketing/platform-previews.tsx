"use client";

import {
  BadgeCheck,
  Bookmark,
  Camera,
  ChartNoAxesColumn,
  ChevronLeft,
  ChevronUp,
  Coffee,
  Ellipsis,
  Globe,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Plus,
  Repeat2,
  Search,
  Send,
  Share,
  Share2,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { ctas, headlines, type Creative, type Platform, type Visual } from "../../model/ad-market";

/**
 * Sample in-app renderings of the ad on each platform: the learner sees how the same creative
 * looks as an Instagram reel or post, a TikTok, a Facebook feed post, an X post or a Snap ad.
 * Mockups only (no platform logos or assets); counts are illustrative.
 */

const BRAND = { name: "محمصة نخلة", handle: "nakhla.roasters", site: "nakhla.sa" };
const HASHTAGS = "#قهوة_مختصة #الرياض #الملقا";

function captionOf(creative: Creative): string {
  return (headlines.find((h) => h.id === creative.headline)?.label ?? "").replace(/[«»]/g, "");
}

function ctaOf(creative: Creative): string {
  return ctas.find((c) => c.id === creative.cta)?.label ?? "";
}

// ---------- shared pieces ----------

function Avatar({ size = 32, ring = false }: { size?: number; ring?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-coral font-bold text-ink",
        ring && "outline-2 outline-offset-2 outline-pink",
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
      aria-hidden
    >
      نخلة
    </span>
  );
}

/** The creative itself: a stylised clip, photo or logo card (no stock assets in the repo). */
function AdVisual({
  visual,
  className,
  playing = false,
  compact = false,
}: {
  visual: Visual;
  className?: string;
  /** Full-bleed autoplay (reels, stories): no play button or duration badge. */
  playing?: boolean;
  /** Small card (X): smaller art, no caption. */
  compact?: boolean;
}) {
  if (visual === "v-logo") {
    return (
      <div className={cn("flex items-center justify-center bg-cream text-ink", className)}>
        <span className="text-4xl font-bold">نخلة</span>
      </div>
    );
  }
  const video = visual === "v-reel";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden text-ink",
        video ? "bg-gradient-to-b from-[#3b2417] via-[#7a4a2a] to-coral" : "bg-gradient-to-br from-cream via-[#e9c9a5] to-coral",
        className,
      )}
    >
      {/* Coffee beans scattered in the background. */}
      {[12, 28, 46, 64, 80].map((left, i) => (
        <span
          key={left}
          aria-hidden
          className={cn("absolute h-3 w-2 rounded-full", video ? "bg-[#2a170d]/60" : "bg-[#6b3f22]/50")}
          style={{ left: `${left}%`, top: `${(i * 37) % 80 + 8}%`, rotate: `${i * 40}deg` }}
        />
      ))}
      <div className="relative flex flex-col items-center gap-1">
        {video && !compact ? (
          <span aria-hidden className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-6 w-1 rounded-full bg-white/50 motion-safe:animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </span>
        ) : null}
        <Coffee className={cn(compact ? "size-10" : "size-20", video ? "text-cream" : "text-[#5a3420]")} strokeWidth={1.4} aria-hidden />
        {compact ? null : (
          <span className={cn("text-[11px] font-semibold", video ? "text-cream/80" : "text-[#5a3420]/80")}>
            {video ? "صبّ القهوة · حركة بطيئة" : "تحميص اليوم"}
          </span>
        )}
      </div>
      {video && !playing ? (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="flex size-12 items-center justify-center rounded-full bg-black/40 text-white">
            <Play className="size-6 fill-current" />
          </span>
        </span>
      ) : null}
      {video && !playing ? (
        <span className="absolute bottom-2 start-2 rounded bg-black/50 px-1.5 text-[10px] text-white tabular-nums" dir="ltr">
          0:15
        </span>
      ) : null}
    </div>
  );
}

/** A phone frame with a status bar. `dark` for full-bleed video apps. */
function Phone({
  dark = false,
  overlay = dark,
  children,
  label,
}: {
  dark?: boolean;
  /** Content runs under the status bar (full-bleed video). */
  overlay?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <figure
      aria-label={label}
      className={cn(
        "relative mx-auto m-0 flex h-[580px] w-[290px] flex-col overflow-hidden rounded-[32px] border-[6px] border-[#1a1a1a] shadow-xl",
        dark ? "bg-black text-white" : "bg-white text-[#111]",
      )}
    >
      <div className={cn("flex h-6 shrink-0 items-center justify-between px-5 text-[10px] font-semibold", overlay && "absolute inset-x-0 top-0 z-20")} dir="ltr">
        <span>9:41</span>
        <span className="flex items-center gap-1" aria-hidden>
          <span className="h-2 w-3 rounded-[2px] border border-current" />
        </span>
      </div>
      {children}
    </figure>
  );
}

function RailAction({ icon, count, label }: { icon: ReactNode; count?: string; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5 text-[11px] font-semibold drop-shadow" aria-label={label}>
      {icon}
      {count ? <span className="tabular-nums" dir="ltr">{count}</span> : null}
    </span>
  );
}

// ---------- Instagram ----------

function InstagramReel({ creative }: { creative: Creative }) {
  return (
    <Phone dark label="معاينة ريلز إنستغرام">
      <AdVisual visual={creative.visual} playing className="absolute inset-0" />
      <div className="absolute inset-x-0 top-6 z-10 flex items-center justify-between px-4 text-[15px] font-bold">
        <span>ريلز</span>
        <Camera className="size-5" aria-hidden />
      </div>
      <div className="absolute end-3 bottom-24 z-10 flex flex-col items-center gap-4">
        <RailAction icon={<Heart className="size-6" />} count="4,812" label="إعجاب" />
        <RailAction icon={<MessageCircle className="size-6 -scale-x-100" />} count="126" label="تعليق" />
        <RailAction icon={<Send className="size-6" />} label="مشاركة" />
        <RailAction icon={<Ellipsis className="size-6" />} label="المزيد" />
        <span className="size-6 rounded-[6px] border-2 border-white bg-coral" aria-hidden />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
        <div className="flex items-center gap-2 text-[13px]">
          <Avatar size={30} />
          <span className="font-bold" dir="ltr">{BRAND.handle}</span>
          <span className="rounded-md border border-white/70 px-2 py-0.5 text-[11px] font-semibold">متابعة</span>
        </div>
        <p className="m-0 line-clamp-2 pe-10 text-[12px] leading-5">
          {captionOf(creative)} <span className="text-white/70">{HASHTAGS}</span>
        </p>
        <span className="flex items-center gap-1 text-[11px] text-white/80">
          <Music2 className="size-3" aria-hidden /> ممول · صوت أصلي
        </span>
        <span className="flex items-center justify-between rounded-md bg-white/20 px-3 py-2 text-[12px] font-bold backdrop-blur">
          {ctaOf(creative)}
          <ChevronLeft className="size-4" aria-hidden />
        </span>
      </div>
    </Phone>
  );
}

function InstagramPost({ creative }: { creative: Creative }) {
  return (
    <Phone label="معاينة منشور إنستغرام">
      <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
        <span className="text-[17px] font-bold italic" dir="ltr">Instagram</span>
        <span className="flex gap-3" aria-hidden>
          <Heart className="size-5" />
          <Send className="size-5" />
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar size={30} ring />
        <span className="flex flex-col text-[12px] leading-4">
          <strong dir="ltr" className="text-start">{BRAND.handle}</strong>
          <span className="text-black/60">ممول</span>
        </span>
        <Ellipsis className="ms-auto size-5" aria-hidden />
      </div>
      <AdVisual visual={creative.visual} className="aspect-square w-full" />
      <span className="flex items-center justify-between bg-[#0095f6] px-3 py-2 text-[12px] font-bold text-white">
        {ctaOf(creative)}
        <ChevronLeft className="size-4" aria-hidden />
      </span>
      <div className="flex items-center gap-3 px-3 pt-2" aria-hidden>
        <Heart className="size-6" />
        <MessageCircle className="size-6 -scale-x-100" />
        <Send className="size-6" />
        <Bookmark className="ms-auto size-6" />
      </div>
      <div className="flex flex-col gap-1 px-3 py-2 text-[12px] leading-5">
        <strong>
          <span dir="ltr">2,431</span> إعجابًا
        </strong>
        <p className="m-0 line-clamp-2">
          <strong dir="ltr">{BRAND.handle}</strong> {captionOf(creative)} <span className="text-[#00376b]">{HASHTAGS}</span>
        </p>
        <span className="text-black/50">عرض كل التعليقات (48)</span>
      </div>
    </Phone>
  );
}

// ---------- TikTok ----------

function TikTok({ creative }: { creative: Creative }) {
  return (
    <Phone dark label="معاينة تيك توك">
      <AdVisual visual={creative.visual} playing className="absolute inset-0" />
      <div className="absolute inset-x-0 top-6 z-10 flex items-center justify-center gap-4 text-[14px] font-semibold">
        <span className="text-white/60">متابَعون</span>
        <span className="border-b-2 border-white pb-0.5">لك</span>
        <Search className="absolute end-4 size-5" aria-hidden />
      </div>
      <div className="absolute end-2 bottom-28 z-10 flex flex-col items-center gap-4">
        <span className="relative mb-2" aria-hidden>
          <Avatar size={40} />
          <span className="absolute -bottom-2 start-1/2 flex size-4 -translate-x-1/2 items-center justify-center rounded-full bg-[#fe2c55] rtl:translate-x-1/2">
            <Plus className="size-3" />
          </span>
        </span>
        <RailAction icon={<Heart className="size-7 fill-current" />} count="12.4K" label="إعجاب" />
        <RailAction icon={<MessageCircle className="size-7 fill-current" />} count="318" label="تعليق" />
        <RailAction icon={<Bookmark className="size-7 fill-current" />} count="1,207" label="حفظ" />
        <RailAction icon={<Share className="size-7" />} count="856" label="مشاركة" />
        <span className="flex size-9 items-center justify-center rounded-full bg-[#222] motion-safe:animate-spin [animation-duration:4s]" aria-hidden>
          <span className="size-4 rounded-full bg-coral" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 pe-14">
        <strong className="text-[14px]" dir="ltr">@{BRAND.handle}</strong>
        <p className="m-0 line-clamp-2 text-[12px] leading-5">
          {captionOf(creative)} {HASHTAGS}
        </p>
        <span className="w-fit rounded bg-white/25 px-1.5 text-[10px]">إعلان ممول</span>
        <span className="flex items-center gap-1 text-[11px]">
          <Music2 className="size-3" aria-hidden /> صوت أصلي · {BRAND.name}
        </span>
        <span className="mt-1 rounded-md bg-[#fe2c55] py-2 text-center text-[12px] font-bold">{ctaOf(creative)}</span>
      </div>
    </Phone>
  );
}

// ---------- Facebook ----------

function FacebookPost({ creative }: { creative: Creative }) {
  return (
    <Phone label="معاينة منشور فيسبوك">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[22px] font-bold text-[#1877f2]" dir="ltr">facebook</span>
        <span className="flex gap-2" aria-hidden>
          <span className="flex size-8 items-center justify-center rounded-full bg-black/5"><Search className="size-4" /></span>
          <span className="flex size-8 items-center justify-center rounded-full bg-black/5"><MessageCircle className="size-4" /></span>
        </span>
      </div>
      <div className="h-1.5 shrink-0 bg-black/10" />
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar size={36} />
        <span className="flex flex-col text-[12px] leading-4">
          <strong>{BRAND.name}</strong>
          <span className="flex items-center gap-1 text-black/55">
            ممول · <Globe className="size-3" aria-hidden />
          </span>
        </span>
        <Ellipsis className="ms-auto size-5 text-black/60" aria-hidden />
      </div>
      <p className="m-0 line-clamp-3 px-3 pb-2 text-[13px] leading-5">
        {captionOf(creative)} <span className="text-[#1877f2]">{HASHTAGS}</span>
      </p>
      <AdVisual visual={creative.visual} className="aspect-[4/3] w-full" />
      <div className="flex items-center justify-between gap-2 bg-[#f0f2f5] px-3 py-2">
        <span className="flex min-w-0 flex-col text-[11px] leading-4">
          <span className="text-black/55 uppercase" dir="ltr">{BRAND.site}</span>
          <strong className="truncate text-[12px]">قهوة مختصة محمصة اليوم</strong>
        </span>
        <span className="shrink-0 rounded-md bg-black/10 px-2.5 py-1.5 text-[11px] font-bold">{ctaOf(creative)}</span>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-black/55">
        <span className="flex items-center gap-1">
          <span className="flex size-4 items-center justify-center rounded-full bg-[#1877f2] text-white" aria-hidden>
            <ThumbsUp className="size-2.5 fill-current" />
          </span>
          <span className="flex size-4 items-center justify-center rounded-full bg-[#f33e58] text-white" aria-hidden>
            <Heart className="size-2.5 fill-current" />
          </span>
          <span dir="ltr">1.8K</span>
        </span>
        <span>94 تعليقًا · 37 مشاركة</span>
      </div>
      <div className="mx-3 flex justify-around border-t border-black/10 py-2 text-[12px] font-semibold text-black/60">
        <span className="flex items-center gap-1"><ThumbsUp className="size-4" aria-hidden /> أعجبني</span>
        <span className="flex items-center gap-1"><MessageCircle className="size-4" aria-hidden /> تعليق</span>
        <span className="flex items-center gap-1"><Share2 className="size-4" aria-hidden /> مشاركة</span>
      </div>
    </Phone>
  );
}

// ---------- X ----------

function XPost({ creative }: { creative: Creative }) {
  return (
    <Phone dark overlay={false} label="معاينة منشور إكس">
      <div className="flex items-center justify-between border-b border-white/15 px-3 py-2">
        <Avatar size={26} />
        <span className="text-[20px] font-black" dir="ltr">𝕏</span>
        <span className="w-[26px]" />
      </div>
      <div className="flex border-b border-white/15 text-[13px] font-semibold">
        <span className="flex-1 py-2 text-center"><span className="border-b-4 border-[#1d9bf0] pb-1.5">لك</span></span>
        <span className="flex-1 py-2 text-center text-white/50">متابَعون</span>
      </div>
      <article className="flex gap-2 px-3 py-3">
        <Avatar size={38} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1 text-[12px]">
            <strong className="truncate">{BRAND.name}</strong>
            <BadgeCheck className="size-4 shrink-0 fill-[#e2b719] text-black" aria-hidden />
            <span className="truncate text-white/50" dir="ltr">@{BRAND.handle}</span>
            <Ellipsis className="ms-auto size-4 shrink-0 text-white/50" aria-hidden />
          </div>
          <p className="m-0 line-clamp-3 text-[13px] leading-5">
            {captionOf(creative)} <span className="text-[#1d9bf0]">{HASHTAGS}</span>
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/20">
            <AdVisual visual={creative.visual} compact className="aspect-video w-full" />
            <div className="flex flex-col gap-0.5 px-3 py-2 text-[11px]">
              <span className="text-white/50" dir="ltr">{BRAND.site}</span>
              <span className="font-semibold">{ctaOf(creative)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-white/55" aria-hidden>
            <span className="flex items-center gap-1"><MessageCircle className="size-4" /> 42</span>
            <span className="flex items-center gap-1"><Repeat2 className="size-4" /> 88</span>
            <span className="flex items-center gap-1"><Heart className="size-4" /> 615</span>
            <span className="flex items-center gap-1"><ChartNoAxesColumn className="size-4" /> 24K</span>
            <span className="flex items-center gap-2"><Bookmark className="size-4" /><Share className="size-4" /></span>
          </div>
          <span className="text-[11px] text-white/50">إعلان</span>
        </div>
      </article>
    </Phone>
  );
}

// ---------- Snapchat ----------

function SnapAd({ creative }: { creative: Creative }) {
  return (
    <Phone dark label="معاينة إعلان سناب شات">
      <AdVisual visual={creative.visual} playing className="absolute inset-0" />
      <div className="absolute inset-x-0 top-7 z-10 flex items-center gap-2 px-3">
        <Avatar size={34} />
        <span className="flex flex-col text-[12px] leading-4 drop-shadow">
          <strong>{BRAND.name}</strong>
          <span className="text-white/80">إعلان</span>
        </span>
        <Volume2 className="ms-auto size-5 drop-shadow" aria-hidden />
      </div>
      <div className="absolute inset-x-0 top-[100px] z-10 px-4">
        <p className="m-0 line-clamp-3 rounded-xl bg-black/35 p-2 text-center text-[14px] leading-6 font-bold backdrop-blur-sm">{captionOf(creative)}</p>
      </div>
      <div className="absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-1">
        <ChevronUp className="size-5 motion-safe:animate-bounce" aria-hidden />
        <span className="rounded-full bg-[#fffc00] px-5 py-2 text-[13px] font-bold text-black">{ctaOf(creative)}</span>
        <span className="text-[10px] text-white/80" dir="ltr">{BRAND.site}</span>
      </div>
    </Phone>
  );
}

// ---------- switcher ----------

/** The ad as it would appear in each platform's app. Instagram shows a reel for video, a feed post otherwise. */
export function PlatformPreview({ platform, creative }: { platform: Platform; creative: Creative }) {
  switch (platform) {
    case "instagram":
      return creative.visual === "v-reel" ? <InstagramReel creative={creative} /> : <InstagramPost creative={creative} />;
    case "tiktok":
      return <TikTok creative={creative} />;
    case "facebook":
      return <FacebookPost creative={creative} />;
    case "x":
      return <XPost creative={creative} />;
    case "snapchat":
      return <SnapAd creative={creative} />;
  }
}
