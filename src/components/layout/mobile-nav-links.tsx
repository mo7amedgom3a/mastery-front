"use client";

import { AppLink } from "@/components/ui/app-link";

import type { NavItem } from "./nav-items";

type MobileNavLinksProps = {
  items: readonly NavItem[];
  popoverId: string;
};

/**
 * The drawer itself is a native popover (no JS). This island only closes it after a link is
 * followed, since in-page anchor jumps would otherwise leave it covering the content.
 */
export function MobileNavLinks({ items, popoverId }: MobileNavLinksProps) {
  const close = () => document.getElementById(popoverId)?.hidePopover();

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {items.map((item) => (
        <li key={item.href} className="border-b border-line">
          <AppLink href={item.href} onClick={close} className="flex min-h-16 items-center text-2xl font-bold text-fg no-underline">
            {item.label}
          </AppLink>
        </li>
      ))}
    </ul>
  );
}
