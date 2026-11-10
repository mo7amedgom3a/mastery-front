"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useDeferredValue, useId, useState } from "react";

import { commerceQueries } from "@/lib/api/commerce";
import { searchKeys, searchProducts } from "@/lib/api/search";
import { cn } from "@/lib/cn";

export type PickedProduct = {
  product_id: string;
  title: string;
  product_type: string;
  slug: string;
};

const TYPE_LABELS: Record<string, string> = {
  course: "كورس",
  diploma: "دبلومة",
  live_diploma: "دبلومة مباشرة",
  package: "باقة",
  bundle: "حزمة",
  consultation: "استشارة",
};

export function productTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? "منتج";
}

/**
 * Pin any product to a planner entry: the student's own products first, or any catalog product
 * found by name (planning to take it later is fine).
 */
export function ProductPicker({ value, onChange }: { value: PickedProduct | null; onChange: (next: PickedProduct | null) => void }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const term = useDeferredValue(query.trim());
  const owned = useQuery({
    ...commerceQueries.ownedProducts({ limit: 50 }),
    enabled: !value,
  });
  const params = { q: term, limit: 8 };
  const found = useQuery({
    queryKey: searchKeys.results(params),
    queryFn: ({ signal }) => searchProducts(params, { signal }),
    enabled: !value && term.length >= 2,
    staleTime: 60_000,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-control border border-line-strong px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{value.title}</span>
          <span className="text-xs text-fg-muted">{productTypeLabel(value.product_type)}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9"
          aria-label="إزالة المحتوى المرتبط"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    );
  }

  const ownedItems: PickedProduct[] = (owned.data?.items ?? []).map((item) => ({
    product_id: item.product_id,
    title: item.title ?? item.slug,
    product_type: item.product_type,
    slug: item.slug,
  }));
  const options: PickedProduct[] =
    term.length >= 2
      ? (found.data?.items ?? [])
          .filter((item) => Boolean(item.slug) && (item.result_type === undefined || item.result_type === "product"))
          .map((item) => ({
            product_id: item.id,
            title: item.title ?? item.slug ?? "",
            product_type: item.product_type ?? "course",
            slug: item.slug ?? "",
          }))
      : ownedItems.filter((item) => item.title.includes(term)).slice(0, 8);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="relative block">
        <span className="sr-only">ابحث عن كورس أو دبلومة</span>
        <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث في محتواك أو في كل الكورسات"
          className="ma-input ps-9"
          autoComplete="off"
        />
      </label>
      <p className="m-0 text-xs text-fg-muted">{term.length >= 2 ? "نتائج البحث" : "من محتواك"}</p>
      <ul className="m-0 flex max-h-48 list-none flex-col overflow-y-auto p-0" aria-live="polite">
        {(term.length >= 2 ? found.isFetching : owned.isPending) ? (
          <li className="px-1 py-2 text-sm text-fg-muted">جارٍ التحميل…</li>
        ) : options.length === 0 ? (
          <li className="px-1 py-2 text-sm text-fg-muted">{term.length >= 2 ? "لا نتائج." : "اكتب حرفين على الأقل للبحث."}</li>
        ) : (
          options.map((option) => (
            <li key={option.product_id}>
              <button
                type="button"
                onClick={() => onChange(option)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-control border-0 bg-transparent px-2 py-2 text-start font-[inherit] text-fg hover:bg-surface-alt",
                )}
              >
                <span className="min-w-0 truncate">{option.title}</span>
                <span className="shrink-0 text-xs text-fg-muted">{productTypeLabel(option.product_type)}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
