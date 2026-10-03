"use client";

import type { Route } from "next";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { trackProductClickFromHref, type ClickContext } from "@/lib/observability/behavior";

type TrackedCardLinkProps = {
  href: Route;
  title: string;
  tracking?: ClickContext;
  className?: string;
  children: ReactNode;
};

/**
 * The stretched link that makes a whole product card clickable. Tracks the click (kind + id parsed
 * from the detail href, plus where on the page it happened) and then lets the navigation proceed.
 */
export function TrackedCardLink({ href, title, tracking, className, children }: TrackedCardLinkProps) {
  return (
    <AppLink href={href} className={className} onClick={() => trackProductClickFromHref(href, title, tracking)}>
      {children}
    </AppLink>
  );
}
