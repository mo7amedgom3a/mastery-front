"use client";

import { ChevronDown, GraduationCap, Heart, House, LogOut, Receipt, UserRound, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import { useEffect, useId, useRef, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { useAccountProfile } from "@/lib/account/use-account-profile";
import type { AuthCustomer } from "@/lib/auth/contract";
import { cn } from "@/lib/cn";

import { UserAvatar } from "./user-avatar";

type AccountLink = { href: Route; label: string; icon: LucideIcon };

/** Where a signed-in customer can go from the header. */
export const accountLinks: readonly AccountLink[] = [
  { href: routes.studentHome, label: "لوحتي", icon: House },
  { href: routes.studentProfile, label: "الملف الشخصي", icon: UserRound },
  { href: routes.studentAccess, label: "تعلّمي", icon: GraduationCap },
  { href: routes.studentOrders, label: "طلباتي", icon: Receipt },
  { href: routes.studentWishlist, label: "المفضلة", icon: Heart },
];

/** The name to show: the profile's (it may have been edited since sign-in), else the session's, else the e-mail. */
export function displayName(user: AuthCustomer, profileName?: string | null): string {
  return profileName?.trim() || user.full_name?.trim() || user.email;
}

/**
 * The signed-in header action: an avatar button that opens the account menu (links + sign out).
 * Closes on Escape (focus back on the button), on a click outside, and after following a link.
 */
export function AccountMenu({ user, onSignOut }: { user: AuthCustomer; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const profile = useAccountProfile();
  const name = displayName(user, profile?.full_name);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative max-sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`حسابي: ${name}`}
        onClick={() => setOpen((value) => !value)}
        className="ma-btn ma-btn--bare min-h-11 gap-2 px-1.5"
      >
        <UserAvatar name={name} src={profile?.avatar_url} size={36} />
        <span className="max-w-32 truncate text-sm font-medium max-xl:hidden">
          <bdi>{name}</bdi>
        </span>
        <ChevronDown aria-hidden="true" className={cn("size-4 fill-none transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute end-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-panel border border-line-strong bg-surface p-2 shadow-lg"
        >
          <div className="flex flex-col gap-0.5 border-b border-line px-3 pt-2 pb-3">
            <span className="truncate font-bold">
              <bdi>{name}</bdi>
            </span>
            {user.full_name ? (
              <span dir="ltr" className="truncate text-end text-sm text-fg-muted">
                {user.email}
              </span>
            ) : null}
          </div>
          <ul className="m-0 flex list-none flex-col p-0 py-1">
            {accountLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <AppLink
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-fg no-underline hover:bg-surface-alt"
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0 fill-none text-fg-muted" />
                  {label}
                </AppLink>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border-0 border-t border-line bg-transparent px-3 text-start font-[inherit] text-fg hover:bg-surface-alt"
          >
            <LogOut aria-hidden="true" className="size-5 shrink-0 fill-none text-fg-muted" />
            تسجيل الخروج
          </button>
        </div>
      ) : null}
    </div>
  );
}
