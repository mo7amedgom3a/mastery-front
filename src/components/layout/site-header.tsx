import { Search } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { HeaderShopLinks } from "@/components/shop/header-shop-links";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import { HeaderAccount } from "./header-account";
import { MobileNavButton } from "./mobile-nav-button";
import { MobileNavLinks } from "./mobile-nav-links";
import { mobileNav, primaryNav } from "./nav-items";

const MOBILE_NAV_ID = "mobile-nav";

/** Kit `.ma-nav`: sticky, flat, 72px. Below 900px the links move into a native popover drawer. */
export function SiteHeader() {
  return (
    <header className="ma-nav">
      <div className="ma-container ma-nav__inner">
        <AppLink href={routes.home} aria-label="ماستري أكاديمي — الصفحة الرئيسية" className="flex shrink-0 items-center">
          <Logo priority className="w-40 sm:w-48" />
        </AppLink>

        <nav aria-label="القائمة الرئيسية">
          <ul className="ma-nav__links">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <AppLink href={item.href}>{item.label}</AppLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Three groups: the icon tools, the sign-up action, the drawer toggle. */}
        <div className="ma-nav__actions items-center">
          <div role="group" aria-label="أدوات الموقع" className="flex items-center gap-2">
            {/* From 1200px only: below that the bar has no room, and the nav links lead to search anyway. */}
            <AppLink
              href={routes.search}
              aria-label="البحث في البرامج"
              className="ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-11 max-lg:hidden"
            >
              <Search aria-hidden="true" className="size-5 fill-none" />
            </AppLink>
            <HeaderShopLinks />
            <ThemeToggle className="max-md:hidden" />
          </div>
          <HeaderAccount placement="bar" />
          <MobileNavButton
            popoverId={MOBILE_NAV_ID}
            action="open"
            className="ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-11 md:hidden"
          />
        </div>
      </div>

      <div id={MOBILE_NAV_ID} popover="auto" className="mobile-nav md:hidden" aria-label="القائمة">
        <div className="flex min-h-[var(--header-h)] items-center justify-between">
          <Logo className="w-40" />
          <MobileNavButton popoverId={MOBILE_NAV_ID} action="close" />
        </div>
        <nav aria-label="القائمة الرئيسية" className="mt-6 flex-1">
          <MobileNavLinks items={mobileNav} popoverId={MOBILE_NAV_ID} />
        </nav>
        <div className="mb-6 flex items-center justify-between border-t border-line pt-4">
          <span className="text-fg-muted">المظهر</span>
          <ThemeToggle />
        </div>
        <HeaderAccount placement="drawer" />
      </div>
    </header>
  );
}
