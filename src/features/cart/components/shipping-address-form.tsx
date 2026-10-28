"use client";

import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { useId } from "react";

import { CountrySearchSelect } from "@/components/ui/country-search-select";
import { describedBy, Field } from "@/features/auth/components/field";
import { locationQueries } from "@/features/business-request/api/locations";
import type { ShippingAddress } from "@/lib/api/commerce";

export type ShippingDraft = {
  full_name: string;
  phone: string;
  country_code: string;
  city: string;
  district: string;
  street: string;
  building: string;
  postal_code: string;
};

export const EMPTY_SHIPPING: ShippingDraft = {
  full_name: "",
  phone: "",
  country_code: "",
  city: "",
  district: "",
  street: "",
  building: "",
  postal_code: "",
};

/** What checkout sends, or null while a required field is missing or too short. */
export function shippingAddress(draft: ShippingDraft): ShippingAddress | null {
  const value = (text: string) => text.trim();
  const ok =
    value(draft.full_name).length >= 2 &&
    /^\+?[0-9\s-]{7,32}$/.test(value(draft.phone)) &&
    /^[A-Z]{2}$/.test(draft.country_code) &&
    value(draft.city).length >= 2 &&
    value(draft.street).length >= 2;
  if (!ok) return null;
  return {
    full_name: value(draft.full_name),
    phone: value(draft.phone),
    country_code: draft.country_code,
    city: value(draft.city),
    district: value(draft.district) || null,
    street: value(draft.street),
    building: value(draft.building) || null,
    postal_code: value(draft.postal_code) || null,
  };
}

/** Where the printed certificate is shipped; asked for only when a printed copy is in the cart. */
export function ShippingAddressForm({
  value,
  onChange,
  disabled,
}: {
  value: ShippingDraft;
  onChange: (next: ShippingDraft) => void;
  disabled: boolean;
}) {
  const countries = useQuery(locationQueries.countries());
  const set = (patch: Partial<ShippingDraft>) => onChange({ ...value, ...patch });
  const complete = shippingAddress(value) !== null;

  return (
    <section aria-labelledby="shipping-title" className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5">
      <div className="flex items-start gap-3">
        <Truck aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent" />
        <div>
          <h2 id="shipping-title" className="m-0 text-lg font-bold">
            عنوان شحن الشهادة المطبوعة
          </h2>
          <p className="m-0 text-sm leading-6 text-fg-muted">
            نطبع شهادتك ونشحنها بعد إتمامك البرنامج، وتتابع حالة الشحن من «شهاداتي». يمكنك تعديل العنوان قبل الطباعة.
          </p>
        </div>
      </div>
      <fieldset disabled={disabled} className="m-0 grid gap-4 border-0 p-0 sm:grid-cols-2">
        <Text label="الاسم الكامل للمستلم" value={value.full_name} onChange={(full_name) => set({ full_name })} required autoComplete="name" />
        <Text label="رقم الجوال" value={value.phone} onChange={(phone) => set({ phone })} required autoComplete="tel" dir="ltr" inputMode="tel" />
        <CountrySearchSelect
          label="الدولة"
          required
          valueKey="code"
          value={value.country_code}
          countries={countries.data ?? []}
          disabled={disabled || countries.isPending}
          onChange={(country) => set({ country_code: country.code })}
        />
        <Text label="المدينة" value={value.city} onChange={(city) => set({ city })} required autoComplete="address-level2" />
        <Text label="الحي (اختياري)" value={value.district} onChange={(district) => set({ district })} autoComplete="address-level3" />
        <Text label="الشارع" value={value.street} onChange={(street) => set({ street })} required autoComplete="address-line1" />
        <Text label="المبنى / الشقة (اختياري)" value={value.building} onChange={(building) => set({ building })} autoComplete="address-line2" />
        <Text label="الرمز البريدي (اختياري)" value={value.postal_code} onChange={(postal_code) => set({ postal_code })} autoComplete="postal-code" dir="ltr" />
      </fieldset>
      {!complete ? (
        <p role="note" className="m-0 border-s-4 border-accent ps-3 text-sm leading-6">
          أكمل حقول العنوان المطلوبة لإتمام الدفع.
        </p>
      ) : null}
    </section>
  );
}

function Text({
  label,
  value,
  onChange,
  required,
  ...input
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <Field id={id} label={label} required={required}>
      <input
        {...input}
        id={id}
        className="ma-input"
        value={value}
        required={required}
        maxLength={200}
        onChange={(event) => onChange(event.target.value)}
        {...describedBy(id)}
      />
    </Field>
  );
}
