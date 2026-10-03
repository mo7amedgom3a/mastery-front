"use client";

import { useRouter } from "next/navigation";

import { Button, ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/lib/auth/store";
import { trackAuth } from "@/lib/observability/behavior";

/**
 * The header's account action: "register" for a guest, "sign out" once there is a session. Rendered
 * as a guest first (the session is only known after the browser asks), in the bar and in the drawer.
 */
export function HeaderAccount({ placement }: { placement: "bar" | "drawer" }) {
  const router = useRouter();
  const user = useAuthStore((state) => (state.status === "authenticated" ? state.user : null));
  const bar = placement === "bar";

  if (!user) {
    return bar ? (
      <ButtonLink href={routes.register} variant="secondary" size="sm" className="min-h-11 max-sm:hidden">
        سجل الآن
      </ButtonLink>
    ) : (
      <ButtonLink href={routes.register} variant="primary" block>
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
  const name = user.full_name?.trim() || user.email;

  return bar ? (
    <Button variant="soft" size="sm" className="min-h-11 max-sm:hidden" title={name} onClick={signOut}>
      تسجيل الخروج
    </Button>
  ) : (
    <div className="flex flex-col gap-3">
      <p className="m-0 truncate text-fg-muted">
        <bdi>{name}</bdi>
      </p>
      <Button variant="soft" block onClick={signOut}>
        تسجيل الخروج
      </Button>
    </div>
  );
}
