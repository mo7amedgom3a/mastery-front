"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpen, Loader2, Search, Sparkles, TrendingUp } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import {
  AUTOCOMPLETE_LIMIT,
  searchQueries,
  type AutocompleteResult,
  type AutocompleteSuggestion,
} from "@/lib/api/search";
import { cn } from "@/lib/cn";
import {
  trackAutocompleteImpression,
  trackAutocompleteSelection,
} from "@/lib/observability/behavior";
import { catalogProductHref } from "@/lib/shop/product-links";

import { autocompleteCopy, autocompleteTypeLabel } from "../content/copy";
import { useDebouncedValue } from "../model/use-debounced-value";

type SearchAutocompleteProps = {
  /** Initial text; the page re-mounts this component (keyed) when the URL's query changes. */
  defaultQuery: string;
  placeholder: string;
  label: string;
  inputId?: string;
  maxLength?: number;
};

type Item =
  | { kind: "suggestion"; value: AutocompleteSuggestion; position: number }
  | { kind: "result"; value: AutocompleteResult; position: number }
  | { kind: "submit" };

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;
const MAX_IMPRESSIONS = 20;
const ICON_BOX = "flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-alt text-fg-muted";

/**
 * The search page's combobox: debounced suggestions and matching programs over the dedicated
 * typeahead endpoint, with full keyboard support. It stays a plain `name="q"` field inside the
 * page's GET form, so submitting still works without JavaScript.
 */
export function SearchAutocomplete({
  defaultQuery,
  placeholder,
  label,
  inputId = "search-q",
  maxLength = 200,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const listId = useId();
  const suggestionsHeadingId = `${listId}-suggestions`;
  const resultsHeadingId = `${listId}-results`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const impressions = useRef(new Set<string>());

  const [query, setQuery] = useState(defaultQuery);
  const [dismissed, setDismissed] = useState(true);
  // The active option belongs to the debounced query that produced it: when a new query's data
  // arrives (or the query changes) the old index is ignored instead of highlighting a different
  // row. Keeping the query in the state avoids synchronising it with an effect.
  const [active, setActive] = useState<{ index: number; query: string }>({
    index: -1,
    query: "",
  });

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, DEBOUNCE_MS);
  // Fetch only in the browser and only while the panel is in use: a server-rendered search URL
  // must not fire a typeahead request before the visitor touches the box.
  const enabled = typeof window !== "undefined" && !dismissed && debounced.length >= MIN_CHARS;
  const autocomplete = useQuery({
    ...searchQueries.autocomplete({ q: debounced, limit: AUTOCOMPLETE_LIMIT }),
    enabled,
  });

  const suggestions = autocomplete.data?.suggestions ?? [];
  const results = autocomplete.data?.results ?? [];
  const items = useMemo<Item[]>(() => {
    const data = autocomplete.data;
    const suggestions = (data?.suggestions ?? []).map<Item>((value, position) => ({
      kind: "suggestion",
      value,
      position,
    }));
    const results = (data?.results ?? []).map<Item>((value, position) => ({
      kind: "result",
      value,
      position: suggestions.length + position,
    }));
    return [...suggestions, ...results, { kind: "submit" }];
  }, [autocomplete.data]);

  const panelVisible = !dismissed && trimmed.length >= MIN_CHARS;
  const activeIndex = active.query === debounced ? active.index : -1;
  const currentActive = activeIndex >= 0 && activeIndex < items.length ? activeIndex : -1;
  const loading = autocomplete.isFetching && !autocomplete.data;

  const setActiveIndex = (index: number) => setActive({ index, query: debounced });

  useEffect(() => {
    if (!panelVisible) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setDismissed(true);
        setActive({ index: -1, query: debounced });
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [debounced, panelVisible]);

  useEffect(() => {
    if (!panelVisible || currentActive < 0) return;
    document
      .getElementById(`${listId}-option-${currentActive}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [currentActive, listId, panelVisible]);

  useEffect(() => {
    if (!panelVisible || !enabled || autocomplete.isFetching) return;
    if (suggestions.length === 0 && results.length === 0) return;
    if (impressions.current.has(debounced) || impressions.current.size >= MAX_IMPRESSIONS) return;
    impressions.current.add(debounced);
    trackAutocompleteImpression({
      query: debounced,
      suggestionCount: suggestions.length,
      resultCount: results.length,
    });
  }, [
    autocomplete.isFetching,
    debounced,
    enabled,
    panelVisible,
    results.length,
    suggestions.length,
  ]);

  const optionId = (index: number) => `${listId}-option-${index}`;

  const submit = (text: string) => {
    const input = inputRef.current;
    // Set the DOM value as well as the state: requestSubmit reads the form synchronously.
    if (input) input.value = text;
    setQuery(text);
    setDismissed(true);
    setActiveIndex(-1);
    input?.form?.requestSubmit();
  };

  const activate = (item: Item | undefined) => {
    if (!item) return;
    if (item.kind === "suggestion") {
      trackAutocompleteSelection({
        query: trimmed,
        text: item.value.text,
        type: item.value.type,
        kind: "suggestion",
        position: item.position,
        suggestionCount: suggestions.length,
        resultCount: results.length,
      });
      submit(item.value.text);
      return;
    }
    if (item.kind === "result") {
      trackAutocompleteSelection({
        query: trimmed,
        text: item.value.title,
        type: item.value.type,
        kind: "result",
        position: item.position,
        suggestionCount: suggestions.length,
        resultCount: results.length,
      });
      const href =
        item.value.url ??
        (item.value.slug ? catalogProductHref(item.value.slug, item.value.type) : null);
      setDismissed(true);
      setActiveIndex(-1);
      if (href) router.push(href as Route);
      else submit(item.value.title);
      return;
    }
    submit(trimmed);
  };

  const move = (delta: number) => {
    setDismissed(false);
    const count = items.length;
    if (count === 0) return;
    const safe = currentActive >= 0 && currentActive < count ? currentActive : delta > 0 ? -1 : 0;
    setActiveIndex((safe + delta + count) % count);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      if (panelVisible) {
        event.preventDefault();
        setDismissed(true);
        setActiveIndex(-1);
      }
      return;
    }
    if (event.key === "Tab") {
      setDismissed(true);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
      return;
    }
    if (event.key === "Home" && panelVisible) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && panelVisible) {
      event.preventDefault();
      setActiveIndex(items.length - 1);
      return;
    }
    if (event.key === "Enter" && panelVisible && currentActive >= 0) {
      event.preventDefault();
      activate(items[currentActive]);
    }
  };

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        name="q"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setDismissed(false);
        }}
        onFocus={() => setDismissed(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        enterKeyHint="search"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={panelVisible}
        aria-controls={panelVisible ? listId : undefined}
        aria-activedescendant={
          panelVisible && currentActive >= 0 ? optionId(currentActive) : undefined
        }
        className={cn("ma-input min-h-14 w-full text-lg", autocomplete.isFetching && "pe-10")}
      />
      {autocomplete.isFetching ? (
        <Loader2
          aria-hidden="true"
          className="pointer-events-none absolute end-3 top-7 size-5 -translate-y-1/2 animate-spin text-fg-muted"
        />
      ) : null}
      <span role="status" aria-live="polite" className="sr-only">
        {panelVisible
          ? loading
            ? autocompleteCopy.loading
            : autocompleteCopy.status(suggestions.length, results.length)
          : ""}
      </span>

      {panelVisible ? (
        <div
          id={listId}
          role="listbox"
          aria-label={autocompleteCopy.listLabel}
          className="absolute inset-x-0 top-full z-[70] mt-2 overflow-hidden rounded-panel border border-line-strong bg-surface"
        >
          <div className="max-h-[40dvh] overflow-y-auto py-2 sm:max-h-[min(60dvh,28rem)]">
            {loading ? (
              <p className="m-0 px-4 py-3 text-sm text-fg-muted" role="presentation">
                {autocompleteCopy.loading}
              </p>
            ) : null}

            {suggestions.length > 0 ? (
              <div role="group" aria-labelledby={suggestionsHeadingId}>
                <p
                  id={suggestionsHeadingId}
                  className="m-0 px-4 pt-2 pb-1 text-xs font-bold tracking-wide text-fg-muted"
                >
                  {autocompleteCopy.suggestions}
                </p>
                <ul role="presentation" className="m-0 list-none p-0">
                  {suggestions.map((suggestion, position) => (
                    <li
                      key={`suggestion-${position}-${suggestion.text}`}
                      id={optionId(position)}
                      role="option"
                      aria-selected={currentActive === position}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 text-start text-fg",
                        currentActive === position && "bg-surface-alt",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(position)}
                      onClick={() => activate(items[position])}
                    >
                      <span className={ICON_BOX} aria-hidden="true">
                        {suggestion.type === "popular_search" ? (
                          <TrendingUp className="size-4" />
                        ) : suggestion.type === "spelling" ? (
                          <Sparkles className="size-4" />
                        ) : (
                          <Search className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {suggestion.type === "spelling" ? (
                            <span className="text-fg-muted">{autocompleteCopy.spelling} </span>
                          ) : null}
                          <Highlighted text={suggestion.text} query={trimmed} />
                        </span>
                        {suggestion.type === "popular_search" ? (
                          <span className="mt-0.5 block text-xs text-fg-muted">
                            {autocompleteCopy.popular}
                          </span>
                        ) : null}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-fg-muted"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {results.length > 0 ? (
              <div role="group" aria-labelledby={resultsHeadingId}>
                <p
                  id={resultsHeadingId}
                  className="m-0 px-4 pt-3 pb-1 text-xs font-bold tracking-wide text-fg-muted"
                >
                  {autocompleteCopy.results}
                </p>
                <ul role="presentation" className="m-0 list-none p-0">
                  {results.map((result, offset) => {
                    const position = suggestions.length + offset;
                    return (
                      <li
                        key={`result-${position}-${result.id}`}
                        id={optionId(position)}
                        role="option"
                        aria-selected={currentActive === position}
                        className={cn(
                          "flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 text-start text-fg",
                          currentActive === position && "bg-surface-alt",
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveIndex(position)}
                        onClick={() => activate(items[position])}
                      >
                        {result.image ? (
                          <Image
                            src={result.image}
                            alt=""
                            width={40}
                            height={40}
                            sizes="40px"
                            className="size-10 shrink-0 rounded-ctl object-cover"
                          />
                        ) : (
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-ctl bg-surface-alt text-fg-muted"
                            aria-hidden="true"
                          >
                            <BookOpen className="size-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{result.title}</span>
                          <span className="mt-0.5 block text-xs text-fg-muted">
                            {autocompleteTypeLabel(result.type)}
                            {result.rating !== null ? ` · ${result.rating.toFixed(1)}` : ""}
                          </span>
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-fg-muted"
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {!loading && suggestions.length === 0 && results.length === 0 ? (
              <p className="m-0 px-4 py-3 text-sm text-fg-muted">
                {autocomplete.isError ? autocompleteCopy.error : autocompleteCopy.empty}
              </p>
            ) : null}

            <div
              id={optionId(items.length - 1)}
              role="option"
              aria-selected={currentActive === items.length - 1}
              className={cn(
                "mt-1 flex min-h-12 cursor-pointer items-center gap-3 border-t border-line px-4 py-3 text-start font-medium text-fg",
                currentActive === items.length - 1 && "bg-surface-alt",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(items.length - 1)}
              onClick={() => activate({ kind: "submit" })}
            >
              <Search aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
              <span className="min-w-0 truncate">{autocompleteCopy.searchFor(trimmed)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Bolds the typed prefix when it appears literally; Arabic spelling variants stay plain. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-bold text-accent">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}
