"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useMemo } from "react";

import { UndoNotice } from "@/components/shop/undo-notice";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useCheckout } from "@/features/checkout/api/use-checkout";
import { AuthGateDialog } from "@/features/checkout/components/auth-gate-dialog";
import { RecommendationRail } from "@/features/search/components/recommendation-rail";
import { formatCount } from "@/lib/format";
import type { QuoteRequest } from "@/lib/shop/contract";
import { PRODUCT_FORMS } from "@/lib/shop/labels";
import { useShopHydrated, useShopStore, type CartLine } from "@/lib/shop/store";
import { saveToWishlist } from "@/lib/shop/use-shop-actions";
import { useUndo } from "@/lib/shop/use-undo";

import { shopQueries } from "./api/shop-client";
import { CartLineRow } from "./components/cart-line";
import { OrderSummary } from "./components/order-summary";
import { effectiveMethod, useOfferedMethods } from "./components/payment-method-picker";
import { WishlistSuggestions } from "./components/wishlist-suggestions";

type Removed = { line: CartLine; index: number };

/**
 * The cart: what the visitor is about to buy, with paid extras per product, one coupon, the totals
 * and the payment methods. The browser holds only which products and extras were chosen; every
 * price on the page comes from the quote, which re-reads the catalog (so a running offer's price is
 * what is charged) each time the cart changes.
 */
export function CartPage() {
  const hydrated = useShopHydrated();
  const cart = useShopStore((state) => state.cart);
  const wishlist = useShopStore((state) => state.wishlist);
  const coupon = useShopStore((state) => state.coupon);
  const chosenMethod = useShopStore((state) => state.paymentMethod);
  const { toggleCartAddon, removeFromCart, restoreCartLine, setCoupon, setPaymentMethod, setMockCustomer, closeAuthGate } =
    useShopStore.getState();

  const request = useMemo<QuoteRequest>(
    () => ({ lines: cart.map((line) => ({ key: line.key, addons: line.addons })), coupon }),
    [cart, coupon],
  );
  const quoteQuery = useQuery({ ...shopQueries.quote(request), enabled: hydrated && cart.length > 0 });
  const quote = quoteQuery.data;
  // Placeholder data is the previous cart's quote: fine to look at, not to pay against.
  const stale = quoteQuery.isPlaceholderData || (quoteQuery.isFetching && !quote);

  const offeredMethods = useOfferedMethods();
  const method = quote ? effectiveMethod(chosenMethod, offeredMethods, quote.paymentMethods) : null;
  const checkout = useCheckout({ quote: stale ? undefined : quote, request, method });

  const undo = useUndo<Removed>();
  const remove = (line: CartLine) => {
    const index = cart.findIndex((entry) => entry.key === line.key);
    if (index < 0) return;
    undo.offer({ line, index });
    removeFromCart(line.key);
  };
  const restore = () => {
    if (!undo.pending) return;
    restoreCartLine(undo.pending.line, undo.pending.index);
    undo.clear();
  };
  const saveForLater = (line: CartLine) => {
    saveToWishlist(line);
    undo.clear();
    removeFromCart(line.key);
  };

  if (!hydrated) {
    return <CartSkeleton />;
  }

  const undoNotice = undo.pending ? (
    <UndoNotice onUndo={restore} onDismiss={undo.clear}>
      أُزيل «{undo.pending.line.title}» من السلة.
    </UndoNotice>
  ) : null;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col gap-12">
        {undoNotice}
        <div className="flex flex-col items-start gap-4 border border-line p-6 md:p-10">
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
                <ButtonLink href={routes.wishlist} variant="outline">
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
          {undoNotice}
          <ul aria-label="منتجات السلة" className="m-0 flex list-none flex-col gap-4 p-0">
            {cart.map((line) => (
              <li key={line.key}>
                <CartLineRow
                  line={line}
                  quoted={quotedLines.get(line.key)}
                  unavailable={unavailable.get(line.key)}
                  saved={saved.has(line.key)}
                  onToggleAddon={toggleCartAddon}
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
            failed={quoteQuery.isError && !quote}
            onRetry={() => void quoteQuery.refetch()}
            couponCode={coupon}
            onApplyCoupon={(code) => {
              checkout.clearError();
              setCoupon(code);
            }}
            offeredMethods={offeredMethods}
            method={method}
            onSelectMethod={(next) => {
              checkout.clearError();
              setPaymentMethod(next);
            }}
            paying={checkout.busy}
            payError={checkout.error}
            onPay={() => void checkout.pay()}
          />
        </div>
      </div>

      <AuthGateDialog
        onMockContinue={() => {
          setMockCustomer(true);
          closeAuthGate();
          void checkout.pay({ asMockCustomer: true });
        }}
      />
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
          <div key={index} className="flex gap-4 border border-line p-4 sm:p-5">
            <div className="aspect-[16/10] w-24 shrink-0 animate-pulse bg-line motion-reduce:animate-none sm:w-36" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="h-5 w-3/4 animate-pulse bg-line motion-reduce:animate-none" />
              <div className="h-4 w-1/3 animate-pulse bg-line motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="h-72 animate-pulse border border-line bg-line/40 motion-reduce:animate-none" />
    </div>
  );
}
