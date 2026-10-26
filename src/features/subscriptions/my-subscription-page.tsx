"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Info, Video } from "lucide-react";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { AccessCard } from "@/features/orders/components/order-sections";
import { CancelSubscriptionDialog } from "@/features/subscriptions/components/cancel-subscription-dialog";
import { ApiError } from "@/lib/api/client";
import { commerceKeys, commerceQueries } from "@/lib/api/commerce";
import {
  replaceChooseXCourse,
  resumeMySubscription,
  selectChooseXCourse,
  subscriptionKeys,
  subscriptionQueries,
  type MySubscription,
} from "@/lib/api/subscriptions";
import { formatDate, formatMoney } from "@/lib/format";
import { refreshOwnedProducts } from "@/lib/shop/use-owned-products";

const STATUS: Record<string, { label: string; tag: string }> = {
  active: { label: "فعّال", tag: "ma-tag--teal" },
  pending: { label: "قيد التفعيل", tag: "ma-tag--sky" },
  past_due: { label: "متأخر السداد", tag: "ma-tag--yellow" },
  suspended: { label: "موقوف", tag: "ma-tag--yellow" },
  canceled: { label: "ملغي", tag: "ma-tag--pink" },
  expired: { label: "منتهٍ", tag: "ma-tag--soft" },
};

function errorText(error: unknown): string {
  if (error instanceof ApiError && typeof error.details.detail === "string") return error.details.detail;
  return "تعذّر إتمام العملية. حاول مجدداً.";
}

/** Choose-X: pick programs up to the allowance, swap one before starting it. */
function ChooseXPanel({ subscription }: { subscription: MySubscription }) {
  const queryClient = useQueryClient();
  const state = useQuery(subscriptionQueries.selections(subscription.subscription_id));
  const [swap, setSwap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    void queryClient.invalidateQueries({ queryKey: commerceKeys.all });
    void refreshOwnedProducts();
  };
  const select = useMutation({ mutationFn: (productId: string) => selectChooseXCourse(subscription.subscription_id, productId), onSuccess: refresh });
  const replace = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => replaceChooseXCourse(subscription.subscription_id, from, to),
    onSuccess: refresh,
  });

  if (state.isPending) return <Skeleton className="h-40" />;
  if (!state.data) return null;
  const { usage, active_selections: active, eligible_products: eligible } = state.data;
  const chosen = new Set(active.map((s) => s.product_id));
  const available = eligible.filter((p) => !chosen.has(p.product_id));
  const visible = available.filter((p) =>
    (!type || p.product_type === type) &&
    `${p.title ?? ""} ${p.slug ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const error = select.error ?? replace.error;

  return (
    <section aria-labelledby="choose-title" className="flex flex-col gap-4 rounded-panel border border-line p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="choose-title" className="m-0 text-xl font-bold">
          برامجك المختارة
        </h2>
        <span className="ma-tag ma-tag--soft">
          اخترت {usage.used_selections} من {usage.selection_allowance} · متبقٍ {usage.remaining_selections}
        </span>
      </div>
      {active.length > 0 ? (
        <ul className="m-0 grid list-none gap-3 p-0">
          {active.map((selection) => (
            <li key={selection.selection_id} className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line p-4">
              <span className="font-bold">{selection.product_title ?? selection.product_slug}</span>
              {selection.can_replace && available.length > 0 ? (
                <span className="flex flex-wrap items-center gap-2">
                  <select
                    className="ma-input min-h-11 w-auto"
                    aria-label={`استبدال ${selection.product_title ?? ""}`}
                    value={swap[selection.product_id] ?? ""}
                    onChange={(e) => setSwap((prev) => ({ ...prev, [selection.product_id]: e.target.value }))}
                  >
                    <option value="">استبدل ببرنامج آخر…</option>
                    {available.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.title ?? p.slug}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="soft"
                    disabled={!swap[selection.product_id] || replace.isPending}
                    onClick={() => replace.mutate({ from: selection.product_id, to: swap[selection.product_id]! })}
                  >
                    استبدال
                  </Button>
                </span>
              ) : (
                <span className="text-sm text-fg-muted">{selection.learning_started ? "بدأت التعلّم" : ""}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {usage.remaining_selections > 0 && available.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="m-0 text-base font-bold">اختر برنامجاً من الكتالوج المنشور</h3>
          <div className="flex flex-wrap gap-2">
            <input className="ma-input min-h-11 flex-1" type="search" aria-label="ابحث عن برنامج" placeholder="ابحث عن برنامج…"
              value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="ma-input min-h-11" aria-label="نوع البرنامج" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="">كل الأنواع</option>
              <option value="course">دورات</option>
              <option value="diploma">دبلومات</option>
              <option value="package">حزم</option>
              <option value="bundle">باقات</option>
            </select>
          </div>
          <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
            {visible.map((product) => (
              <li key={product.product_id} className="flex items-center justify-between gap-3 rounded-panel border border-line p-3">
                <span>{product.title ?? product.slug} <span className="text-sm text-fg-muted">{product.product_type === "course" ? "دورة" : product.product_type === "diploma" ? "دبلوم" : product.product_type === "package" ? "حزمة" : "باقة"}</span></span>
                <Button size="sm" variant="primary" disabled={select.isPending} onClick={() => select.mutate(product.product_id)}>
                  اختيار
                </Button>
              </li>
            ))}
          </ul>
          {visible.length === 0 ? <p className="m-0 text-sm text-fg-muted">لا توجد برامج مطابقة.</p> : null}
        </div>
      ) : null}
      {usage.remaining_selections > 0 && available.length === 0 ? (
        <p className="m-0 text-sm text-fg-muted">لا توجد برامج منشورة متاحة للاختيار حالياً.</p>
      ) : null}
      {error ? (
        <p className="m-0 text-sm text-danger" role="alert">
          {errorText(error)}
        </p>
      ) : null}
    </section>
  );
}

function SubscriptionCard({ subscription }: { subscription: MySubscription }) {
  const queryClient = useQueryClient();
  const status = STATUS[subscription.status] ?? { label: subscription.status, tag: "ma-tag--soft" };
  const snapshot = (subscription.plan_snapshot ?? {}) as Record<string, unknown>;
  const paid = Number(snapshot.effective_price ?? snapshot.price ?? subscription.price ?? 0);
  const live = subscription.status === "active" || subscription.status === "past_due";
  const [cancelOpen, setCancelOpen] = useState(false);
  // One key per resume attempt: a double click repeats the same Stripe call.
  const [resumeKey, setResumeKey] = useState(() => crypto.randomUUID());
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    void queryClient.invalidateQueries({ queryKey: commerceKeys.all });
    void refreshOwnedProducts();
  };
  const resume = useMutation({
    mutationFn: () => resumeMySubscription(subscription.subscription_id, resumeKey),
    onSuccess: () => {
      setResumeKey(crypto.randomUUID());
      refresh();
    },
  });
  const access = useQuery({
    ...commerceQueries.entitlements({ limit: 100 }),
    // Past-due access is paused, not gone: keep showing it with its hold notice.
    select: (page) =>
      page.items.filter((e) => e.source_id === subscription.subscription_id && (e.status === "active" || e.status === "suspended")),
  });

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-panel border border-line-strong p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0 text-2xl font-bold">{subscription.plan_title}</h2>
          <span className={`ma-tag ${status.tag}`}>{status.label}</span>
          {live && subscription.cancel_at_period_end ? <span className="ma-tag ma-tag--pink">ينتهي ولن يتجدد</span> : null}
        </div>
        <dl className="m-0 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-fg-muted">تدفع</dt>
            <dd className="m-0 font-bold">
              <span dir="ltr">{formatMoney(paid)}</span> {subscription.billing_interval === "year" ? "سنوياً" : "شهرياً"}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">
              {!live ? "انتهى في" : subscription.cancel_at_period_end ? "ينتهي الوصول في" : "التجديد القادم"}
            </dt>
            <dd className="m-0 font-bold">
              {formatDate(!live && subscription.canceled_at ? subscription.canceled_at : subscription.current_period_end)}
            </dd>
          </div>
          {subscription.audience_type === "company" ? (
            <div>
              <dt className="text-fg-muted">المقاعد</dt>
              <dd className="m-0 font-bold">{subscription.seat_limit}</dd>
            </div>
          ) : null}
        </dl>
        {subscription.status === "past_due" ? (
          <div className="ma-alert ma-alert--warning" role="status">
            <AlertTriangle aria-hidden="true" className="fill-none" />
            <div>
              <p className="ma-alert__title">تعذّر تجديد اشتراكك</p>
              <p className="ma-alert__text">
                أوقفنا الوصول إلى برامج الباقة مؤقتاً حتى تنجح دفعة التجديد. سيعود الوصول تلقائياً بعد الدفع.
              </p>
            </div>
          </div>
        ) : null}
        {live && subscription.cancel_at_period_end ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
              <CalendarClock aria-hidden="true" className="size-4 fill-none" />
              ألغيت التجديد. يبقى وصولك حتى {formatDate(subscription.current_period_end)}، ويمكنك التراجع قبل هذا التاريخ.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" disabled={resume.isPending} aria-busy={resume.isPending} onClick={() => resume.mutate()}>
                {resume.isPending ? "جارٍ الاستئناف…" : "استئناف الاشتراك"}
              </Button>
              <Button size="sm" variant="soft" disabled={resume.isPending} onClick={() => setCancelOpen(true)}>
                إلغاء الآن
              </Button>
            </div>
            {resume.error ? (
              <p className="m-0 text-sm text-danger" role="alert">
                {errorText(resume.error)}
              </p>
            ) : null}
          </div>
        ) : live ? (
          <div>
            <Button size="sm" variant="soft" onClick={() => setCancelOpen(true)}>
              إلغاء الاشتراك
            </Button>
          </div>
        ) : null}
        {resume.isSuccess && !subscription.cancel_at_period_end ? (
          <p className="m-0 text-sm text-fg-muted" role="status">
            تم استئناف اشتراكك وسيتجدد تلقائياً في {formatDate(subscription.current_period_end)}.
          </p>
        ) : null}
      </header>
      {cancelOpen ? (
        <CancelSubscriptionDialog
          subscription={subscription}
          onClose={() => setCancelOpen(false)}
          onCanceled={() => {
            setCancelOpen(false);
            resume.reset();
            refresh();
          }}
        />
      ) : null}

      {live && subscription.plan_type === "choose_x" ? <ChooseXPanel subscription={subscription} /> : null}

      <section aria-labelledby={`access-${subscription.subscription_id}`} className="flex flex-col gap-4">
        <h2 id={`access-${subscription.subscription_id}`} className="m-0 text-xl font-bold">
          البرامج المفتوحة لك
        </h2>
        {access.isPending ? (
          <Skeleton className="h-32" />
        ) : access.data && access.data.length > 0 ? (
          <div className="grid gap-4 @xl:grid-cols-2">
            {access.data.map((entitlement) => (
              <AccessCard key={entitlement.entitlement_id} entitlement={entitlement} now={access.dataUpdatedAt} />
            ))}
          </div>
        ) : (
          <p className="m-0 text-fg-muted">لا توجد برامج مفتوحة بعد.</p>
        )}
      </section>
    </article>
  );
}

function PerksBanner() {
  const perks = useQuery(subscriptionQueries.perks());
  if (!perks.data?.has_perks) return null;
  const { credits_remaining: left, credits_per_period: total, discount_percent: discount } = perks.data;
  return (
    <div className="ma-alert ma-alert--info" role="status">
      <Video aria-hidden="true" className="fill-none" />
      <div>
        <p className="ma-alert__title">استشاراتك مع الخبراء</p>
        <p className="ma-alert__text">
          {total > 0 ? `متبقٍ لك ${left} من ${total} جلسات مجانية في هذه الفترة. ` : ""}
          {discount ? `وخصم ${Number(discount)}٪ على أي جلسة مدفوعة.` : ""}
        </p>
        <ButtonLink href={routes.consultations} variant="soft" size="sm" className="mt-3">
          احجز استشارة
        </ButtonLink>
      </div>
    </div>
  );
}

/** `/students/subscription`: the customer's plans, renewal, Choose-X picks and what they unlocked. */
export function MySubscriptionPage() {
  const subscriptions = useQuery(subscriptionQueries.mine());
  if (subscriptions.isPending) return <Skeleton className="h-96" />;
  const items = subscriptions.data ?? [];
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-8">
        <Info aria-hidden="true" className="size-6 fill-none text-accent" />
        <p className="m-0 text-lg font-bold">ليس لديك اشتراك بعد</p>
        <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
          اشترك مرة واحدة واحصل على الدورات والدبلومات والاستشارات مع الخبراء ومخطط التعلّم الذكي.
        </p>
        <ButtonLink href={routes.subscriptions} variant="primary">
          تصفّح الباقات
        </ButtonLink>
      </div>
    );
  }
  return (
    <div className="@container flex flex-col gap-10">
      <PerksBanner />
      {items.map((subscription) => (
        <SubscriptionCard key={subscription.subscription_id} subscription={subscription} />
      ))}
    </div>
  );
}
