"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  DollarSign,
  Gift,
  Hourglass,
  MousePointerClick,
  Share2,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import { joinReferrals, referralKeys, referralQueries, type MyReferralsResponse } from "@/lib/api/referrals";
import { cn } from "@/lib/cn";
import { formatDate, fromMinor } from "@/lib/format";

import { StudentCredit } from "./components/student-credit";

const REWARD_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "قيد الانتظار", tone: "ma-tag--sky" },
  granted: { label: "أُضيفت لرصيدك", tone: "ma-tag--green" },
  revoked: { label: "أُلغيت (استرداد)", tone: "ma-tag--soft" },
};

function Stat({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: LucideIcon;
  tone?: "default" | "accent" | "green";
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-2 rounded-panel border p-4 bg-surface transition-shadow",
        tone === "accent"
          ? "border-accent/30 bg-accent/5"
          : tone === "green"
            ? "border-green/30 bg-green/5"
            : "border-line"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium text-fg-muted">{label}</span>
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0",
              tone === "accent" ? "text-accent" : tone === "green" ? "text-green" : "text-fg-muted"
            )}
          />
        ) : null}
      </div>
      <div>
        <strong className="text-xl sm:text-2xl font-bold tracking-tight">{value}</strong>
        {sublabel ? <p className="m-0 mt-0.5 text-xs text-fg-muted">{sublabel}</p> : null}
      </div>
    </div>
  );
}

function ShareLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(`انضم إلى ماستري أكاديمي واحصل على خصم على أول دورة: ${link}`);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          readOnly
          dir="ltr"
          value={link}
          aria-label="رابط الدعوة"
          className="ma-input min-w-0 flex-1 font-mono text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          className="ma-btn ma-btn--primary gap-2"
          onClick={() => {
            void navigator.clipboard?.writeText(link);
            setCopied(true);
          }}
        >
          {copied ? <Check aria-hidden="true" className="size-4 fill-none" /> : <Copy aria-hidden="true" className="size-4 fill-none" />}
          {copied ? "تم النسخ" : "انسخ الرابط"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className="ma-btn ma-btn--soft gap-2 text-sm" href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer">
          <Share2 aria-hidden="true" className="size-4 fill-none" /> واتساب
        </a>
        <a className="ma-btn ma-btn--soft gap-2 text-sm" href={`https://twitter.com/intent/tweet?text=${text}`} target="_blank" rel="noopener noreferrer">
          <Share2 aria-hidden="true" className="size-4 fill-none" /> X
        </a>
      </div>
    </div>
  );
}

function PendingApplication() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10 bg-surface">
      <Hourglass aria-hidden="true" className="size-8 text-accent" />
      <h2 className="m-0 text-2xl font-bold">طلب انضمامك كمسوّق قيد المراجعة</h2>
      <p className="m-0 max-w-[60ch] text-fg-muted">
        سنراجع طلبك ونرسل لك بريداً عند الموافقة. بعدها يظهر هنا رابطك وأرباحك ويمكنك طلب صرف عمولاتك.
      </p>
    </div>
  );
}

function Joined({ data }: { data: MyReferralsResponse }) {
  const invites = useQuery(referralQueries.invites());
  const marketer = data.partner_type === "marketer";

  return (
    <div className="flex flex-col gap-6">
      {/* Referral Link & Identity Header */}
      <section className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-xl font-bold">لوحة التسويق ورابط الدعوة</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-fg-muted font-medium">كود الإحالة:</span>
            <code className="rounded bg-surface-alt px-2.5 py-1 font-mono text-xs sm:text-sm font-bold border border-line">
              <bdi dir="ltr">{data.referral_code}</bdi>
            </code>
            <span className="ma-tag ma-tag--green text-xs">متزامن مع Tolt</span>
          </div>
        </div>
        <p className="m-0 text-fg-muted text-sm sm:text-base">
          {marketer
            ? "شارك رابطك أو كودك مع جمهورك. تُحسب عمولتك عن كل عملية شراء، وتُضاف إلى رصيدك بعد اعتمادها لتطلب صرفها."
            : `شارك رابطك مع أصدقائك. يحصل صديقك على خصم ${Number(data.friend_discount_percent)}% على أول شراء، وتحصل أنت على رصيد يُخصم من مشترياتك القادمة.`}
        </p>
        {data.link ? <ShareLink link={data.link} /> : null}
      </section>

      {/* Affiliate Metrics Cards */}
      <section aria-labelledby="affiliate-stats-heading" className="flex flex-col gap-3">
        <h2 id="affiliate-stats-heading" className="m-0 text-lg font-bold">
          أداء الإحالات والمبيعات
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {marketer ? (
            <>
              <Stat
                label="إجمالي المبيعات"
                value={<Money amount={fromMinor(data.total_revenue_minor ?? 0)} />}
                icon={TrendingUp}
                tone="accent"
              />
              <Stat
                label="العمولات المعتمدة"
                value={<Money amount={fromMinor(data.approved_commission_minor ?? 0)} />}
                sublabel="لم تُصرف بعد"
                icon={DollarSign}
                tone="green"
              />
            </>
          ) : (
            <Stat
              label="رصيد مكتسب (إجمالي)"
              value={<Money amount={fromMinor(data.earned_minor)} />}
              icon={WalletCards}
              tone="green"
            />
          )}
          <Stat
            label="النقرات (Clicks)"
            value={data.clicks ?? 0}
            icon={MousePointerClick}
          />
          <Stat
            label="المسجّلون (Leads)"
            value={data.invited}
            icon={Users}
          />
          <Stat
            label="المشترون (Paid)"
            value={data.qualified}
            icon={ShoppingBag}
          />
        </div>
      </section>

      {marketer ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-accent/30 bg-accent/5 p-4 sm:p-5">
          <p className="m-0 text-sm sm:text-base">
            <strong>لوحة المسوّق</strong> — إحصاءاتك ورسومك البيانية وعملاؤك وكوبوناتك وطلبات الصرف في مكان واحد.
          </p>
          <ButtonLink href={routes.marketerDashboard} variant="primary" className="text-sm">افتح لوحة المسوّق</ButtonLink>
        </section>
      ) : (
        <StudentCredit data={data} />
      )}

      {/* Conversions / Orders History Table */}
      {data.conversions && data.conversions.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-lg font-bold">سجل الطلبات والمبيعات المحالة</h2>
            <span className="text-xs text-fg-muted font-medium">{data.conversions.length} عملية شراء</span>
          </div>
          <div className="overflow-x-auto rounded-panel border border-line bg-surface">
            <table className="w-full min-w-[540px] border-collapse text-end text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-alt/50 text-xs font-semibold text-fg-muted">
                  <th className="p-3 text-start">رقم الطلب / التاريخ</th>
                  <th className="p-3 text-end">قيمة المبيعات</th>
                  <th className="p-3 text-end">العمولة / المكافأة</th>
                  <th className="p-3 text-end">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.conversions.map((conv) => (
                  <tr key={conv.conversion_id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="p-3 text-start">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-fg">
                            {conv.order_id.slice(0, 8)}…
                          </span>
                          {conv.is_first_purchase ? (
                            <span className="ma-tag ma-tag--sky text-[10px] px-1.5 py-0.5">أول شراء</span>
                          ) : null}
                        </div>
                        <span className="text-xs text-fg-muted">
                          {formatDate(conv.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-end font-semibold">
                      <Money amount={fromMinor(conv.order_total_minor)} />
                    </td>
                    <td className="p-3 text-end">
                      {conv.commission_minor ? (
                        <span className="inline-flex items-center gap-1 font-bold text-accent">
                          +<Money amount={fromMinor(conv.commission_minor)} />
                          <span className="text-xs font-normal text-fg-muted">(عمولة)</span>
                        </span>
                      ) : conv.reward_minor ? (
                        <span className="inline-flex items-center gap-1 font-bold text-green">
                          +<Money amount={fromMinor(conv.reward_minor)} />
                          <span className="text-xs font-normal text-fg-muted">(رصيد)</span>
                        </span>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>
                    <td className="p-3 text-end">
                      <span className="ma-tag ma-tag--green text-xs">
                        {conv.commission_status === "approved" || conv.reward_status === "granted" ? "معتمدة" : "مكتملة"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Rewards List (students: referral credit) */}
      {marketer ? null : (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-lg font-bold">المكافآت وقسائم الرصيد</h2>
          {data.rewards.length === 0 ? (
            <p className="m-0 text-fg-muted">ستظهر هنا مكافأتك عندما يشتري أول صديق.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {data.rewards.map((reward) => {
                const status = REWARD_STATUS[reward.status] ?? { label: reward.status, tone: "ma-tag--soft" };
                return (
                  <li key={reward.reward_id} className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line p-4 bg-surface">
                    <span className="flex flex-col gap-1">
                      <strong className="text-base font-bold"><Money amount={fromMinor(reward.amount_minor)} /></strong>
                      <span className="text-sm text-fg-muted">
                        <bdi dir="ltr">{reward.referred_email}</bdi> ·{" "}
                        {reward.status === "pending" ? `تُضاف في ${formatDate(reward.eligible_at)}` : formatDate(reward.created_at ?? reward.eligible_at)}
                      </span>
                    </span>
                    <span className={cn("ma-tag", status.tone)}>{status.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Invited Friends List */}
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">أصدقاؤك المحالون</h2>
        {invites.data && invites.data.items.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {invites.data.items.map((invite) => (
              <li key={invite.customer_id} className="flex items-center justify-between gap-3 rounded-panel border border-line p-3 bg-surface">
                <bdi dir="ltr" className="font-mono text-sm">{invite.customer_email}</bdi>
                <span className={cn("ma-tag", invite.paid_orders > 0 ? "ma-tag--green" : "ma-tag--soft")}>
                  {invite.paid_orders > 0 ? "اشترى" : "سجّل"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-fg-muted">لم يسجّل أحد عبر رابطك بعد.</p>
        )}
      </section>
    </div>
  );
}

/** "Invite a friend & affiliate dashboard": the user's referral link, metrics, conversions, and rewards earned. */
export function ReferralsPage() {
  const queryClient = useQueryClient();
  const me = useQuery(referralQueries.me());
  const join = useMutation({
    mutationFn: () => joinReferrals(),
    onSuccess: (data) => queryClient.setQueryData(referralKeys.me(), data),
  });

  if (me.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (me.isError) {
    return <p role="alert" className="ma-alert ma-alert--warning m-0">تعذّر تحميل برنامج الدعوة. حدّث الصفحة وحاول مجدداً.</p>;
  }
  const data = me.data;
  if (data.joined && data.partner_type === "marketer" && data.partner_status === "pending") return <PendingApplication />;
  if (data.joined) return <Joined data={data} />;
  return (
    <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10 bg-surface">
      <Gift aria-hidden="true" className="size-8 text-accent" />
      <h2 className="m-0 text-2xl font-bold">ادعُ أصدقاءك واربح رصيدًا وعمولات</h2>
      {data.program_active ? (
        <>
          <p className="m-0 max-w-[60ch] text-fg-muted">
            احصل على قسيمة رصيد بقيمة <Money amount={fromMinor(data.reward_minor)} /> وعمولات عن كل صديق يشتري لأول مرة عبر رابطك،
            ويحصل صديقك على خصم {Number(data.friend_discount_percent)}% على أول شراء.
          </p>
          {join.error ? (
            <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm">
              {join.error instanceof ApiError && join.error.status === 409 ? "لا يمكن الانضمام بهذا الحساب." : "تعذّر إنشاء رابطك. حاول مجدداً."}
            </p>
          ) : null}
          <button type="button" className="ma-btn ma-btn--primary gap-2" disabled={join.isPending} onClick={() => join.mutate()}>
            <UserPlus aria-hidden="true" className="size-4 fill-none" />
            {join.isPending ? "جارٍ إنشاء رابطك…" : "احصل على رابط الدعوة"}
          </button>
        </>
      ) : (
        <p className="m-0 text-fg-muted">برنامج الدعوة غير متاح حاليًا. عُد قريبًا!</p>
      )}
    </div>
  );
}
