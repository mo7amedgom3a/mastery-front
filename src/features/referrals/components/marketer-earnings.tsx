"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CheckCircle2, Clock, Hourglass, Pencil, Wallet } from "lucide-react";
import { useId, useState } from "react";

import { Money } from "@/components/shop/money";
import { Skeleton } from "@/components/ui/skeleton";
import { describedBy, Field, FormError } from "@/features/auth/components/field";
import { ApiError } from "@/lib/api/client";
import {
  cancelPayout,
  referralKeys,
  referralQueries,
  requestPayout,
  type MyEarningsResponse,
  type MyPayout,
} from "@/lib/api/referrals";
import { cn } from "@/lib/cn";
import { formatDate, fromMinor } from "@/lib/format";

import { PayoutDetailsForm } from "./payout-details-form";
import { ReferralDialog } from "./referral-dialog";

const PAYOUT_STATUS: Record<string, { label: string; tone: string }> = {
  requested: { label: "قيد المراجعة", tone: "ma-tag--sky" },
  approved: { label: "معتمد — بانتظار التحويل", tone: "ma-tag--sky" },
  paid: { label: "تم التحويل", tone: "ma-tag--green" },
  partially_paid: { label: "تحويل جزئي", tone: "ma-tag--green" },
  rejected: { label: "مرفوض", tone: "ma-tag--pink" },
  cancelled: { label: "ملغى", tone: "ma-tag--soft" },
};

const METHOD_LABEL: Record<string, string> = {
  paypal: "PayPal",
  bank_transfer: "تحويل بنكي",
  wise: "Wise",
  other: "طريقة أخرى",
};

function blockedMessage(data: MyEarningsResponse): string | null {
  switch (data.blocked_reason) {
    case "request_open":
      return "لديك طلب صرف قيد المعالجة. يمكنك تقديم طلب جديد بعد إغلاقه.";
    case "missing_details":
      return "أضف بيانات الدفع أولاً لنعرف أين نحوّل لك المبلغ.";
    case "below_minimum":
      return data.balance.available_minor < 0
        ? "رصيدك سالب بسبب استرداد عمولات سبق صرفها، وسيُخصم من عمولاتك القادمة."
        : null;
    case "partner_inactive":
      return "حسابك كمسوّق غير نشط حالياً. تواصل معنا للمساعدة.";
    default:
      return null;
  }
}

function requestError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    const detail = typeof error.details.detail === "string" ? error.details.detail : "";
    if (error.status === 409) return "لديك طلب صرف مفتوح بالفعل.";
    if (detail === "below_minimum") return "المبلغ أقل من الحد الأدنى للصرف.";
    if (detail === "above_available") return "المبلغ أكبر من رصيدك المتاح.";
    if (detail === "missing_details") return "أضف بيانات الدفع أولاً.";
  }
  return "تعذّر إرسال الطلب. حاول مجدداً.";
}

function Card({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: typeof Wallet;
  tone?: "default" | "accent" | "green";
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-2 rounded-panel border bg-surface p-4",
        tone === "accent" ? "border-accent/30 bg-accent/5" : tone === "green" ? "border-green/30 bg-green/5" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-muted sm:text-sm">{label}</span>
        <Icon aria-hidden="true" className={cn("size-4 shrink-0", tone === "accent" ? "text-accent" : tone === "green" ? "text-green" : "text-fg-muted")} />
      </div>
      <div>
        <strong className="text-xl font-bold tracking-tight sm:text-2xl">{value}</strong>
        {sub ? <p className="m-0 mt-0.5 text-xs text-fg-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

function RequestPayoutDialog({ data, onClose }: { data: MyEarningsResponse; onClose: () => void }) {
  const baseId = useId();
  const queryClient = useQueryClient();
  const available = data.balance.available_minor;
  const minimum = data.balance.minimum_payout_minor;
  const [amount, setAmount] = useState(String(fromMinor(available)));
  const amountMinor = Math.round(Number(amount) * 100);
  const valid = Number.isFinite(amountMinor) && amountMinor >= minimum && amountMinor <= available;
  const submit = useMutation({
    mutationFn: () => requestPayout(amountMinor),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: referralKeys.all });
      onClose();
    },
  });
  const hint = `من ${fromMinor(minimum).toFixed(2)} إلى ${fromMinor(available).toFixed(2)} دولار`;

  return (
    <ReferralDialog title="طلب صرف العمولة" onClose={onClose} busy={submit.isPending}>
      {() => (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) submit.mutate();
          }}
        >
          <p className="m-0 text-sm text-fg-muted">
            رصيدك المتاح <strong className="text-fg"><Money amount={fromMinor(available)} /></strong>. سنراجع الطلب ونحوّل المبلغ إلى{" "}
            <strong className="text-fg">{METHOD_LABEL[data.payout_method ?? ""] ?? data.payout_method}</strong>{" "}
            {data.destination ? <bdi dir="ltr">({data.destination})</bdi> : null}.
          </p>
          <Field id={`${baseId}-amount`} label="المبلغ المطلوب (USD)" hint={hint} required>
            <input
              id={`${baseId}-amount`}
              type="number"
              inputMode="decimal"
              dir="ltr"
              min={fromMinor(minimum)}
              max={fromMinor(available)}
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              {...describedBy(`${baseId}-amount`, undefined, hint)}
              className="ma-input"
            />
          </Field>
          <p className="m-0 text-xs text-fg-muted">
            {data.payout_terms}. قد نحوّل جزءاً من المبلغ، ويعود الباقي إلى رصيدك لتطلبه لاحقاً.
          </p>
          <FormError message={requestError(submit.error)} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="ma-btn ma-btn--primary" disabled={!valid || submit.isPending}>
              {submit.isPending ? "جارٍ الإرسال…" : "إرسال الطلب"}
            </button>
            <button type="button" className="ma-btn ma-btn--soft" onClick={onClose} disabled={submit.isPending}>
              إلغاء
            </button>
          </div>
        </form>
      )}
    </ReferralDialog>
  );
}

function DetailsDialog({ onClose }: { onClose: () => void }) {
  const details = useQuery(referralQueries.payoutDetails());
  return (
    <ReferralDialog title="بيانات الدفع" onClose={onClose}>
      {() =>
        details.isPending ? (
          <Skeleton className="h-40" />
        ) : (
          <PayoutDetailsForm initial={details.data ?? null} onSaved={onClose} />
        )
      }
    </ReferralDialog>
  );
}

function PayoutRow({ payout }: { payout: MyPayout }) {
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => cancelPayout(payout.payout_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referralKeys.all }),
  });
  const status = PAYOUT_STATUS[payout.status] ?? { label: payout.status, tone: "ma-tag--soft" };
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface p-4">
      <span className="flex min-w-0 flex-col gap-1">
        <strong className="text-base font-bold">
          {payout.paid_minor != null ? <Money amount={fromMinor(payout.paid_minor)} /> : <Money amount={fromMinor(payout.requested_minor)} />}
          {payout.status === "partially_paid" ? (
            <span className="ms-2 text-xs font-normal text-fg-muted">
              من <Money amount={fromMinor(payout.requested_minor)} /> — عاد <Money amount={fromMinor(payout.returned_minor)} /> إلى رصيدك
            </span>
          ) : null}
        </strong>
        <span className="text-sm text-fg-muted">
          {METHOD_LABEL[payout.method] ?? payout.method}
          {payout.destination ? <> · <bdi dir="ltr">{payout.destination}</bdi></> : null} ·{" "}
          {payout.requested_at ? formatDate(payout.requested_at) : null}
          {payout.payment_reference ? <> · مرجع التحويل <bdi dir="ltr">{payout.payment_reference}</bdi></> : null}
        </span>
        {payout.reject_reason ? <span className="text-sm text-fg-muted">السبب: {payout.reject_reason}</span> : null}
      </span>
      <span className="flex items-center gap-2">
        <span className={cn("ma-tag", status.tone)}>{status.label}</span>
        {payout.status === "requested" ? (
          <button type="button" className="ma-btn ma-btn--soft text-sm" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            إلغاء الطلب
          </button>
        ) : null}
      </span>
    </li>
  );
}

/** Marketer earnings: withdrawable balance, payout requests and where payouts are sent. */
export function MarketerEarnings() {
  const earnings = useQuery(referralQueries.earnings());
  const payouts = useQuery(referralQueries.payouts());
  const [dialog, setDialog] = useState<"request" | "details" | null>(null);

  if (earnings.isPending) return <Skeleton className="h-48" />;
  if (earnings.isError) {
    return <p role="alert" className="ma-alert ma-alert--warning m-0">تعذّر تحميل أرباحك. حدّث الصفحة وحاول مجدداً.</p>;
  }
  const data = earnings.data;
  const b = data.balance;
  const blocked = blockedMessage(data);

  return (
    <section aria-labelledby="earnings-heading" className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="earnings-heading" className="m-0 text-xl font-bold">أرباحك وطلبات الصرف</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ma-btn ma-btn--soft gap-2 text-sm" onClick={() => setDialog("details")}>
            <Pencil aria-hidden="true" className="size-4 fill-none" />
            {data.payout_method ? "تعديل بيانات الدفع" : "إضافة بيانات الدفع"}
          </button>
          <button
            type="button"
            className="ma-btn ma-btn--primary gap-2 text-sm"
            disabled={!data.can_request}
            onClick={() => setDialog("request")}
          >
            <Banknote aria-hidden="true" className="size-4 fill-none" />
            طلب صرف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card
          label="الرصيد المتاح للصرف"
          value={<Money amount={fromMinor(b.available_minor)} />}
          sub={b.minimum_payout_minor > 1 ? `الحد الأدنى للصرف ${fromMinor(b.minimum_payout_minor).toFixed(2)} $` : undefined}
          icon={Wallet}
          tone="green"
        />
        <Card label="قيد طلب صرف" value={<Money amount={fromMinor(b.held_minor)} />} icon={Hourglass} />
        <Card label="بانتظار الاعتماد" value={<Money amount={fromMinor(b.pending_minor)} />} sub="تُعتمد بعد انتهاء فترة الاسترداد" icon={Clock} />
        <Card label="إجمالي ما صُرف لك" value={<Money amount={fromMinor(b.paid_total_minor)} />} icon={CheckCircle2} tone="accent" />
      </div>

      {data.destination ? (
        <p className="m-0 text-sm text-fg-muted">
          تُحوَّل مدفوعاتك عبر <strong className="text-fg">{METHOD_LABEL[data.payout_method ?? ""] ?? data.payout_method}</strong>{" "}
          إلى <bdi dir="ltr">{data.destination}</bdi> · {data.payout_terms}
        </p>
      ) : null}
      {blocked ? <p className="ma-alert ma-alert--warning m-0 text-sm">{blocked}</p> : null}

      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-base font-bold">سجل طلبات الصرف</h3>
        {payouts.data && payouts.data.items.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {payouts.data.items.map((payout) => (
              <PayoutRow key={payout.payout_id} payout={payout} />
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-fg-muted">لم تطلب صرف أي مبلغ بعد.</p>
        )}
      </div>

      {dialog === "request" ? <RequestPayoutDialog data={data} onClose={() => setDialog(null)} /> : null}
      {dialog === "details" ? <DetailsDialog onClose={() => setDialog(null)} /> : null}
    </section>
  );
}
