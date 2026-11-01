import { Search } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { HeaderShopLinks } from "@/components/shop/header-shop-links";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { MegaMenu } from "@/features/navigation/components/mega-menu";
import { MobileMegaMenu } from "@/features/navigation/components/mobile-mega-menu";

import { HeaderAccount } from "./header-account";
import { MobileNavButton } from "./mobile-nav-button";

const MOBILE_NAV_ID = "mobile-nav";

/**
 * Kit `.ma-nav`: sticky, flat, 72px. Below 1200px the links move into a native popover drawer.
 * `brand="business"` shows the eMastery Business logo (company pages).
 */
export function SiteHeader({ brand = "default" }: { brand?: "default" | "business" }) {
  return (
    <header className="ma-nav">
      <div className="ma-container ma-nav__inner">
        <AppLink href={routes.home} prefetch aria-label="ماستري أكاديمي — الصفحة الرئيسية" className="flex shrink-0 items-center">
          {brand === "business" ? (
            <Logo priority variant="business" height={15} />
          ) : (
            <Logo priority className="w-40 sm:w-48" />
          )}
        </AppLink>

        <MegaMenu />

        {/* Four groups: the icon tools, the subscribe call to action, the account action, the drawer toggle. */}
        <div className="ma-nav__actions items-center">
          <div role="group" aria-label="أدوات الموقع" className="flex items-center gap-1">
            {/* The drawer has its own search entry. */}
            <AppLink
              href={routes.search}
              aria-label="البحث في البرامج"
              className="ma-btn ma-btn--bare ma-btn--icon size-11 max-lg:hidden"
            >
              <Search aria-hidden="true" className="size-5 fill-none" />
            </AppLink>
            <HeaderShopLinks />
            <ThemeToggle className="max-md:hidden" />
          </div>
          {/* Business pages are the subscribe flow already; below 1280px the wider lockup needs the room. */}
          <ButtonLink
            href={brand === "business" ? routes.subscriptionsFor("company") : routes.subscriptions}
            variant="primary"
            size="sm"
            className={brand === "business" ? "min-h-11 max-xl:hidden" : "min-h-11 max-md:hidden"}
          >
            اشترك الآن
          </ButtonLink>
          <HeaderAccount placement="bar" />
          <MobileNavButton
            popoverId={MOBILE_NAV_ID}
            action="open"
            className="ma-btn ma-btn--bare ma-btn--icon size-11 lg:hidden"
          />
        </div>
      </div>

      <div id={MOBILE_NAV_ID} popover="auto" className="mobile-nav lg:hidden" aria-label="القائمة">
        <div className="flex min-h-[var(--header-h)] items-center justify-between">
          <Logo className="w-40" />
          <MobileNavButton popoverId={MOBILE_NAV_ID} action="close" />
        </div>
        <nav aria-label="القائمة الرئيسية" className="mt-6 flex-1">
          <MobileMegaMenu popoverId={MOBILE_NAV_ID} />
        </nav>
        <div className="mb-6 flex items-center justify-between border-t border-line pt-4">
          <span className="text-fg-muted">المظهر</span>
          <ThemeToggle />
        </div>
        <ButtonLink href={routes.subscriptions} variant="primary" block className="mb-3">
          اشترك الآن
        </ButtonLink>
        <HeaderAccount placement="drawer" />
      </div>
    </header>
  );
}
