"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { describedBy, Field, FormError } from "@/features/auth/components/field";
import { ApiError } from "@/lib/api/client";
import { referralKeys, savePayoutDetails, type PayoutDetails, type PayoutMethod } from "@/lib/api/referrals";
import { cn } from "@/lib/cn";

const METHODS: { value: PayoutMethod; label: string; hint: string }[] = [
  { value: "paypal", label: "PayPal", hint: "نحوّل إلى بريد حساب PayPal." },
  { value: "bank_transfer", label: "تحويل بنكي", hint: "نحوّل إلى حسابك البنكي عبر IBAN." },
  { value: "wise", label: "Wise", hint: "نحوّل عبر Wise إلى بريدك أو IBAN." },
  { value: "other", label: "طريقة أخرى", hint: "اكتب لنا كيف نحوّل لك المبلغ." },
];

const EMPTY: PayoutDetails = { method: "paypal" };

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError && error.status === 422) {
    const detail = typeof error.details.detail === "string" ? error.details.detail : null;
    return detail ? `تحقّق من البيانات: ${detail}` : "تحقّق من البيانات المدخلة.";
  }
  return "تعذّر حفظ بيانات الدفع. حاول مجدداً.";
}

/** Where the marketer is paid. Saved encrypted; a payout keeps the details it was requested with. */
export function PayoutDetailsForm({ initial, onSaved }: { initial: PayoutDetails | null; onSaved: () => void }) {
  const baseId = useId();
  const queryClient = useQueryClient();
  const [details, setDetails] = useState<PayoutDetails>(initial ?? EMPTY);
  const set = (key: keyof PayoutDetails) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDetails((prev) => ({ ...prev, [key]: event.target.value }));
  const save = useMutation({
    mutationFn: () => savePayoutDetails(details),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: referralKeys.all });
      onSaved();
    },
  });

  const id = (name: string) => `${baseId}-${name}`;
  const text = (name: keyof PayoutDetails, label: string, opts: { required?: boolean; ltr?: boolean; type?: string; hint?: string } = {}) => (
    <Field id={id(name)} label={label} required={opts.required} hint={opts.hint}>
      <input
        id={id(name)}
        type={opts.type ?? "text"}
        dir={opts.ltr ? "ltr" : undefined}
        required={opts.required}
        value={(details[name] as string | null | undefined) ?? ""}
        onChange={set(name)}
        {...describedBy(id(name), undefined, opts.hint)}
        className="ma-input"
      />
    </Field>
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="ma-label mb-2">طريقة استلام العمولة</legend>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((method) => (
            <label
              key={method.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-panel border p-3 text-sm transition-colors",
                details.method === method.value ? "border-accent bg-accent/5" : "border-line",
              )}
            >
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="radio"
                  name={id("method")}
                  value={method.value}
                  checked={details.method === method.value}
                  onChange={() => setDetails((prev) => ({ ...prev, method: method.value }))}
                />
                {method.label}
              </span>
              <span className="text-xs text-fg-muted">{method.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {details.method === "paypal" ? text("email", "بريد حساب PayPal", { required: true, ltr: true, type: "email" }) : null}
      {details.method === "bank_transfer" ? (
        <>
          {text("account_name", "اسم صاحب الحساب", { required: true })}
          {text("iban", "رقم الآيبان (IBAN)", { required: true, ltr: true, hint: "مثال: SA03 8000 0000 6080 1016 7519" })}
          {text("bank_name", "اسم البنك", { required: true })}
          {text("swift", "رمز SWIFT (اختياري)", { ltr: true })}
          {text("country", "دولة البنك (اختياري)")}
        </>
      ) : null}
      {details.method === "wise" ? (
        <>
          {text("email", "بريد حساب Wise", { ltr: true, type: "email", hint: "أدخل البريد أو الآيبان." })}
          {text("iban", "أو رقم الآيبان (IBAN)", { ltr: true })}
          {text("account_name", "اسم صاحب الحساب (اختياري)")}
        </>
      ) : null}
      {details.method === "other" ? (
        <Field id={id("instructions")} label="كيف نحوّل لك المبلغ؟" required>
          <textarea
            id={id("instructions")}
            required
            rows={3}
            maxLength={1000}
            value={details.instructions ?? ""}
            onChange={set("instructions")}
            className="ma-input"
          />
        </Field>
      ) : null}

      <FormError message={errorMessage(save.error)} />
      <button type="submit" className="ma-btn ma-btn--primary self-start" disabled={save.isPending}>
        {save.isPending ? "جارٍ الحفظ…" : "حفظ بيانات الدفع"}
      </button>
    </form>
  );
}
