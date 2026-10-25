"use client";

import { useId } from "react";

import { describedBy, Field } from "@/features/auth/components/field";
import { TrainerCountryCityFields } from "@/features/trainers/components/trainer-country-city-fields";

import { ApplyFrame } from "../components/apply-frame";
import { useApplyStore } from "../model/apply-store";

export function AddressStep() {
  const id = useId();
  const { country, city, address, poBox, postalCode, errors, update } = useApplyStore();
  return (
    <ApplyFrame step="address" title="أين تقيم؟" lead="نحتاج العنوان لإتمام اتفاقية الشراكة وتحويل العمولات.">
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TrainerCountryCityFields
            baseId={`${id}-loc`}
            defaultCountry={country}
            defaultCity={city}
            countryError={errors.country}
            cityError={errors.city}
            onCountryChange={(name, code) => update({ country: name, countryCode: code })}
            onCityChange={(value) => update({ city: value })}
          />
        </div>
        <Field id={`${id}-address`} label="العنوان التفصيلي (الشارع والحي)" error={errors.address} required>
          <input
            id={`${id}-address`}
            autoComplete="street-address"
            value={address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="مثال: حي العليا، طريق الملك فهد"
            {...describedBy(`${id}-address`, errors.address)}
            className="ma-input"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${id}-po`} label="صندوق البريد (اختياري)">
            <input id={`${id}-po`} value={poBox} maxLength={20} onChange={(e) => update({ poBox: e.target.value })} placeholder="مثال: 12345" className="ma-input" />
          </Field>
          <Field id={`${id}-postal`} label="الرمز البريدي (اختياري)">
            <input id={`${id}-postal`} value={postalCode} maxLength={20} autoComplete="postal-code" onChange={(e) => update({ postalCode: e.target.value })} placeholder="مثال: 11564" className="ma-input" />
          </Field>
        </div>
      </div>
    </ApplyFrame>
  );
}
