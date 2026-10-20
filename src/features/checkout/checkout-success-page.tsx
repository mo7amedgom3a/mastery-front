"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { AccessCard, lineTitles, OrderInvoices, OrderLines } from "@/features/orders/components/order-sections";
import { StatusTag } from "@/features/orders/components/status-tag";
import { isPaymentSettled, orderNumber, orderStatus } from "@/features/orders/model/status";
import { ApiError } from "@/lib/api/client";
import { commerceKeys, commerceQueries, getPaymentIntent, reconcilePayment } from "@/lib/api/commerce";
import { subscriptionQueries } from "@/lib/api/subscriptions";
import { formatDate, formatDateTime } from "@/lib/format";
import { trackCheckout } from "@/lib/observability/behavior";
import { syncAccountCart } from "@/lib/shop/cart-sync";
import { refreshOwnedProducts } from "@/lib/shop/use-owned-products";
import { useTeamCheckoutStore } from "@/features/subscriptions/model/team-checkout-store";

import { AddEmployeesLink, teamOrderOf, TeamOrderSummary } from "./components/team-order-summary";

import { claimCelebration, settleCheckout, usePendingCheckout } from "./model/checkout-session";

/** Fast at first (the webhook usually lands within seconds), then calmer, then give up waiting. */
const FAST_POLL_MS = 1500;
const SLOW_POLL_MS = 5000;
const FAST_PHASE_MS = 15_000;
const MAX_WAIT_MS = 90_000;
/** Access rows are written with the payment, but give the read a little slack before saying so. */
const ACCESS_POLL_MS = 3000;
const ACCESS_WAIT_MS = 30_000;

type Ids = { orderId: string; paymentIntentId: string };

async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#ff6f61", "#ffd166", "#06d6a0", "#118ab2", "#c3a6ff"];
  confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  window.setTimeout(() => {
    confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0 }, colors, disableForReducedMotion: true });
    confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1 }, colors, disableForReducedMotion: true });
  }, 300);
}

/**
 * Where Stripe sends the buyer back. Coming back is not proof of payment, so the page asks the
 * backend to re-check Stripe once, then watches the payment until it settles. Paid: the order, its
 * invoice and the access it opened, with a short celebration. Failed: a way back to the cart.
 */
export function CheckoutSuccessPage({ orderId, paymentIntentId }: Partial<Ids>) {
  // A success URL without ids (an older link): fall back to the checkout this tab started.
  const pending = usePendingCheckout();
  if (orderId && paymentIntentId) return <OrderOutcome orderId={orderId} paymentIntentId={paymentIntentId} />;
  if (pending === undefined) return <ConfirmingSkeleton />;
  if (pending === null) return <NoOrder />;
  return <OrderOutcome orderId={pending.orderId} paymentIntentId={pending.paymentIntentId} />;
}

function OrderOutcome({ orderId, paymentIntentId }: Ids) {
  const [startedAt] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Wakes the backend's payment workflow now instead of at its next poll. Fire and forget.
    reconcilePayment(paymentIntentId).catch(() => undefined);
    const timer = window.setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [paymentIntentId]);

  const intent = useQuery({
    queryKey: commerceKeys.paymentIntent(paymentIntentId),
    queryFn: ({ signal }) => getPaymentIntent(paymentIntentId, { signal }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if ((status && isPaymentSettled(status)) || timedOut) return false;
      return Date.now() - startedAt < FAST_PHASE_MS ? FAST_POLL_MS : SLOW_POLL_MS;
    },
    retry: (count, error) => !(error instanceof ApiError && (error.status === 401 || error.status === 404)) && count < 3,
  });

  const status = intent.data?.status;
  const paid = status === "succeeded";
  // Free enrollments settle at once with a 0.00 total; only the wording differs.
  const free = intent.data?.amount_minor === 0;
  const failed = status === "failed" || status === "cancelled";

  const order = useQuery({ ...commerceQueries.order(orderId), enabled: paid });
  // A subscription order grants access under the subscription, not the order.
  const subscriptionsStartedAt = useRef<number | null>(null);
  const subscriptions = useQuery({
    ...subscriptionQueries.mine(),
    enabled: paid,
    refetchInterval: (query) => {
      subscriptionsStartedAt.current ??= Date.now();
      const found = query.state.data?.some((sub) => sub.order_id === orderId);
      const isSubscriptionOrder = order.data?.lines?.some((line) => line.product_type === "subscription");
      return found || !isSubscriptionOrder || Date.now() - subscriptionsStartedAt.current > ACCESS_WAIT_MS ? false : ACCESS_POLL_MS;
    },
  });
  const subscription = subscriptions.data?.find((sub) => sub.order_id === orderId) ?? null;
  const sources = new Set([orderId, subscription?.subscription_id].filter(Boolean));
  const accessStartedAt = useRef<number | null>(null);
  const access = useQuery({
    ...commerceQueries.entitlements({ limit: 100 }),
    enabled: paid,
    refetchInterval: (query) => {
      accessStartedAt.current ??= Date.now();
      const found = query.state.data?.items.some((entitlement) => sources.has(entitlement.source_id));
      return found || Date.now() - accessStartedAt.current > ACCESS_WAIT_MS ? false : ACCESS_POLL_MS;
    },
  });
  const accessItems = access.data?.items.filter((entitlement) => sources.has(entitlement.source_id));

  useEffect(() => {
    if (!status || !isPaymentSettled(status)) return;
    settleCheckout(orderId);
    trackCheckout("payment_settled", { order_id: orderId, status });
    if (status !== "succeeded") return;
    // A paid team subscription: its details/review answers are no longer needed.
    useTeamCheckoutStore.getState().reset();
    // The backend emptied the cart it charged; bring this browser's copy in line.
    void syncAccountCart();
    // Product pages should now offer "continue learning" instead of "buy now".
    void refreshOwnedProducts();
    if (claimCelebration(orderId)) void celebrate();
  }, [orderId, status]);

  if (intent.error instanceof ApiError && intent.error.status === 401) {
    return (
      <Notice
        tone="warning"
        title="سجّل الدخول لعرض طلبك"
        text="انتهت جلستك. سجّل الدخول بالحساب الذي دفعت به لعرض الطلب."
        action={{ href: routes.loginThen(`${routes.checkoutSuccess}?order_id=${orderId}&payment_intent_id=${paymentIntentId}`), label: "تسجيل الدخول" }}
      />
    );
  }
  if (intent.error instanceof ApiError && intent.error.status === 404) return <NoOrder />;

  if (failed) {
    return (
      <Notice
        tone="danger"
        title="لم تكتمل عملية الدفع"
        text={
          intent.data?.failure_code === "tamara_declined"
            ? "لم توافق تمارا على هذه العملية، ولم يُخصم أي مبلغ. سلتك كما هي، ويمكنك الدفع بالبطاقة."
            : "لم يُخصم أي مبلغ مقابل هذا الطلب، وسلتك كما هي. يمكنك المحاولة مجدداً بطريقة دفع أخرى."
        }
        action={{ href: routes.cart, label: "العودة إلى السلة" }}
      />
    );
  }

  if (!paid) {
    return timedOut ? (
      <Notice
        tone="info"
        title="ما زلنا نؤكد عملية الدفع"
        text="قد يستغرق التأكيد بضع دقائق. سنرسل لك بريداً إلكترونياً عند اكتماله، وستجد الطلب في صفحة طلباتك."
        action={{ href: routes.studentOrders, label: "عرض طلباتي" }}
      />
    ) : (
      <ConfirmingSkeleton />
    );
  }

  const detail = order.data;
  const titles = lineTitles(detail);
  // A company subscription: the team and its billing, and the way to add employees.
  const team = teamOrderOf(detail);
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col items-start gap-4 rounded-panel border border-line-strong bg-surface p-6 md:p-10">
        <CircleCheck aria-hidden="true" className="size-12 fill-none text-accent" />
        {team ? (
          <>
            <h2 className="m-0 text-3xl leading-[1.4] font-bold">
              مرحباً بفريق {team.companyName ?? "شركتك"} في <bdi dir="ltr">eMastery Business</bdi>
            </h2>
            <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
              تمّ الدفع وفُعّل اشتراك {team.seats} موظفاً{subscription ? ` في ${subscription.plan_title}` : ""}. الخطوة التالية:
              أضف موظفيك ليحصل كل منهم على وصوله فوراً. أرسلنا الفاتورة إلى بريدك الإلكتروني.
            </p>
          </>
        ) : subscription ? (
          <>
            <h2 className="m-0 text-3xl leading-[1.4] font-bold">مبروك! اشتراكك في {subscription.plan_title} فعّال الآن</h2>
            <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
              فُتح لك الوصول إلى كل ما تشمله باقتك حتى {formatDate(subscription.current_period_end)}، ويتجدد الاشتراك
              تلقائياً. أرسلنا الفاتورة إلى بريدك الإلكتروني.
            </p>
          </>
        ) : free ? (
          <>
            <h2 className="m-0 text-3xl leading-[1.4] font-bold">أهلاً بك! تمّ تسجيلك مجاناً</h2>
            <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
              فُتح لك الوصول فوراً ويمكنك البدء الآن. أرسلنا تأكيد التسجيل إلى بريدك الإلكتروني، وتجد فاتورته هنا أيضاً.
            </p>
          </>
        ) : (
          <>
            <h2 className="m-0 text-3xl leading-[1.4] font-bold">شكراً لك! تمّ الدفع بنجاح</h2>
            <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
              أصبح طلبك جاهزاً، وفُتح لك الوصول إلى ما اشتريته. أرسلنا الفاتورة إلى بريدك الإلكتروني، ويمكنك تنزيلها من
              هنا أيضاً في أي وقت.
            </p>
          </>
        )}
        {detail ? (
          <dl className="m-0 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-fg-muted">رقم الطلب</dt>
              <dd className="m-0 font-bold" dir="ltr">
                {orderNumber(detail.order_id)}
              </dd>
            </div>
            {detail.placed_at ?? detail.created_at ? (
              <div className="flex gap-2">
                <dt className="text-fg-muted">التاريخ</dt>
                <dd className="m-0 font-bold">{formatDateTime((detail.placed_at ?? detail.created_at)!)}</dd>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <dt className="text-fg-muted">الحالة</dt>
              <dd className="m-0">
                <StatusTag status={orderStatus(detail.status)} />
              </dd>
            </div>
          </dl>
        ) : null}
        <ul className="ma-cluster m-0 list-none p-0">
          <li>
            {team ? (
              <AddEmployeesLink />
            ) : (
              <ButtonLink href={routes.studentAccess} variant="primary">
                ابدأ التعلّم الآن
              </ButtonLink>
            )}
          </li>
          {subscription ? (
            <li>
              <ButtonLink href={routes.studentSubscription} variant="secondary">
                إدارة اشتراكي
              </ButtonLink>
            </li>
          ) : null}
          <li>
            <ButtonLink href={routes.studentOrders} variant="soft">
              عرض طلباتي
            </ButtonLink>
          </li>
        </ul>
      </header>

      {team && detail ? (
        <TeamOrderSummary team={team} order={detail} renewsOn={subscription?.current_period_end ?? null} />
      ) : null}

      <section aria-labelledby="order-access-title" className="flex flex-col gap-4">
        <h2 id="order-access-title" className="m-0 text-xl font-bold">
          وصولك
        </h2>
        {accessItems && accessItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {accessItems.map((entitlement) => (
              <AccessCard
                key={entitlement.entitlement_id}
                entitlement={entitlement}
                now={access.dataUpdatedAt}
                title={entitlement.product_slug ? titles.get(entitlement.product_slug) : undefined}
              />
            ))}
          </div>
        ) : access.isFetching || access.isPending ? (
          <Skeleton className="h-32" />
        ) : (
          <p className="m-0 text-fg-muted">نفعّل وصولك الآن، وسيظهر هنا وفي صفحة وصولك خلال دقائق.</p>
        )}
      </section>

      {detail ? (
        <>
          <OrderLines order={detail} />
          <OrderInvoices orderId={detail.order_id} invoices={detail.invoices ?? []} />
        </>
      ) : order.isError ? (
        <Notice tone="warning" title="تعذّر عرض تفاصيل الطلب" text="الدفع مكتمل. ستجد التفاصيل في صفحة طلباتك." />
      ) : (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24" />
        </div>
      )}
    </div>
  );
}

function ConfirmingSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
      <Clock aria-hidden="true" className="size-10 fill-none text-accent motion-safe:animate-pulse" />
      <h2 className="m-0 text-2xl font-bold">نؤكد عملية الدفع…</h2>
      <p className="m-0 max-w-[56ch] leading-7 text-fg-muted">
        نتحقق من الدفع مع Stripe. يستغرق ذلك عادةً بضع ثوانٍ؛ لا حاجة لإعادة الدفع أو تحديث الصفحة.
      </p>
      <Skeleton className="h-5 w-64" />
    </div>
  );
}

function NoOrder() {
  return (
    <Notice
      tone="info"
      title="لا يوجد طلب لعرضه"
      text="لم نجد طلباً مرتبطاً بهذه الصفحة. ستجد كل مشترياتك في صفحة طلباتك."
      action={{ href: routes.studentOrders, label: "عرض طلباتي" }}
    />
  );
}

type NoticeProps = {
  tone: "info" | "warning" | "danger";
  title: string;
  text: string;
  action?: { href: Parameters<typeof ButtonLink>[0]["href"]; label: string };
};

function Notice({ tone, title, text, action }: NoticeProps) {
  return (
    <div className="flex flex-col items-start gap-5">
      <div className={`ma-alert ma-alert--${tone} w-full`} role={tone === "danger" ? "alert" : "status"}>
        <TriangleAlert aria-hidden="true" className="fill-none" />
        <div>
          <p className="ma-alert__title">{title}</p>
          <p className="ma-alert__text">{text}</p>
        </div>
      </div>
      {action ? (
        <ButtonLink href={action.href} variant="primary">
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}
