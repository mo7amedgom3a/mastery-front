"use client";

import { useId, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Money } from "@/components/shop/money";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { describedBy, Field, FormError } from "@/features/auth/components/field";
import { refreshNotifications } from "@/features/notifications/use-notifications";
import { productTypeLabel } from "@/features/student-dashboard/model/products";
import { ApiError } from "@/lib/api/client";
import type { OrderDetailResponse, OrderLineResponse } from "@/lib/api/commerce";
import { refundKeys, refundQueries, requestRefund, type RefundCase, type RefundPreview } from "@/lib/api/refunds";
import type { ResolvedItem } from "@/lib/shop/contract";
import { formatDate, fromMinor } from "@/lib/format";

import { refundCaseStatus, refundReason } from "../model/status";
import { StatusTag } from "./status-tag";

/** Order states in which a line can still be asked about; a fully refunded order only shows its history. */
const REQUESTABLE = new Set(["paid", "partially_refunded"]);
const MIN_REASON = 10;

type Artwork = ReadonlyMap<string, ResolvedItem>;

function lineTitle(line: OrderLineResponse, artwork?: Artwork): string {
  const known = line.slug ? artwork?.get(line.slug) : undefined;
  return known?.title ?? line.title ?? line.slug ?? "منتج";
}

function RequestForm({ orderId, line, preview, onDone }: { orderId: string; line: OrderLineResponse; preview: RefundPreview; onDone: () => void }) {
  const client = useQueryClient();
  const id = useId();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const max = fromMinor(preview.remaining_minor);
  const amountMinor = amount === "" ? preview.remaining_minor : Math.round(Number(amount) * 100);
  const amountError = amount !== "" && (!(amountMinor > 0) || amountMinor > preview.remaining_minor) ? `أدخل مبلغًا بين 0.01 و ${max}.` : undefined;
  const reasonError = touched && reason.trim().length < MIN_REASON ? `اكتب ${MIN_REASON} أحرف على الأقل.` : undefined;
  const request = useMutation({
    mutationFn: () => requestRefund(orderId, line.order_item_id, amountMinor, reason.trim()),
    onSuccess: async () => {
      setReason("");
      setAmount("");
      onDone();
      await Promise.all([client.invalidateQueries({ queryKey: refundKeys.all }), refreshNotifications()]);
    },
  });
  const submitError = request.error
    ? request.error instanceof ApiError && request.error.status === 409
      ? "لم يعد هذا المنتج مؤهلًا للاسترداد، أو لديك طلب قيد المراجعة. حدّث الصفحة لمعرفة السبب."
      : "تعذّر إرسال الطلب. تحقّق من اتصالك ثم حاول مجددًا."
    : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (amountError || reason.trim().length < MIN_REASON) return;
    request.mutate();
  }

  const amountId = `${id}-amount`;
  const reasonId = `${id}-reason`;
  const amountHint = `اتركه فارغًا لاسترداد كامل المبلغ المتاح (${max} ${preview.currency_code}).`;
  const reasonHint = "سيقرأ فريقنا السبب قبل اتخاذ القرار.";
  return (
    <form className="flex flex-col gap-4 border-t border-line pt-4" onSubmit={submit} noValidate>
      <Field id={amountId} label={`المبلغ (${preview.currency_code})`} error={amountError} hint={amountHint}>
        <input
          id={amountId}
          className="ma-input"
          type="number"
          inputMode="decimal"
          dir="ltr"
          min="0.01"
          max={max}
          step="0.01"
          placeholder={String(max)}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          {...describedBy(amountId, amountError, amountHint)}
        />
      </Field>
      <Field id={reasonId} label="سبب الطلب" error={reasonError} hint={reasonHint}>
        <textarea
          id={reasonId}
          className="ma-input min-h-28"
          required
          minLength={MIN_REASON}
          maxLength={2000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => setTouched(true)}
          {...describedBy(reasonId, reasonError, reasonHint)}
        />
      </Field>
      <FormError message={submitError} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="primary" disabled={request.isPending} aria-busy={request.isPending}>
          {request.isPending ? "جارٍ الإرسال…" : "إرسال للمراجعة"}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={request.isPending}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

function RequestItem({ orderId, line, artwork }: { orderId: string; line: OrderLineResponse; artwork?: Artwork }) {
  const preview = useQuery(refundQueries.preview(orderId, line.order_item_id));
  const [open, setOpen] = useState(false);
  const p = preview.data;
  return (
    <li className="flex flex-col gap-3 rounded-panel border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span className="ma-tag ma-tag--soft">{line.product_type ? productTypeLabel(line.product_type) : "منتج"}</span>
          <span className="font-bold">{lineTitle(line, artwork)}</span>
          {p?.eligible ? (
            <span className="text-sm text-fg-muted">
              المبلغ القابل للاسترداد: <Money amount={fromMinor(p.remaining_minor)} currency={p.currency_code} className="font-bold text-fg" />
            </span>
          ) : null}
        </div>
        {p?.eligible && !open ? (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            طلب استرداد
          </Button>
        ) : null}
      </div>
      {preview.isPending ? (
        <div role="status">
          <span className="sr-only">جارٍ التحقق من أهلية الاسترداد…</span>
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : null}
      {preview.isError ? (
        <p className="m-0 text-sm text-fg-muted">تعذّر التحقق من أهلية الاسترداد حاليًا. حاول لاحقًا أو تواصل مع الدعم.</p>
      ) : null}
      {p && !p.eligible ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-fg-muted">
          {[...new Set(p.reasons.map(refundReason))].map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      ) : null}
      {open && p?.eligible ? <RequestForm orderId={orderId} line={line} preview={p} onDone={() => setOpen(false)} /> : null}
    </li>
  );
}

function CaseHistory({ cases, lines, artwork }: { cases: RefundCase[]; lines: OrderLineResponse[]; artwork?: Artwork }) {
  const titles = new Map(lines.map((line) => [line.order_item_id, lineTitle(line, artwork)]));
  return (
    <div className="flex flex-col gap-3">
      <h3 className="m-0 text-lg font-bold">طلباتك</h3>
      <ul className="m-0 flex list-none flex-col divide-y divide-line rounded-panel border border-line p-0">
        {cases.map((item) => (
          <li key={item.case_id} className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">{titles.get(item.order_item_id) ?? item.slug}</span>
              <StatusTag status={refundCaseStatus(item.status)} />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-fg-muted">
              <span>{formatDate(item.created_at)}</span>
              <Money amount={fromMinor(item.approved_minor ?? item.requested_minor)} currency={item.currency_code} className="font-bold text-fg" />
            </div>
            <p className="m-0 text-sm">{item.customer_reason}</p>
            {item.decision_reason ? (
              <div className="ma-alert ma-alert--warning">
                <div>
                  <p className="ma-alert__title">ملاحظة الفريق</p>
                  <p className="ma-alert__text">{item.decision_reason}</p>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Refund requests for a paid order: per-line eligibility, the request form, and the customer's case history. */
export function RefundRequests({ order, artwork }: { order: OrderDetailResponse; artwork?: Artwork }) {
  const lines = order.lines ?? [];
  const requestable = REQUESTABLE.has(order.status);
  const visible = lines.length > 0 && (requestable || order.status === "refunded");
  const cases = useQuery({
    ...refundQueries.cases(),
    enabled: visible,
    select: (items) => items.filter((item) => item.order_id === order.order_id),
  });
  if (!visible) return null;
  const mine = cases.data ?? [];
  return (
    <section aria-labelledby="refund-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="refund-title" className="m-0 text-xl font-bold">
          الاسترداد
        </h2>
        <p className="m-0 text-sm text-fg-muted">
          يمكنك طلب الاسترداد خلال 30 يومًا من الشراء ما دمت لم تبدأ التعلم. يراجع فريقنا كل طلب ونبلغك بالقرار بالبريد وفي الإشعارات.
        </p>
      </div>
      {requestable ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {lines.map((line) => (
            <RequestItem key={line.order_item_id} orderId={order.order_id} line={line} artwork={artwork} />
          ))}
        </ul>
      ) : null}
      {mine.length ? <CaseHistory cases={mine} lines={lines} artwork={artwork} /> : null}
    </section>
  );
}
