"use client";

import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Copy,
  Crown,
  Flame,
  Gift,
  GraduationCap,
  Infinity as InfinityIcon,
  Megaphone,
  Percent,
  Rocket,
  Sparkles,
  Star,
  Tag,
  Ticket,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { useCheckoutIncentives } from "@/features/checkout/model/incentives-store";
import type { AnnouncementItem } from "@/lib/api/announcements";
import { cn } from "@/lib/cn";
import { captureEvent } from "@/lib/observability/posthog";

import { couponHighlight, DEFAULT_ACTION_LABEL, itemHref } from "../model/bar";
import { Countdown } from "./countdown";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  percent: Percent,
  tag: Tag,
  ticket: Ticket,
  gift: Gift,
  infinity: InfinityIcon,
  crown: Crown,
  rocket: Rocket,
  flame: Flame,
  zap: Zap,
  calendar: Calendar,
  clock: Clock,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  megaphone: Megaphone,
  star: Star,
  bell: Bell,
};

const KIND_ICON: Record<AnnouncementItem["kind"], LucideIcon> = {
  discount: Percent,
  unlimited_access: InfinityIcon,
  free_course: Gift,
  new_course: Sparkles,
  event: Calendar,
  info: Megaphone,
};

function track(item: AnnouncementItem, barId: string, action: string) {
  captureEvent("announcement_clicked", {
    bar_id: barId,
    item_id: item.id,
    kind: item.kind,
    action,
    coupon: item.coupon?.code,
  });
}

/** Copies the code and keeps it for checkout; announces the result to screen readers. */
function CopyCouponButton({ item, barId, label }: { item: AnnouncementItem; barId: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const code = item.coupon?.code ?? "";

  const copy = async () => {
    useCheckoutIncentives.getState().setCoupon(code);
    track(item, barId, "copy_coupon");
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard blocked (insecure context, permissions): the code is visible and already applied to checkout.
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  };

  return (
    <button type="button" onClick={copy} className="ma-announce__coupon" aria-label={`${label}: ${code}`}>
      <span className="ma-announce__code" dir="ltr">
        {code}
      </span>
      <span className="ma-announce__coupon-action">
        {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
        {copied ? "تم النسخ" : label}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? `تم نسخ الكود ${code} وسيُطبَّق عند الدفع` : ""}
      </span>
    </button>
  );
}

type AnnouncementItemViewProps = {
  item: AnnouncementItem;
  barId: string;
  /** Called when the item's countdown ends, so the bar can drop it. */
  onExpire?: (id: string) => void;
  className?: string;
};

export function AnnouncementItemView({ item, barId, onExpire, className }: AnnouncementItemViewProps) {
  const Icon = (item.icon && ICONS[item.icon]) || KIND_ICON[item.kind];
  const highlight = item.highlight ?? (item.kind === "discount" ? couponHighlight(item.coupon) : null);
  const label = item.action_label ?? DEFAULT_ACTION_LABEL[item.action];
  const href = itemHref(item);

  return (
    <div className={cn("ma-announce__item", className)}>
      <span className="ma-announce__icon" aria-hidden="true">
        <Icon className="size-4" />
      </span>
      {item.badge ? <span className="ma-announce__badge">{item.badge}</span> : null}
      <p className="ma-announce__text">
        {highlight ? <strong className="ma-announce__highlight">{highlight}</strong> : null}
        {highlight ? " " : null}
        {item.text}
      </p>
      {item.countdown_to ? (
        <Countdown to={item.countdown_to} onEnd={onExpire ? () => onExpire(item.id) : undefined} />
      ) : null}
      {item.action === "copy_coupon" && item.coupon && label ? (
        <CopyCouponButton item={item} barId={barId} label={label} />
      ) : null}
      {item.action !== "copy_coupon" && item.action !== "none" && href && label ? (
        <AppLink
          href={href}
          className="ma-announce__cta"
          onClick={() => {
            if (item.action === "apply_coupon_go" && item.coupon) {
              useCheckoutIncentives.getState().setCoupon(item.coupon.code);
            }
            track(item, barId, item.action);
          }}
        >
          {item.action === "apply_coupon_go" && item.coupon ? (
            <span className="ma-announce__code" dir="ltr">
              {item.coupon.code}
            </span>
          ) : null}
          {label}
        </AppLink>
      ) : null}
    </div>
  );
}
