import type { Route } from "next";
import type { CSSProperties } from "react";

import { routes } from "@/config/routes";
import type { AnnouncementBar, AnnouncementItem, AnnouncementStyle } from "@/lib/api/announcements";

// ---------------------------------------------------------------- placement & audience

/** Named placements → the storefront paths they cover. `path:/x` matches one path, `path:/x*` a prefix. */
const PLACEMENT_PREFIXES: Record<string, string[]> = {
  courses: ["/courses"],
  diplomas: ["/diplomas"],
  packages: ["/packages"],
  bundles: ["/bundles"],
  subscriptions: ["/subscriptions"],
  cart: ["/cart"],
  search: ["/search"],
};

function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function matchesPlacement(pathname: string, placements: readonly string[]): boolean {
  return placements.some((placement) => {
    if (placement === "all") return true;
    if (placement === "home") return pathname === "/";
    if (placement.startsWith("path:")) {
      const path = placement.slice(5);
      return path.endsWith("*") ? pathname.startsWith(path.slice(0, -1)) : pathname === path;
    }
    return (PLACEMENT_PREFIXES[placement] ?? []).some((prefix) => underPrefix(pathname, prefix));
  });
}

export type Viewer = "unknown" | "guest" | "signed_in";

/** Until the session is known only `all` bars may show, so a signed-in visitor never sees a guest offer flash. */
export function matchesAudience(audience: AnnouncementBar["audience"], viewer: Viewer): boolean {
  return audience === "all" || audience === viewer;
}

// ---------------------------------------------------------------- dismissal

export const DISMISS_STORAGE_KEY = "ma-ann-dismissed";

/** Bar id + version: editing a bar's content bumps the version, so a dismissed bar shows again. */
export function dismissKey(bar: Pick<AnnouncementBar, "id" | "version">): string {
  return `${bar.id}:${bar.version}`;
}

type DismissedMap = Record<string, number>; // dismissKey → expiry (ms epoch)

function readDismissed(): DismissedMap {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DISMISS_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as DismissedMap) : {};
  } catch {
    return {};
  }
}

export function isDismissed(bar: AnnouncementBar, now = Date.now()): boolean {
  const until = readDismissed()[dismissKey(bar)];
  return typeof until === "number" && until > now;
}

export function dismissBar(bar: AnnouncementBar, now = Date.now()): void {
  try {
    const current = readDismissed();
    // Drop expired entries so the map never grows without bound.
    const kept = Object.fromEntries(Object.entries(current).filter(([, until]) => until > now));
    // 0 days = hidden for this visit only (until the tab's next full load is at least an hour away).
    const days = bar.dismiss_days > 0 ? bar.dismiss_days : 1 / 24;
    kept[dismissKey(bar)] = now + days * 86_400_000;
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Storage blocked: the bar is still hidden until the next page load.
  }
}

/**
 * Runs before first paint (like the theme script): hides bars this visitor dismissed, so a server-rendered
 * bar never flashes before the client hides it.
 */
export const dismissScript = `(function(){try{var m=JSON.parse(localStorage.getItem("${DISMISS_STORAGE_KEY}")||"{}"),n=Date.now(),c="";for(var k in m){if(m[k]>n&&/^[0-9a-f-]{36}:[0-9]+$/i.test(k)){c+='[data-ann="'+k+'"]{display:none!important}'}}if(c){var s=document.createElement("style");s.textContent=c;document.head.appendChild(s)}}catch(e){}})();`;

/** The bar this visitor sees on this page: the highest-priority match (the API already sorts by priority). */
export function pickBar(
  bars: readonly AnnouncementBar[],
  pathname: string,
  viewer: Viewer,
  dismissed: (bar: AnnouncementBar) => boolean = () => false,
): AnnouncementBar | null {
  return (
    bars.find(
      (bar) =>
        bar.items.length > 0 &&
        matchesPlacement(pathname, bar.placements) &&
        matchesAudience(bar.audience, viewer) &&
        !dismissed(bar),
    ) ?? null
  );
}

// ---------------------------------------------------------------- style

function background(colors: readonly string[], type: string, angle: number): string {
  if (type === "solid" || colors.length < 2) return colors[0] ?? "var(--accent)";
  return `linear-gradient(${angle}deg, ${colors.join(", ")})`;
}

/** The bar's look as CSS custom properties (consumed by `.ma-announce` in styles/announcement.css). */
export function barStyleVars(style: AnnouncementStyle, item?: AnnouncementItem | null): CSSProperties {
  const override = item?.style_override;
  const colors = override?.bg_colors?.length ? override.bg_colors : style.bg.colors;
  const type = override?.bg_colors?.length === 1 ? "solid" : style.bg.type;
  return {
    "--ann-bg": background(colors, type ?? "gradient", style.bg.angle ?? 90),
    "--ann-fg": override?.text_color ?? style.text_color,
    "--ann-accent": override?.accent_color ?? style.accent_color,
    "--ann-badge-bg": override?.badge_bg ?? style.badge_bg,
  } as CSSProperties;
}

// ---------------------------------------------------------------- targets

/** `course-123` → `/courses/123`, `diploma-9` → `/diplomas/9`; bundles keep their catalog slug. */
export function productHref(productType: string | null | undefined, slug: string): Route | null {
  const numeric = /^(?:course|diploma|package|consultation)-(\d+)$/.exec(slug);
  const id = numeric ? Number(numeric[1]) : null;
  switch (productType) {
    case "course":
      return id !== null ? routes.course(id) : null;
    case "diploma":
      return id !== null ? routes.diploma(id) : null;
    case "package":
      return id !== null ? routes.package(id) : null;
    case "consultation":
      return id !== null ? routes.consultation(id) : null;
    case "bundle":
      return routes.bundle(slug.replace(/^bundle-/, ""));
    default:
      return id !== null ? routes.course(id) : null;
  }
}

function withCoupon(href: string, code: string | null | undefined): string {
  if (!code) return href;
  const [path, hash] = href.split("#", 2);
  const joined = `${path}${path.includes("?") ? "&" : "?"}coupon=${encodeURIComponent(code)}`;
  return hash ? `${joined}#${hash}` : joined;
}

/** Where the item's action goes (null = no navigation). `apply_coupon_go` carries `?coupon=` so shared links work. */
export function itemHref(item: AnnouncementItem): Route | null {
  const target = item.target;
  if (!target) return null;
  let href: string | null = null;
  if (target.kind === "product" && target.slug) href = productHref(target.product_type, target.slug);
  else if (target.kind === "plan" && target.slug) href = routes.subscription(target.slug);
  else if (target.kind === "url" && target.href) href = target.href;
  if (!href) return null;
  return (item.action === "apply_coupon_go" ? withCoupon(href, item.coupon?.code) : href) as Route;
}

/** "خصم 20%" / "$15 خصم" — a default highlight when the admin left it empty. */
export function couponHighlight(coupon: AnnouncementItem["coupon"]): string | null {
  if (!coupon) return null;
  if (coupon.kind === "percent") return `خصم ${Math.round(coupon.value)}%`;
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: coupon.currency_code || "USD",
    maximumFractionDigits: 0,
  }).format(coupon.value);
  return `خصم ${amount}`;
}

export const DEFAULT_ACTION_LABEL: Record<AnnouncementItem["action"], string | null> = {
  none: null,
  copy_coupon: "انسخ الكود",
  apply_coupon_go: "استفد من العرض",
  link: "اعرف المزيد",
  product: "شاهد الدورة",
  subscription_plan: "اشترك الآن",
};
