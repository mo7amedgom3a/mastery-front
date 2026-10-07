"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useEffect, useMemo } from "react";

import { UndoNotice } from "@/components/shop/undo-notice";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useStartCheckout } from "@/features/checkout/api/use-start-checkout";
import { AuthGateDialog } from "@/features/checkout/components/auth-gate-dialog";
import { CheckoutRedirectOverlay } from "@/features/checkout/components/checkout-redirect-overlay";
import { RecommendationRail } from "@/features/search/components/recommendation-rail";
import { commerceKeys, commerceQueries, type CartResponse } from "@/lib/api/commerce";
import { useAuthStore } from "@/lib/auth/store";
import { formatCount } from "@/lib/format";
import { shopKeyFromSlug } from "@/lib/shop/catalog-ids";
import { mirrorAccountCart } from "@/lib/shop/cart-sync";
import type { Quote, QuoteRequest } from "@/lib/shop/contract";
import { PRODUCT_FORMS } from "@/lib/shop/labels";
import { useShopHydrated, useShopStore, type CartLine } from "@/lib/shop/store";
import { addToCart, removeFromCart, saveToWishlist } from "@/lib/shop/use-shop-actions";
import { useUndo } from "@/lib/shop/use-undo";

import { shopQueries } from "./api/shop-client";
import { CartLineRow } from "./components/cart-line";
import { OrderSummary } from "./components/order-summary";
import { WishlistSuggestions } from "./components/wishlist-suggestions";
import { accountQuote } from "./model/account-quote";

type Removed = { line: CartLine; index: number };

type CartQuote = { quote: Quote | undefined; stale: boolean; failed: boolean; refetch: () => void };

/**
 * Guests: the cart lives in the browser and is priced from the catalog for display.
 * Signed in: the account cart is the truth. The backend prices it (that is what Stripe charges) and
 * the browser's copy is replaced by it, so the header count and other tabs agree.
 */
function useCartQuote(hydrated: boolean, signedIn: boolean, cart: CartLine[]): CartQuote {
  const queryClient = useQueryClient();
  const revision = useShopStore((state) => state.accountCartRevision);

  useEffect(() => {
    if (signedIn) void queryClient.invalidateQueries({ queryKey: commerceKeys.quote() });
  }, [queryClient, revision, signedIn]);

  const account = useQuery({ ...commerceQueries.quote(), enabled: hydrated && signedIn });
  const accountKeys = useMemo(
    () => (account.data?.lines ?? []).flatMap((line) => shopKeyFromSlug(line.slug) ?? []),
    [account.data],
  );
  const items = useQuery({ ...shopQueries.items(accountKeys), enabled: signedIn && accountKeys.length > 0 });

  useEffect(() => {
    if (!account.data) return;
    const shop = useShopStore.getState();
    // The quote is the cart plus availability: a fresh view of the account cart to mirror.
    shop.replaceCart(mirrorAccountCart(account.data as CartResponse, shop.cart));
  }, [account.data]);

  const request = useMemo<QuoteRequest>(() => ({ lines: cart.map((line) => ({ key: line.key, addons: [] })) }), [cart]);
  const guest = useQuery({ ...shopQueries.quote(request), enabled: hydrated && !signedIn && cart.length > 0 });

  const accountView = useMemo(
    () =>
      account.data
        ? accountQuote(account.data, new Map((items.data?.items ?? []).map((item) => [item.key, item])))
        : undefined,
    [account.data, items.data],
  );

  if (signedIn) {
    return {
      quote: accountView,
      stale: account.isFetching,
      failed: account.isError && !account.data,
      refetch: () => void account.refetch(),
    };
  }
  return {
    quote: guest.data,
    // Placeholder data is the previous cart's quote: fine to look at, not to pay against.
    stale: guest.isPlaceholderData || (guest.isFetching && !guest.data),
    failed: guest.isError && !guest.data,
    refetch: () => void guest.refetch(),
  };
}

/**
 * The cart: what the visitor is about to buy and the totals. Pressing pay signs the guest in first
 * (the cart then joins the account), creates the order and sends them to Stripe.
 */
export function CartPage() {
  const hydrated = useShopHydrated();
  const signedIn = useAuthStore((state) => state.status === "authenticated");
  const cart = useShopStore((state) => state.cart);
  const wishlist = useShopStore((state) => state.wishlist);
  const notice = useShopStore((state) => state.cartNotice);
  const { restoreCartLine, setCartNotice } = useShopStore.getState();

  const { quote, stale, failed, refetch } = useCartQuote(hydrated, signedIn, cart);
  const checkout = useStartCheckout();

  const undo = useUndo<Removed>();
  const remove = (line: CartLine) => {
    const index = cart.findIndex((entry) => entry.key === line.key);
    if (index < 0) return;
    checkout.clearError();
    undo.offer({ line, index });
    removeFromCart(line);
  };
  const restore = () => {
    if (!undo.pending) return;
    const { line, index } = undo.pending;
    // Signed in, the line goes back on the account (where it gets a new line id).
    if (signedIn) addToCart({ ...line, cartItemId: undefined } as CartLine, { track: false });
    else restoreCartLine(line, index);
    undo.clear();
  };
  const saveForLater = (line: CartLine) => {
    saveToWishlist(line);
    undo.clear();
    removeFromCart(line);
  };

  if (!hydrated) {
    return <CartSkeleton />;
  }

  const notices = (
    <>
      {notice ? (
        <UndoNotice onDismiss={() => setCartNotice(null)}>{notice}</UndoNotice>
      ) : null}
      {undo.pending ? (
        <UndoNotice onUndo={restore} onDismiss={undo.clear}>
          أُزيل «{undo.pending.line.title}» من السلة.
        </UndoNotice>
      ) : null}
    </>
  );

  if (cart.length === 0) {
    return (
      <div className="flex flex-col gap-12">
        {notices}
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
          <ShoppingCart aria-hidden="true" className="size-8 text-accent" />
          <h2 className="m-0 text-2xl leading-10 font-bold">سلتك فارغة</h2>
          <p className="m-0 max-w-[52ch] text-fg-muted">
            أضف الدورات والدبلومات والباقات التي تريدها، ثم أكمل الدفع من هنا بخطوة واحدة.
          </p>
          <ul className="ma-cluster m-0 list-none p-0">
            <li>
              <ButtonLink href={routes.search} variant="primary">
                تصفّح البرامج
              </ButtonLink>
            </li>
            {wishlist.length > 0 ? (
              <li>
                <ButtonLink href={routes.wishlist} variant="soft">
                  افتح المفضلة
                </ButtonLink>
              </li>
            ) : null}
          </ul>
        </div>
        <WishlistSuggestions />
        <RecommendationRail />
      </div>
    );
  }

  const quotedLines = new Map(quote?.lines.map((line) => [line.key, line]));
  const unavailable = new Map(quote?.unavailable.map((entry) => [entry.key, entry.reason]));
  const saved = new Set(wishlist.map((entry) => entry.key));

  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <p role="status" className="m-0 text-fg-muted">
            {formatCount(cart.length, PRODUCT_FORMS)} في سلتك
          </p>
          {notices}
          <ul aria-label="منتجات السلة" className="m-0 flex list-none flex-col gap-4 p-0">
            {cart.map((line) => (
              <li key={line.key}>
                <CartLineRow
                  line={line}
                  quoted={quotedLines.get(line.key)}
                  unavailable={unavailable.get(line.key)}
                  saved={saved.has(line.key)}
                  onSaveForLater={saveForLater}
                  onRemove={remove}
                />
              </li>
            ))}
          </ul>
          <WishlistSuggestions />
        </div>

        {/* Below the sticky header (72px) with a little air. */}
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
          <OrderSummary
            quote={quote}
            stale={stale}
            failed={failed}
            onRetry={refetch}
            blocked={signedIn && unavailable.size > 0}
            paying={checkout.busy}
            payError={checkout.error}
            onPay={() => void checkout.start({ mode: "cart" })}
          />
        </div>
      </div>

      <AuthGateDialog />
      <CheckoutRedirectOverlay phase={checkout.phase} />
    </>
  );
}

/** Held while the saved cart is read from storage, so the empty state never flashes first. */
export function CartSkeleton() {
  return (
    <div role="status" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
      <span className="sr-only">جارٍ تحميل السلة…</span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        {[0, 1].map((index) => (
          <div key={index} className="flex gap-4 rounded-panel border border-line p-4 sm:p-5">
            <Skeleton className="aspect-[16/10] w-24 shrink-0 sm:w-36" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      {/* The order summary: totals, then the pay button. */}
      <div aria-hidden="true" className="flex flex-col gap-4 rounded-panel border border-line p-6">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-5" />
        <Skeleton className="h-5" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}
