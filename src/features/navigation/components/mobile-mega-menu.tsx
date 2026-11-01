"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { mobileSearchLink, navEntries, type NavEntry } from "@/components/layout/nav-items";
import { AppLink } from "@/components/ui/app-link";

import { mapSolutionsMenu } from "../model/mappers";
import { useExploreMenu } from "./menu-context";

const topLinkClass = "flex min-h-16 items-center text-2xl font-bold text-fg no-underline";
const subLinkClass = "flex min-h-11 items-center justify-between gap-3 text-fg-muted no-underline";
const groupTitleClass = "m-0 mt-3 mb-1 text-sm font-bold text-fg";

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-2xl font-bold text-fg">{label}</span>
        <ChevronDown aria-hidden="true" className="size-5 text-fg-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="flex flex-col pb-3 ps-3">{children}</div>
    </details>
  );
}

function SolutionsSection({ label, close }: { label: string; close: () => void }) {
  const menu = useExploreMenu();
  const { categories, types } = mapSolutionsMenu(menu?.groups ?? []);

  return (
    <Section label={label}>
      <p className={groupTitleClass}>حسب نوع البرنامج</p>
      {types.map((type) => (
        <AppLink key={type.type} href={type.href} onClick={close} className={subLinkClass}>
          <span>{type.label}</span>
          {type.count ? <span className="text-xs tabular-nums">{type.count}</span> : null}
        </AppLink>
      ))}
      {categories.length > 0 ? <p className={groupTitleClass}>حسب المجال</p> : null}
      {categories.map((category) => (
        <AppLink key={category.slug} href={category.href} onClick={close} className={subLinkClass}>
          <span>{category.name}</span>
          <span className="text-xs tabular-nums">{category.count}</span>
        </AppLink>
      ))}
    </Section>
  );
}

function PanelSection({ entry, close }: { entry: Extract<NavEntry, { kind: "panel" }>; close: () => void }) {
  return (
    <Section label={entry.label}>
      {entry.columns.map((column) => (
        <div key={column.title}>
          <p className={groupTitleClass}>{column.title}</p>
          {column.links.map((link) => (
            <AppLink key={link.href} href={link.href} onClick={close} className={subLinkClass}>
              {link.label}
            </AppLink>
          ))}
        </div>
      ))}
    </Section>
  );
}

/**
 * The drawer is a native popover and its sections native `<details>`, so no hover panels on touch.
 * This island only closes the drawer after a link is followed, since in-page anchor jumps would
 * otherwise leave it covering the content.
 */
export function MobileMegaMenu({ popoverId }: { popoverId: string }) {
  const close = () => document.getElementById(popoverId)?.hidePopover();

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      <li className="border-b border-line">
        <AppLink href={mobileSearchLink.href} onClick={close} className={topLinkClass}>
          {mobileSearchLink.label}
        </AppLink>
      </li>
      {navEntries.map((entry) => (
        <li key={entry.kind === "link" ? entry.href : entry.id} className="border-b border-line">
          {entry.kind === "link" ? (
            <AppLink href={entry.href} onClick={close} className={topLinkClass}>
              {entry.label}
            </AppLink>
          ) : entry.kind === "catalog" ? (
            <SolutionsSection label={entry.label} close={close} />
          ) : (
            <PanelSection entry={entry} close={close} />
          )}
        </li>
      ))}
    </ul>
  );
}
