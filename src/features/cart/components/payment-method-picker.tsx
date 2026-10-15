"use client";

import { Info } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

import { cn } from "@/lib/cn";
import type { TamaraOptionsResponse } from "@/lib/api/commerce";
import type { PaymentMethodId } from "@/lib/shop/contract";

import { PAYMENT_METHODS, type PaymentMark } from "../model/payment-methods";
import { TamaraLogo } from "./tamara-widget";

/** UAE mobile without the country code: 5, then a valid operator digit, then 7 digits. */
export const UAE_MOBILE_PATTERN = /^5[0234568]\d{7}$/;

/** A profile phone as a UAE mobile (`0501234567`, `+971 50 123 4567`, …), or "" when it isn't one. */
export function uaeMobileFrom(phone: string | null | undefined): string {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00971")) digits = digits.slice(5);
  else if (digits.startsWith("971")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return UAE_MOBILE_PATTERN.test(digits) ? digits : "";
}

export type TamaraState =
  | { status: "loading" }
  | { status: "ready"; options: TamaraOptionsResponse }
  | { status: "error" };

/** Why Tamara can't take this order, ready to show; null when it can. */
export function tamaraUnavailableReason(tamara: TamaraState): string | null {
  if (tamara.status === "loading") return null;
  if (tamara.status === "error") return "تمارا غير متاحة حالياً. حاول لاحقاً أو ادفع بالبطاقة.";
  const { options } = tamara;
  if (options.available) return null;
  if (options.reason === "amount_out_of_range") {
    const limits = options.payment_types?.[0];
    return limits
      ? `متاحة للطلبات من ${limits.min_amount} إلى ${limits.max_amount} ${limits.currency}.`
      : "قيمة الطلب خارج الحدود التي تقبلها تمارا.";
  }
  return "تمارا غير متاحة حالياً لهذا الطلب.";
}

type PaymentMethodPickerProps = {
  method: PaymentMethodId;
  onMethodChange: (method: PaymentMethodId) => void;
  tamara: TamaraState;
  phone: string;
  onPhoneChange: (phone: string) => void;
  /** Shown once the visitor tried to pay with an invalid number. */
  phoneError: string | null;
  disabled: boolean;
};

/** The two ways to pay: card (Stripe) or Tamara instalments, for customers in the UAE. */
export function PaymentMethodPicker({
  method,
  onMethodChange,
  tamara,
  phone,
  onPhoneChange,
  phoneError,
  disabled,
}: PaymentMethodPickerProps) {
  const name = useId();
  const tamaraReason = tamaraUnavailableReason(tamara);

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0" disabled={disabled}>
      <legend className="mb-3 p-0 text-base font-bold">طريقة الدفع</legend>
      {PAYMENT_METHODS.map((def) => {
        const isTamara = def.id === "tamara";
        const unavailable = isTamara && (tamaraReason !== null || tamara.status === "loading");
        const selected = method === def.id;
        return (
          <div
            key={def.id}
            className={cn(
              "flex flex-col gap-3 rounded-panel border p-4 transition-colors",
              selected ? "border-accent" : "border-line",
              unavailable && "opacity-60",
            )}
          >
            {/* Guidelines §2.3: the provider label, a short reassurance and the gradient logo. */}
            <div className="flex items-start gap-3">
              <input
                id={`${name}-${def.id}`}
                type="radio"
                name={name}
                value={def.id}
                checked={selected}
                disabled={unavailable}
                onChange={() => onMethodChange(def.id)}
                aria-describedby={`${name}-${def.id}-text`}
                className="mt-1.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <span className="flex items-center gap-1">
                    <label htmlFor={`${name}-${def.id}`} className="cursor-pointer font-bold">
                      {def.label}
                    </label>
                    {isTamara ? <UaeOnlyInfo /> : null}
                  </span>
                  {isTamara ? <TamaraLogo /> : <Marks marks={def.marks} />}
                </div>
                <p id={`${name}-${def.id}-text`} className="m-0 text-sm leading-6 text-fg-muted">
                  {isTamara && tamaraReason ? tamaraReason : def.description}
                </p>
              </div>
            </div>

            {isTamara && selected && tamara.status === "ready" && tamara.options.available ? (
              <TamaraDetails options={tamara.options} phone={phone} onPhoneChange={onPhoneChange} phoneError={phoneError} />
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}

function Marks({ marks }: { marks: readonly PaymentMark[] }) {
  return (
    <ul className="m-0 flex shrink-0 list-none items-center gap-1.5 p-0" aria-label="الشبكات المقبولة">
      {marks.map((mark) => (
        <li key={mark.src} className="relative h-7 w-11 overflow-hidden rounded-sm border border-line bg-white">
          <Image src={mark.src} alt={mark.name} fill sizes="44px" unoptimized className={cn("p-0.5", mark.fit)} />
        </li>
      ))}
    </ul>
  );
}

/** The "UAE only" note behind an info button (a disclosure: it works with touch and keyboards alike). */
function UaeOnlyInfo() {
  const [open, setOpen] = useState(false);
  const noteId = useId();
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={noteId}
        aria-label="عن الدفع عبر تمارا"
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="grid size-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-fg-muted hover:text-fg"
      >
        <Info aria-hidden="true" className="size-5 fill-none" />
      </button>
      <p
        id={noteId}
        role="note"
        hidden={!open}
        className="absolute start-0 top-full z-10 m-0 mt-2 w-64 rounded-panel border border-line-strong bg-surface p-3 text-sm leading-6 shadow-lg"
      >
        الدفع بالتقسيط عبر تمارا متاح حالياً للعملاء في الإمارات العربية المتحدة فقط، برقم جوال إماراتي، ويتم الدفع بالدرهم
        الإماراتي (AED).
      </p>
    </div>
  );
}

function TamaraDetails({
  options,
  phone,
  onPhoneChange,
  phoneError,
}: {
  options: TamaraOptionsResponse;
  phone: string;
  onPhoneChange: (phone: string) => void;
  phoneError: string | null;
}) {
  const inputId = useId();
  return (
    <div className="flex flex-col gap-4 ps-7">
      <p className="m-0 text-sm leading-6 text-fg-muted">
        يُدفع الطلب بالدرهم الإماراتي:{" "}
        <bdi dir="ltr" className="font-bold text-fg">
          {options.currency_code} {options.amount.toFixed(2)}
        </bdi>
      </p>
      <div className={cn("ma-field", phoneError && "is-error")}>
        <label htmlFor={inputId} className="ma-label">
          رقم الجوال الإماراتي
        </label>
        <div dir="ltr" className="flex items-stretch">
          <span className="grid place-items-center rounded-s-sm border border-e-0 border-line-strong bg-surface-alt px-3 text-sm font-bold">
            +971
          </span>
          <input
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="5XXXXXXXX"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, "").replace(/^0/, ""))}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={`${inputId}-help`}
            className="ma-input min-w-0 flex-1 rounded-s-none"
          />
        </div>
        <p id={`${inputId}-help`} className="ma-help m-0">
          {phoneError ?? "سيُرسَل رمز التحقق من تمارا إلى هذا الرقم."}
        </p>
      </div>
    </div>
  );
}
