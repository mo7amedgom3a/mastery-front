"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UndoNotice } from "@/components/shop/undo-notice";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useStartCheckout } from "@/features/checkout/api/use-start-checkout";
import { incentivesRequest, useCheckoutIncentives } from "@/features/checkout/model/incentives-store";
import { AuthGateDialog } from "@/features/checkout/components/auth-gate-dialog";
import { CheckoutRedirectOverlay } from "@/features/checkout/components/checkout-redirect-overlay";
import { RecommendationRail } from "@/features/search/components/recommendation-rail";
import { commerceKeys, commerceQueries, setCartItemAddons, type CartResponse } from "@/lib/api/commerce";
import { useAuthStore } from "@/lib/auth/store";
import { formatCount } from "@/lib/format";
import { readStoredReferralInfo } from "@/lib/referral";
import { shopKeyFromSlug } from "@/lib/shop/product-links";
import { useShopRoutes } from "@/lib/shop/use-shop-routes";
import { mirrorAccountCart } from "@/lib/shop/cart-sync";
import type { AddonCode, Quote, QuoteRequest } from "@/lib/shop/contract";
import { PRODUCT_FORMS } from "@/lib/shop/labels";
import { useShopHydrated, useShopStore, type CartLine } from "@/lib/shop/store";
import { addToCart, removeFromCart, saveToWishlist } from "@/lib/shop/use-shop-actions";
import { useUndo } from "@/lib/shop/use-undo";

import { shopKeys, shopQueries } from "./api/shop-client";
import { CartLineRow } from "./components/cart-line";
import { IncentivesPanel, ReferralDiscountBadge } from "./components/incentives-panel";
import { OrderSummary } from "./components/order-summary";
import { PaymentMethodPicker } from "./components/payment-method-picker";
import { EMPTY_SHIPPING, shippingAddress, ShippingAddressForm, type ShippingDraft } from "./components/shipping-address-form";
import { TamaraWidget } from "./components/tamara-widget";
import { usePaymentChoice } from "./components/use-payment-choice";
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

  const couponCode = useCheckoutIncentives((state) => state.couponCode);
  const voucherIds = useCheckoutIncentives((state) => state.voucherIds);
  const incentives = useMemo(() => incentivesRequest({ couponCode, voucherIds }), [couponCode, voucherIds]);
  const account = useQuery({
    ...commerceQueries.quote(undefined, incentives),
    enabled: hydrated && signedIn,
    // Keep the totals on screen while a coupon or voucher change is re-quoted.
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    // Spend vouchers (soonest expiry first) as they become available, e.g. newly granted referral
    // credit; a voucher the customer unticked stays unticked.
    const available = account.data?.available_vouchers ?? [];
    if (available.length > 0) {
      useCheckoutIncentives.getState().offerVouchers(available.map((voucher) => voucher.voucher_id));
    }
    // Auto-apply welcome coupon or referral coupon if no coupon is active
    if (!couponCode) {
      const suggested = account.data?.suggested_coupons ?? [];
      if (suggested.length > 0 && suggested[0].code) {
        useCheckoutIncentives.getState().setCoupon(suggested[0].code);
      } else {
        const stored = readStoredReferralInfo();
        if (stored && stored.valid && (stored.coupon_code || stored.referral_code)) {
          useCheckoutIncentives.getState().setCoupon(stored.coupon_code || stored.referral_code);
        }
      }
    }
  }, [account.data, voucherIds, couponCode]);

  useEffect(() => {
    if (!signedIn && !couponCode) {
      const stored = readStoredReferralInfo();
      if (stored && stored.valid && (stored.coupon_code || stored.referral_code)) {
        useCheckoutIncentives.getState().setCoupon(stored.coupon_code || stored.referral_code);
      }
    }
  }, [signedIn, couponCode]);
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

  const request = useMemo<QuoteRequest>(
    () => ({ lines: cart.map((line) => ({ key: line.key, addons: line.addons ?? [] })) }),
    [cart],
  );
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
      refetch: () => {
        void queryClient.invalidateQueries({ queryKey: commerceKeys.quote() });
        void account.refetch();
      },
    };
  }
  return {
    quote: guest.data,
    // Placeholder data is the previous cart's quote: fine to look at, not to pay against.
    stale: guest.isPlaceholderData || (guest.isFetching && !guest.data),
    failed: guest.isError && !guest.data,
    refetch: () => {
      void queryClient.invalidateQueries({ queryKey: shopKeys.all });
      void guest.refetch();
    },
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
  const incentiveState = useCheckoutIncentives();
  const payment = usePaymentChoice(quote && { amount: quote.totals.total, currency: quote.totals.currency });
  const shopRoutes = useShopRoutes();
  const storedReferral = useMemo(() => (hydrated ? readStoredReferralInfo() : null), [hydrated]);

  const queryClient = useQueryClient();
  const [addonsBusy, setAddonsBusy] = useState(false);
  const [shipping, setShipping] = useState<ShippingDraft>(EMPTY_SHIPPING);
  /**
   * Certificate add-ons on a line. Guests keep the choice in the browser (it moves to the account
   * cart at sign-in); signed in, the account cart is updated and its quote re-read.
   */
  const toggleAddon = async (line: CartLine, code: AddonCode, selected: boolean) => {
    checkout.clearError();
    const current = new Set(line.addons ?? []);
    if (selected) current.add(code);
    else current.delete(code);
    const next = [...current];
    useShopStore.getState().setCartLineAddons(line.key, next);
    if (!signedIn || !line.cartItemId) return;
    setAddonsBusy(true);
    try {
      const cart = await setCartItemAddons(line.cartItemId, next);
      useShopStore.getState().replaceCart(mirrorAccountCart(cart, useShopStore.getState().cart));
      await queryClient.invalidateQueries({ queryKey: commerceKeys.quote() });
    } catch (error) {
      console.error("[cart] add-on update failed", line.key, error);
      useShopStore.getState().setCartLineAddons(line.key, line.addons ?? []);
      setCartNotice("تعذّر تحديث إضافات الشهادة. حاول مجدداً.");
    } finally {
      setAddonsBusy(false);
    }
  };

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
                <ButtonLink href={shopRoutes.wishlist} variant="soft">
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
  const needsShipping = (quote?.lines ?? []).some((line) => line.addons.some((addon) => addon.selected && addon.requiresShipping));
  const address = needsShipping ? shippingAddress(shipping) : null;
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
                  onToggleAddon={(entry, code, selected) => void toggleAddon(entry, code, selected)}
                  addonsBusy={addonsBusy || checkout.busy}
                />
              </li>
            ))}
          </ul>
          {needsShipping ? <ShippingAddressForm value={shipping} onChange={setShipping} disabled={checkout.busy} /> : null}
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
            // An order the coupon and vouchers fully cover has no payment page.
            onPay={() =>
              void checkout.start({
                mode: "cart",
                payment: quote?.totals.total === 0 ? undefined : payment.payment,
                shippingAddress: address,
              })
            }
            provider={payment.payment.provider}
            methodIncomplete={(quote?.totals.total !== 0 && payment.incomplete) || (needsShipping && address === null)}
            incentives={
              signedIn ? (
                <IncentivesPanel
                  referral={storedReferral}
                  coupon={quote?.coupon ?? null}
                  suggestedCoupons={quote?.suggestedCoupons}
                  couponCode={incentiveState.couponCode}
                  onApplyCoupon={(code) => {
                    checkout.clearError();
                    incentiveState.setCoupon(code);
                  }}
                  onRemoveCoupon={() => {
                    checkout.clearError();
                    incentiveState.setCoupon(null);
                  }}
                  vouchers={quote?.vouchers}
                  selectedVoucherIds={incentiveState.voucherIds ?? []}
                  onVouchersChange={(ids) => {
                    checkout.clearError();
                    incentiveState.setVoucherIds(ids);
                  }}
                  currency={quote?.totals.currency ?? "USD"}
                  disabled={checkout.busy}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {storedReferral && storedReferral.valid ? <ReferralDiscountBadge referral={storedReferral} /> : null}
                  <p className="m-0 text-sm leading-6 text-fg-muted">لديك قسيمة خصم أو رصيد؟ سجّل الدخول لاستخدامه عند الدفع.</p>
                </div>
              )
            }
            paymentMethods={
              <PaymentMethodPicker
                method={payment.method}
                onMethodChange={(method) => {
                  checkout.clearError();
                  payment.setMethod(method);
                }}
                tamara={payment.tamara}
                phone={payment.phone}
                onPhoneChange={payment.setPhone}
                phoneError={payment.phoneError}
                disabled={checkout.busy}
              />
            }
            instalmentsWidget={
              payment.widgetOptions ? <TamaraWidget options={payment.widgetOptions} placement="cart" /> : null
            }
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
