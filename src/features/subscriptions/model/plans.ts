import type { Route } from "next";

import { routes } from "@/config/routes";
import type { SubscriptionFeature, SubscriptionPlan } from "@/lib/api/subscriptions";
import { formatMoney } from "@/lib/format";

export type Audience = "individual" | "company";
export type Interval = "month" | "year";

export type PlanFeatureVM = {
  key: string;
  icon: string | null;
  title: string;
  description: string | null;
  /** Per-plan detail, e.g. "جلستان شهرياً". */
  value: string | null;
  highlighted: boolean;
};

export type PlanResourceVM = { productId: string; title: string; type: string; selectable: boolean };

export type PlanVM = {
  id: string;
  slug: string;
  href: Route;
  title: string;
  subtitle: string | null;
  summary: string | null;
  description: string | null;
  audience: Audience;
  interval: Interval;
  planType: "standard" | "full_library" | "choose_x";
  /** What the subscriber pays per interval now (number for maths, string for display). */
  amount: number;
  price: string;
  /** The list price, struck through while an offer runs. */
  originalPrice: string | null;
  offer: { label: string; percent: number; endsAt: string | null } | null;
  /** Monthly equivalent of a yearly price, e.g. "$20.75 / شهر". */
  perMonth: string | null;
  /** Glowing card: a yearly plan with a live offer, or one the admin featured. */
  spotlight: boolean;
  featured: boolean;
  features: PlanFeatureVM[];
  cardItems: string[];
  resources: PlanResourceVM[];
  selectionAllowance: number | null;
  maxSeats: number;
  /** Full-library plans: how many published courses and diplomas they grant today. */
  libraryCount: number | null;
  /** Company plans: `amount` is per employee (seat), for a team of `minSeats`–`maxSeats`. */
  perSeat: boolean;
  minSeats: number;
  /** VAT added at checkout on seats × price (0 = none). */
  taxPercent: number;
};

const toNumber = (value: string | number | null | undefined) => Number(value ?? 0) || 0;

export const PLAN_TYPE_LABELS: Record<PlanVM["planType"], string> = {
  standard: "باقة أساسية",
  full_library: "المكتبة الكاملة",
  choose_x: "اختر برامجك",
};

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  course: "دورة",
  diploma: "دبلوم",
  live_diploma: "دبلوم مباشر",
  package: "حزمة",
  bundle: "باقة مخصصة",
  consultation: "استشارة",
};

export function toPlanVM(plan: SubscriptionPlan): PlanVM {
  const amount = toNumber(plan.effective_price);
  const list = toNumber(plan.price);
  const discount = plan.discount?.is_active ? plan.discount : null;
  const percent = discount && list > 0 ? Math.round(((list - amount) / list) * 100) : 0;
  const interval = plan.billing_interval as Interval;
  const resources = [...(plan.included_products ?? []), ...(plan.plan_type === "choose_x" ? [] : plan.selectable_products ?? [])].map((p) => ({
    productId: p.product_id,
    title: p.title ?? p.slug ?? "",
    type: p.product_type ?? "course",
    selectable: p.access_mode === "selectable",
  }));
  return {
    id: plan.plan_id,
    slug: plan.slug,
    href: routes.subscription(plan.slug),
    title: plan.title ?? plan.slug,
    subtitle: plan.subtitle ?? null,
    summary: plan.short_description ?? null,
    description: plan.description ?? null,
    audience: plan.audience_type as Audience,
    interval,
    planType: plan.plan_type,
    amount,
    // Cents kept: this is the exact amount Stripe charges ("$174.30", not "$174").
    price: formatMoney(amount),
    originalPrice: discount && list > amount ? formatMoney(list) : null,
    offer: discount && percent > 0 ? { label: discount.label?.trim() || "عرض خاص", percent, endsAt: discount.ends_at ?? null } : null,
    perMonth: interval === "year" ? formatMoney(Math.round((amount / 12) * 100) / 100) : null,
    spotlight: (interval === "year" && percent > 0) || Boolean(plan.is_featured),
    featured: Boolean(plan.is_featured),
    features: (plan.features ?? []).map((f) => ({
      key: f.key,
      icon: f.icon ?? null,
      title: f.title,
      description: f.description ?? null,
      value: f.value ?? null,
      highlighted: Boolean(f.highlighted),
    })),
    cardItems: plan.card_features ?? [],
    resources,
    selectionAllowance: plan.selection_allowance ?? null,
    maxSeats: plan.max_seats ?? 1,
    libraryCount: plan.library_count ?? null,
    perSeat: Boolean(plan.per_seat),
    minSeats: plan.min_seats ?? 1,
    taxPercent: toNumber(plan.tax_percent),
  };
}

export type CatalogFeatureVM = { key: string; icon: string | null; title: string; description: string | null };

export function toCatalogFeatureVM(feature: SubscriptionFeature): CatalogFeatureVM {
  return { key: feature.key, icon: feature.icon ?? null, title: feature.title, description: feature.description ?? null };
}

/** "الوصول لكل المكتبة (120 دورة ودبلوم)" — what a full-library plan grants, or null for other plans. */
export function libraryLine(plan: PlanVM): string | null {
  if (plan.planType !== "full_library") return null;
  return plan.libraryCount ? `الوصول لكل المكتبة (${plan.libraryCount} دورة ودبلوم)` : "الوصول لكل دورات ودبلومات المكتبة";
}

/** "ينتهي العرض في 31 أكتوبر" — the end date in Arabic, or null for an open-ended offer. */
export function offerEndsLabel(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(endsAt) ? endsAt : `${endsAt}Z`);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("ar", { day: "numeric", month: "long" }).format(date);
}
