"use client";

import { ChevronLeft, Menu, Search, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";

import { HeaderAccount } from "@/components/layout/header-account";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { formatNumber } from "@/lib/format";
import { useShopHydrated, useShopStore } from "@/lib/shop/store";

import { studentNavLabel } from "./student-nav";

type StudentTopbarProps = {
  open: boolean;
  onOpenMenu: () => void;
};

/** The demo's slim topbar: breadcrumbs on the start side, search/cart/theme/account on the end. */
export function StudentTopbar({ open, onOpenMenu }: StudentTopbarProps) {
  const pathname = usePathname();
  const home = pathname === routes.studentHome;
  const label = home ? "لوحتي" : studentNavLabel(pathname);
  const hydrated = useShopHydrated();
  const cart = useShopStore((state) => state.cart.length);
  const cartCount = hydrated ? cart : 0;

  return (
    <header className="sticky top-0 z-40 flex h-[var(--header-h)] items-center gap-2 border-b border-line bg-surface/90 px-[clamp(16px,2vw,32px)] backdrop-blur-md">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-expanded={open}
        aria-controls="student-sidebar"
        aria-label="فتح القائمة"
        className="ma-btn ma-btn--bare ma-btn--icon size-11 lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5 fill-none" />
      </button>

      <nav aria-label="مسار الصفحة" className="flex min-w-0 items-center gap-1.5 text-sm text-fg-muted">
        {home ? null : (
          <>
            <AppLink href={routes.studentHome} className="shrink-0 no-underline hover:text-fg">
              لوحتي
            </AppLink>
            <ChevronLeft aria-hidden="true" className="size-3.5 shrink-0 fill-none" />
          </>
        )}
        <span aria-current="page" className="truncate font-semibold text-fg">
          {label}
        </span>
      </nav>

      <div className="ms-auto flex items-center gap-0.5">
        <AppLink
          href={routes.search}
          className="hidden min-h-10 items-center gap-2 rounded-ctl border border-line px-3 text-sm text-fg-muted no-underline hover:border-line-strong hover:text-fg md:inline-flex"
        >
          <Search aria-hidden="true" className="size-4 shrink-0 fill-none" />
          <span className="whitespace-nowrap">ابحث في برامجك</span>
          <kbd
            dir="ltr"
            className="ms-1 rounded border border-line px-1 font-mono text-[11px] leading-[18px] text-fg-muted"
          >
            Ctrl K
          </kbd>
        </AppLink>
        <AppLink
          href={routes.search}
          aria-label="البحث في البرامج"
          className="ma-btn ma-btn--bare ma-btn--icon size-11 md:hidden"
        >
          <Search aria-hidden="true" className="size-5 fill-none" />
        </AppLink>

        <AppLink
          href={routes.studentCart}
          aria-label={cartCount > 0 ? `السلة (${formatNumber(cartCount)})` : "السلة"}
          className="ma-btn ma-btn--bare ma-btn--icon relative size-11"
        >
          <ShoppingCart aria-hidden="true" className="size-5 fill-none" />
          {cartCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute end-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] leading-[18px] font-bold text-on-accent tabular-nums"
            >
              {formatNumber(cartCount)}
            </span>
          ) : null}
        </AppLink>

        <ThemeToggle className="max-lg:hidden" />
        <HeaderAccount placement="bar" />
      </div>
    </header>
  );
}
