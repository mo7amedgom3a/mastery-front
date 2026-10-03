"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Search, ShoppingCart, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { UndoNotice } from "@/components/shop/undo-notice";
import { ButtonLink } from "@/components/ui/button";
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { shopQueries } from "@/features/cart/api/shop-client";
import { RecommendationRail } from "@/features/search/components/recommendation-rail";
import { useAuthStore } from "@/lib/auth/store";
import { cn } from "@/lib/cn";
import { formatCount, formatNumber } from "@/lib/format";
import { trackCartBulk } from "@/lib/observability/behavior";
import { ITEM_FORMS, kindPluralLabel } from "@/lib/shop/labels";
import { useShopHydrated, useShopStore, type WishlistEntry } from "@/lib/shop/store";
import { removeFromWishlist } from "@/lib/shop/use-shop-actions";
import { useUndo } from "@/lib/shop/use-undo";
import { pushWishlistEntry } from "@/lib/shop/wishlist-sync";

import { useAccountWishlist } from "./api/use-account-wishlist";
import { WishlistCard } from "./components/wishlist-card";
import {
  SHOW_OPTIONS,
  SORT_OPTIONS,
  applyFilters,
  countByKind,
  defaultFilters,
  filtersQuery,
  isFiltered,
  parseFilters,
  toWishlistItems,
  type WishlistFilters,
  type WishlistItemVM,
  type WishlistShow,
  type WishlistSort,
} from "./model/view";

/** Four cards per row on desktop, three from 900px, two on tablets, one on phones. */
const CARD_SIZES = "(min-width: 1200px) 390px, (min-width: 900px) 30vw, (min-width: 600px) 45vw, 100vw";
const GRID = "m-0 grid list-none gap-6 p-0 sm:grid-cols-2 md:grid-cols-3";
/** The search box only earns its place once the list is long enough to scan. */
const SEARCH_FROM = 6;

type Removed = { entry: WishlistEntry; index: number };

/**
 * Everything the visitor saved — courses, diplomas, packages and consultations — with filters, and
 * the way on from each: into the cart, to booking, or to enrolment. The list lives in this browser
 * (and on the account once signed in); prices and availability are read from the catalog on load.
 */
export function WishlistPage() {
  const hydrated = useShopHydrated();
  const entries = useShopStore((state) => state.wishlist);
  const cart = useShopStore((state) => state.cart);
  const addToCart = useShopStore((state) => state.addToCart);
  const signedOut = useAuthStore((state) => state.status === "unauthenticated");
  useAccountWishlist(hydrated);

  const keys = useMemo(() => entries.map((entry) => entry.key), [entries]);
  const resolved = useQuery({ ...shopQueries.items(keys), enabled: hydrated && keys.length > 0 });
  const items = useMemo(() => toWishlistItems(entries, resolved.data), [entries, resolved.data]);

  // Filters live in the query string. `history.replaceState` updates it without a server round
  // trip, and `useSearchParams` follows along.
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [queryText, setQueryText] = useState(filters.q);
  const setFilters = (patch: Partial<WishlistFilters>) => {
    const query = filtersQuery({ ...filters, ...patch });
    window.history.replaceState(null, "", query ? `${routes.wishlist}?${query}` : routes.wishlist);
  };
  const clearFilters = () => {
    setQueryText("");
    setFilters({ ...defaultFilters, sort: filters.sort });
  };

  const visible = useMemo(() => applyFilters(items, filters), [items, filters]);
  const inCart = useMemo(() => new Set(cart.map((line) => line.key)), [cart]);
  const addable = visible.filter((item) => item.purchasable && !inCart.has(item.key));

  const undo = useUndo<Removed>();
  const remove = (item: WishlistItemVM) => {
    const index = entries.findIndex((entry) => entry.key === item.key);
    if (index < 0) return;
    undo.offer({ entry: entries[index], index });
    removeFromWishlist(item.key);
  };
  const restore = () => {
    if (!undo.pending) return;
    // Back as a local entry; a signed-in visitor gets it on the account again.
    const entry: WishlistEntry = { ...undo.pending.entry, synced: false };
    useShopStore.getState().restoreWishlistEntry(entry, undo.pending.index);
    if (useAuthStore.getState().status === "authenticated") void pushWishlistEntry(entry);
    undo.clear();
  };

  if (!hydrated) {
    return <WishlistSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-12">
        {undo.pending ? (
          <UndoNotice onUndo={restore} onDismiss={undo.clear}>
            أُزيل «{undo.pending.entry.title}» من المفضلة.
          </UndoNotice>
        ) : null}
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
          <Heart aria-hidden="true" className="size-8 text-accent" />
          <h2 className="m-0 text-2xl leading-10 font-bold">قائمة المفضلة فارغة</h2>
          <p className="m-0 max-w-[52ch] text-fg-muted">
            اضغط على القلب في أي دورة أو دبلوم أو باقة أو استشارة لتحفظها هنا، وتعود إليها متى شئت.
          </p>
          <ul className="ma-cluster m-0 list-none p-0">
            <li>
              <ButtonLink href={routes.search} variant="primary">
                تصفّح البرامج
              </ButtonLink>
            </li>
            <li>
              <ButtonLink href={routes.consultations} variant="soft">
                تصفّح الاستشارات
              </ButtonLink>
            </li>
          </ul>
        </div>
        <RecommendationRail />
      </div>
    );
  }

  const kinds = countByKind(items);
  const filtered = isFiltered(filters);

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- Filters ---------- */}
      <div className="flex flex-col gap-4">
        <ul aria-label="نوع العنصر" className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li>
            <TypeChip label="الكل" count={items.length} selected={filters.type === null} onSelect={() => setFilters({ type: null })} />
          </li>
          {kinds.map(({ kind, count }) => (
            <li key={kind}>
              <TypeChip
                label={kindPluralLabel[kind]}
                count={count}
                selected={filters.type === kind}
                onSelect={() => setFilters({ type: filters.type === kind ? null : kind })}
              />
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {items.length >= SEARCH_FROM ? (
            <div className="ma-field min-w-0 flex-1 basis-56">
              <label htmlFor="wishlist-q" className="ma-label">
                ابحث في المفضلة
              </label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-fg-muted" />
                <input
                  id="wishlist-q"
                  type="search"
                  value={queryText}
                  onChange={(event) => {
                    setQueryText(event.target.value);
                    setFilters({ q: event.target.value });
                  }}
                  placeholder="اسم البرنامج أو المدرّب"
                  maxLength={80}
                  className="ma-input ps-11"
                />
              </div>
            </div>
          ) : null}
          <div className="ma-field">
            <label htmlFor="wishlist-show" className="ma-label">
              اعرض
            </label>
            <select
              id="wishlist-show"
              value={filters.show}
              onChange={(event) => setFilters({ show: event.target.value as WishlistShow })}
              className="ma-select w-auto"
            >
              {SHOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ma-field">
            <label htmlFor="wishlist-sort" className="ma-label">
              الترتيب
            </label>
            <select
              id="wishlist-sort"
              value={filters.sort}
              onChange={(event) => setFilters({ sort: event.target.value as WishlistSort })}
              className="ma-select w-auto"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ---------- Count and bulk action ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
        <p role="status" className="m-0 text-fg-muted">
          {filtered
            ? `${formatCount(visible.length, ITEM_FORMS)} من ${formatNumber(items.length)}`
            : formatCount(items.length, ITEM_FORMS)}
          {filtered ? (
            <>
              {" · "}
              <button type="button" onClick={clearFilters} className="ma-link cursor-pointer border-0 bg-transparent p-0 font-[inherit]">
                امسح الفلاتر
              </button>
            </>
          ) : null}
        </p>
        {addable.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              addable.forEach((item) => addToCart(item));
              trackCartBulk(addable);
            }}
            className="ma-btn ma-btn--secondary ma-btn--sm min-h-11 gap-2"
          >
            <ShoppingCart aria-hidden="true" className="size-[18px] fill-none" />
            {addable.length === 1 ? "أضف إلى السلة" : `أضف الكل إلى السلة (${formatNumber(addable.length)})`}
          </button>
        ) : null}
      </div>

      {undo.pending ? (
        <UndoNotice onUndo={restore} onDismiss={undo.clear}>
          أُزيل «{undo.pending.entry.title}» من المفضلة.
        </UndoNotice>
      ) : null}

      {resolved.isError ? (
        <div className="ma-alert ma-alert--warning" role="alert">
          <TriangleAlert aria-hidden="true" className="fill-none" />
          <div>
            <p className="ma-alert__title">تعذّر تحديث الأسعار</p>
            <p className="ma-alert__text">
              تظهر العناصر بأسعارها وقت الحفظ، وقد تكون تغيّرت.{" "}
              <button
                type="button"
                onClick={() => void resolved.refetch()}
                className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold text-ink underline"
              >
                أعد المحاولة
              </button>
            </p>
          </div>
        </div>
      ) : null}

      {/* ---------- Items ---------- */}
      {visible.length > 0 ? (
        <ul
          aria-label="العناصر المحفوظة"
          aria-busy={resolved.isFetching}
          className={cn(GRID, resolved.isPending && "animate-pulse motion-reduce:animate-none")}
        >
          {visible.map((item) => (
            <li key={item.key} className="min-w-0">
              <WishlistCard
                item={item}
                inCart={inCart.has(item.key)}
                onAddToCart={addToCart}
                onRemove={remove}
                sizes={CARD_SIZES}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
          <h2 className="m-0 text-2xl leading-10 font-bold">لا عناصر بهذه الفلاتر</h2>
          <p className="m-0 max-w-[52ch] text-fg-muted">في قائمتك عناصر أخرى لا تطابق ما اخترته. امسح الفلاتر لتراها كلها.</p>
          <button type="button" onClick={clearFilters} className="ma-btn ma-btn--soft">
            امسح الفلاتر
          </button>
        </div>
      )}

      {signedOut ? (
        <p className="m-0 border-t border-line pt-4 text-sm leading-6 text-fg-muted">
          قائمتك محفوظة على هذا المتصفح فقط. بعد تسجيل الدخول تُحفظ في حسابك وتجدها على كل أجهزتك.
        </p>
      ) : null}
    </div>
  );
}

function TypeChip({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn("ma-btn ma-btn--sm min-h-11 gap-2", selected ? "ma-btn--secondary" : "ma-btn--soft")}
    >
      {label}
      <span className="tabular-nums opacity-70">{formatNumber(count)}</span>
    </button>
  );
}

/** Held while the saved list is read from storage, so the empty state never flashes first. */
export function WishlistSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">جارٍ تحميل المفضلة…</span>
      <div aria-hidden="true" className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-11 w-24" />
        ))}
      </div>
      <ul aria-hidden="true" className={cn(GRID, "mt-8")}>
        {[0, 1, 2].map((index) => (
          <li key={index} className={cn("overflow-hidden rounded-panel border border-line", index > 0 && "max-sm:hidden", index > 1 && "max-md:hidden")}>
            <CardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
