"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { NavigationMenu } from "@base-ui/react/navigation-menu";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { isNavEntryActive, navEntries, type NavColumn, type NavEntry, type NavLink } from "@/components/layout/nav-items";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { mapSolutionsMenu } from "../model/mappers";
import { useExploreMenu } from "./menu-context";

/** Fields shown in the panel; the search page has the rest. */
const MAX_CATEGORIES = 15;

const triggerClass =
  "inline-flex cursor-pointer items-center gap-1 border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-0 pt-2 pb-3 font-[inherit] text-[17px] leading-7 font-medium whitespace-nowrap text-fg-muted select-none hover:border-accent hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[active]:border-accent data-[active]:text-fg data-[popup-open]:border-accent data-[popup-open]:text-fg data-[popup-open]:[&>svg]:rotate-180";

const panelLinkClass =
  "rounded-lg text-fg no-underline outline-none hover:bg-surface-alt focus-visible:bg-surface-alt focus-visible:outline-2 focus-visible:outline-focus";

const columnTitleClass = "m-0 mb-2 px-3 text-xs font-bold text-fg-muted";

function CardLink({ link }: { link: NavLink }) {
  const Icon = link.icon;
  return (
    <NavigationMenu.Link
      render={<AppLink href={link.href} />}
      closeOnClick
      className={`${panelLinkClass} flex items-start gap-3 p-3`}
    >
      {Icon ? (
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-alt text-accent">
          <Icon className="size-5" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block font-semibold">{link.label}</span>
        {link.description ? <span className="mt-0.5 block text-sm text-fg-muted">{link.description}</span> : null}
      </span>
    </NavigationMenu.Link>
  );
}

function CountLink({ href, label, count }: { href: NavLink["href"]; label: string; count?: number }) {
  return (
    <NavigationMenu.Link
      render={<AppLink href={href} />}
      closeOnClick
      className={`${panelLinkClass} flex min-h-11 items-center justify-between gap-3 px-3 text-sm`}
    >
      <span className="min-w-0">{label}</span>
      {count ? <span className="text-xs text-fg-muted tabular-nums">{count}</span> : null}
    </NavigationMenu.Link>
  );
}

function SolutionsPanel() {
  const menu = useExploreMenu();
  const { categories, types } = mapSolutionsMenu(menu?.groups ?? []);

  return (
    <div className="flex gap-6">
      {categories.length > 0 ? (
        <section aria-labelledby="mega-fields" className="min-w-0 flex-1">
          <p id="mega-fields" className={columnTitleClass}>
            حسب المجال
          </p>
          <div className="grid grid-cols-3 gap-x-2">
            {categories.slice(0, MAX_CATEGORIES).map((category) => (
              <CountLink key={category.slug} href={category.href} label={category.name} count={category.count} />
            ))}
          </div>
        </section>
      ) : null}
      <section
        aria-labelledby="mega-types"
        className={categories.length > 0 ? "w-56 shrink-0 border-s border-line ps-6" : "w-full"}
      >
        <p id="mega-types" className={columnTitleClass}>
          حسب نوع البرنامج
        </p>
        {types.map((type) => (
          <CountLink key={type.type} href={type.href} label={type.label} count={type.count} />
        ))}
        <NavigationMenu.Link
          render={<AppLink href={routes.search} />}
          closeOnClick
          className={`${panelLinkClass} mt-1 flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-accent`}
        >
          كل البرامج
          <ArrowLeft aria-hidden="true" className="size-4" />
        </NavigationMenu.Link>
      </section>
    </div>
  );
}

function ColumnsPanel({ columns }: { columns: readonly NavColumn[] }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {columns.map((column) => (
        <section key={column.title} aria-label={column.title} className="min-w-0">
          <p aria-hidden="true" className={columnTitleClass}>
            {column.title}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {column.links.map((link) => (
              <CardLink key={link.href} link={link} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PanelItem({ entry, active }: { entry: Exclude<NavEntry, { kind: "link" }>; active: boolean }) {
  return (
    <NavigationMenu.Item value={entry.id}>
      <NavigationMenu.Trigger className={triggerClass} data-active={active ? "" : undefined}>
        {entry.label}
        <ChevronDown aria-hidden="true" className="size-4 transition-transform motion-reduce:transition-none" />
      </NavigationMenu.Trigger>
      <NavigationMenu.Content className="w-[var(--anchor-width)] p-6 transition-opacity duration-150 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
        {entry.kind === "catalog" ? <SolutionsPanel /> : <ColumnsPanel columns={entry.columns} />}
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  );
}

/** The desktop bar: panels span the header's container, whichever trigger opened them. */
export function MegaMenu() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);

  return (
    <DirectionProvider direction="rtl">
      <NavigationMenu.Root ref={rootRef} aria-label="القائمة الرئيسية" delay={80} closeDelay={120} className="max-lg:hidden">
        <NavigationMenu.List className="ma-nav__links">
          {navEntries.map((entry) => {
            const active = isNavEntryActive(entry, pathname);
            return entry.kind === "link" ? (
              <NavigationMenu.Item key={entry.href}>
                <NavigationMenu.Link render={<AppLink href={entry.href} />} active={active} className="whitespace-nowrap">
                  {entry.label}
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            ) : (
              <PanelItem key={entry.id} entry={entry} active={active} />
            );
          })}
        </NavigationMenu.List>
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner
            anchor={() => rootRef.current?.closest(".ma-nav__inner") ?? null}
            side="bottom"
            align="center"
            collisionAvoidance={{ side: "none" }}
            className="z-[60] outline-none"
          >
            <NavigationMenu.Popup className="h-[var(--popup-height)] w-[var(--anchor-width)] overflow-hidden rounded-b-panel border border-t-0 border-line-strong bg-surface shadow-lg transition-[height,opacity] duration-150 ease-out outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
              <NavigationMenu.Viewport className="relative h-full w-full" />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>
    </DirectionProvider>
  );
}
