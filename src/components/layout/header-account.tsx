"use client";

import { useRouter } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { Button, ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useAccountProfile } from "@/lib/account/use-account-profile";
import { useAuthStore } from "@/lib/auth/store";
import { trackAuth } from "@/lib/observability/behavior";

import { accountLinks, AccountMenu, displayName } from "./account-menu";
import { UserAvatar } from "./user-avatar";

/**
 * The header's account action: a link to the login page for a guest, the account menu once there is a session. Rendered
 * as a guest first (the session is only known after the browser asks), in the bar and in the drawer.
 */
export function HeaderAccount({ placement }: { placement: "bar" | "drawer" }) {
  const router = useRouter();
  const user = useAuthStore((state) => (state.status === "authenticated" ? state.user : null));
  const profile = useAccountProfile();
  const bar = placement === "bar";

  if (!user) {
    return bar ? (
      <ButtonLink href={routes.login} variant="secondary" size="sm" className="min-h-11 max-sm:hidden">
        سجل الآن
      </ButtonLink>
    ) : (
      <ButtonLink href={routes.login} variant="primary" block>
        سجل الآن
      </ButtonLink>
    );
  }

  const signOut = async () => {
    // Signed out in this browser even if the request fails; the server's copy then expires on its own.
    await useAuthStore.getState().logout().catch(() => undefined);
    trackAuth("signed_out");
    // Re-render what the server made for a signed-in visitor.
    router.refresh();
  };
  if (bar) return <AccountMenu user={user} onSignOut={signOut} />;

  const name = displayName(user, profile?.full_name);

  const close = () => document.getElementById("mobile-nav")?.hidePopover();
  return (
    <div className="flex flex-col gap-3">
      <div className="ma-person">
        <UserAvatar name={name} src={profile?.avatar_url} size={40} />
        <span className="ma-person__name min-w-0 truncate">
          <bdi>{name}</bdi>
        </span>
      </div>
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
        {accountLinks.map(({ href, label }) => (
          <li key={href}>
            <AppLink href={href} onClick={close} className="ma-btn ma-btn--soft ma-btn--sm ma-btn--block min-h-11">
              {label}
            </AppLink>
          </li>
        ))}
      </ul>
      <Button variant="soft" block onClick={signOut}>
        تسجيل الخروج
      </Button>
    </div>
  );
}
