"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

import { SEARCH_PATH, parseSearchParams, searchHref, type RawSearchParams } from "../model/params";

type SearchNav = {
  /** A filter change is on its way: the results on screen are about to be replaced. */
  pending: boolean;
  navigate: (href: Route, options?: { scroll?: boolean }) => void;
};

const SearchNavContext = createContext<SearchNav | null>(null);

/**
 * Runs every filter change as one transition, so the current results stay on screen (dimmed, see
 * `PendingRegion`) until the next ones arrive instead of being swapped for a skeleton. Links and
 * forms below keep a real `href`/`action`: without JavaScript they are plain navigations.
 */
export function SearchNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback<SearchNav["navigate"]>(
    (href, { scroll = false } = {}) => startTransition(() => router.push(href, { scroll })),
    [router],
  );
  const value = useMemo(() => ({ pending, navigate }), [pending, navigate]);
  return <SearchNavContext value={value}>{children}</SearchNavContext>;
}

type FilterLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: Route;
  /** Filters keep the scroll position; pagination goes back to the top. */
  scroll?: boolean;
};

/** A link to another search state. Not prefetched: every state is rendered on demand. */
export function FilterLink({ href, scroll = false, children, ...rest }: FilterLinkProps) {
  const nav = useContext(SearchNavContext);
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={scroll}
      onNavigate={(event) => {
        if (!nav) return;
        event.preventDefault();
        nav.navigate(href, { scroll });
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}

type SearchFormProps = Omit<ComponentProps<"form">, "action" | "method" | "onSubmit"> & {
  /** A popover (the mobile filter drawer) to close once the form is submitted. */
  closePopoverId?: string;
};

/**
 * GET form for the search page. With JavaScript the fields are read into the canonical URL and
 * followed as a transition; without it the browser submits the same fields itself.
 */
export function SearchForm({ closePopoverId, children, ...rest }: SearchFormProps) {
  const nav = useContext(SearchNavContext);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!nav) return;
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const raw: RawSearchParams = {};
    for (const [name, value] of new FormData(event.currentTarget, submitter)) {
      if (typeof value !== "string" || !value.trim()) continue;
      const existing = raw[name];
      raw[name] = existing === undefined ? value : [...(Array.isArray(existing) ? existing : [existing]), value];
    }
    if (closePopoverId) {
      const popover = document.getElementById(closePopoverId);
      if (popover?.matches(":popover-open")) popover.hidePopover();
    }
    nav.navigate(searchHref(parseSearchParams(raw)));
  };

  return (
    <form action={SEARCH_PATH} method="get" onSubmit={onSubmit} {...rest}>
      {children}
    </form>
  );
}

/** Submits its form as soon as the choice changes (the sort order). */
export function AutoSubmitSelect({ children, ...rest }: Omit<ComponentProps<"select">, "onChange">) {
  return (
    <select onChange={(event) => event.currentTarget.form?.requestSubmit()} {...rest}>
      {children}
    </select>
  );
}

/** Dims its content while a filter change is loading, and tells assistive tech it is busy. */
export function PendingRegion({ className, children }: { className?: string; children: ReactNode }) {
  const pending = useContext(SearchNavContext)?.pending ?? false;
  return (
    <div
      aria-busy={pending}
      className={cn("transition-opacity duration-150", pending && "pointer-events-none opacity-50", className)}
    >
      {children}
    </div>
  );
}
