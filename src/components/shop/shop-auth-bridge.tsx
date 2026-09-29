"use client";

import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/lib/auth/store";
import { rehydrateShop, useShopStore } from "@/lib/shop/store";
import { syncGuestWishlist } from "@/lib/shop/wishlist-sync";

function onIdle(callback: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 1500);
  return () => clearTimeout(id);
}

/**
 * Mounted once. Connects the guest shop state to the account:
 * 1. Restores the saved wishlist/cart, then (when the browser is idle) asks the API whether
 *    there's already a session.
 * 2. Whenever the session becomes authenticated (login, 2FA, register → login, refresh), pushes
 *    guest wishlist items to `/me/wishlist` and moves a pending cart item into the cart.
 * 3. Renders the "sign in to add to cart" dialog.
 */
export function ShopAuthBridge() {
  useEffect(() => {
    const onAuthenticated = async () => {
      await rehydrateShop();
      useShopStore.getState().flushPendingCart();
      await syncGuestWishlist();
    };

    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.status === "authenticated" && previous.status !== "authenticated") void onAuthenticated();
    });

    const cancelIdle = onIdle(() => {
      void rehydrateShop().then(() => {
        const { status, bootstrap } = useAuthStore.getState();
        if (status === "idle") bootstrap().catch(() => undefined);
        else if (status === "authenticated") void onAuthenticated();
      });
    });

    return () => {
      unsubscribe();
      cancelIdle();
    };
  }, []);

  return <AuthPromptDialog />;
}

function AuthPromptDialog() {
  const item = useShopStore((state) => state.authPrompt);
  const close = useShopStore((state) => state.closeAuthPrompt);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [returnTo, setReturnTo] = useState("/");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) {
      setReturnTo(`${window.location.pathname}${window.location.hash}`);
      dialog.showModal();
    } else if (!item && dialog.open) {
      dialog.close();
    }
  }, [item]);

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="auth-prompt-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <h2 id="auth-prompt-title" className="m-0 text-2xl leading-snug font-bold">
          سجّل الدخول لإكمال الإضافة إلى السلة
        </h2>
        <p className="m-0 text-fg-muted">
          {item ? `سنضيف «${item.title}» إلى سلتك تلقائياً بعد تسجيل الدخول أو إنشاء حساب.` : null}
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <ButtonLink href={routes.loginThen(returnTo)} variant="primary">
            تسجيل الدخول
          </ButtonLink>
          <ButtonLink href={routes.registerThen(returnTo)} variant="outline">
            إنشاء حساب
          </ButtonLink>
        </div>
        <button type="button" onClick={close} className="ma-btn ma-btn--ghost ma-btn--sm self-center">
          متابعة التصفّح
        </button>
      </div>
    </dialog>
  );
}
