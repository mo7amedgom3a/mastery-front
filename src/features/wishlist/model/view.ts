import type { ResolveItemsResponse, ShopItemKind } from "@/lib/shop/contract";
import { KIND_ORDER, kindLabel } from "@/lib/shop/labels";
import type { WishlistEntry } from "@/lib/shop/store";

/** What one wishlist card renders: the catalog's current view when known, else what was saved. */
export type WishlistItemVM = {
  key: string;
  kind: ShopItemKind;
  id: number;
  title: string;
  image: string | null;
  href: string;
  tag: string | null;
  instructor: string | null;
  duration: string | null;
  courseCount: number | null;
  addedAt: number;
  /** False when the item left the catalog. */
  available: boolean;
  free: boolean;
  priceAmount: number | null;
  originalAmount: number | null;
  /** Can go in the cart: priced, not free, not a consultation. */
  purchasable: boolean;
};

export type WishlistShow = "all" | "offers" | "free";
export type WishlistSort = "recent" | "price-asc" | "price-desc" | "title";

export type WishlistFilters = {
  /** Null: every kind. */
  type: ShopItemKind | null;
  show: WishlistShow;
  sort: WishlistSort;
  q: string;
};

export const SHOW_OPTIONS: { value: WishlistShow; label: string }[] = [
  { value: "all", label: "كل العناصر" },
  { value: "offers", label: "عليها عرض الآن" },
  { value: "free", label: "المجانية" },
];

export const SORT_OPTIONS: { value: WishlistSort; label: string }[] = [
  { value: "recent", label: "الأحدث إضافةً" },
  { value: "price-asc", label: "السعر: من الأقل" },
  { value: "price-desc", label: "السعر: من الأعلى" },
  { value: "title", label: "الاسم" },
];

export const defaultFilters: WishlistFilters = { type: null, show: "all", sort: "recent", q: "" };

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Filters live in the query string (`/wishlist?type=course&sort=price-asc`), so Back restores them. */
export function parseFilters(params: URLSearchParams): WishlistFilters {
  const type = params.get("type");
  return {
    type: KIND_ORDER.includes(type as ShopItemKind) ? (type as ShopItemKind) : null,
    show: oneOf(
      params.get("show"),
      SHOW_OPTIONS.map((option) => option.value),
      "all",
    ),
    sort: oneOf(
      params.get("sort"),
      SORT_OPTIONS.map((option) => option.value),
      "recent",
    ),
    q: (params.get("q") ?? "").slice(0, 80),
  };
}

/** Query string for these filters; defaults are left out, so the plain URL is the unfiltered list. */
export function filtersQuery(filters: WishlistFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.show !== "all") params.set("show", filters.show);
  if (filters.sort !== "recent") params.set("sort", filters.sort);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return params.toString();
}

export function isFiltered(filters: WishlistFilters): boolean {
  return filters.type !== null || filters.show !== "all" || filters.q.trim() !== "";
}

/**
 * Saved entries joined with the catalog's answer. An entry the catalog hasn't answered for yet (the
 * first load, a just-added item, an unreachable API) shows what was saved; one the catalog says it
 * doesn't know is unavailable.
 */
export function toWishlistItems(entries: readonly WishlistEntry[], resolved: ResolveItemsResponse | undefined): WishlistItemVM[] {
  const live = new Map(resolved?.items.map((item) => [item.key, item]));
  const gone = new Set(resolved?.missing);
  return entries.map((entry) => {
    const item = live.get(entry.key);
    if (item) {
      return { ...item, addedAt: entry.addedAt };
    }
    const available = !gone.has(entry.key);
    return {
      key: entry.key,
      kind: entry.kind,
      id: entry.id,
      title: entry.title,
      image: entry.image,
      href: entry.href,
      tag: kindLabel[entry.kind],
      instructor: null,
      duration: null,
      courseCount: null,
      addedAt: entry.addedAt,
      available,
      free: false,
      priceAmount: entry.priceAmount,
      originalAmount: null,
      purchasable: available && entry.kind !== "consultation" && entry.priceAmount !== null,
    };
  });
}

export function countByKind(items: readonly WishlistItemVM[]): { kind: ShopItemKind; count: number }[] {
  return KIND_ORDER.map((kind) => ({ kind, count: items.filter((item) => item.kind === kind).length })).filter(
    (entry) => entry.count > 0,
  );
}

/** Free items sort as zero; items without a known price always come last. */
function priceOf(item: WishlistItemVM): number | null {
  return item.free ? 0 : item.priceAmount;
}

function byPrice(direction: 1 | -1) {
  return (a: WishlistItemVM, b: WishlistItemVM) => {
    const priceA = priceOf(a);
    const priceB = priceOf(b);
    if (priceA === null || priceB === null) return priceA === priceB ? 0 : priceA === null ? 1 : -1;
    return (priceA - priceB) * direction;
  };
}

export function applyFilters(items: readonly WishlistItemVM[], filters: WishlistFilters): WishlistItemVM[] {
  const query = filters.q.trim().toLocaleLowerCase("ar");
  const kept = items.filter(
    (item) =>
      (!filters.type || item.kind === filters.type) &&
      (filters.show !== "offers" || item.originalAmount !== null) &&
      (filters.show !== "free" || item.free) &&
      (!query ||
        item.title.toLocaleLowerCase("ar").includes(query) ||
        (item.instructor?.toLocaleLowerCase("ar").includes(query) ?? false)),
  );
  switch (filters.sort) {
    case "price-asc":
      return kept.toSorted(byPrice(1));
    case "price-desc":
      return kept.toSorted(byPrice(-1));
    case "title":
      return kept.toSorted((a, b) => a.title.localeCompare(b.title, "ar"));
    default:
      return kept.toSorted((a, b) => b.addedAt - a.addedAt);
  }
}
