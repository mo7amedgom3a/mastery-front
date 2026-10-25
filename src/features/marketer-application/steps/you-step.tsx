"use client";

import { useId } from "react";

import { PhoneInputField } from "@/components/ui/phone-input-field";
import { describedBy, Field } from "@/features/auth/components/field";

import { ApplyFrame } from "../components/apply-frame";
import { useApplyStore } from "../model/apply-store";

const EMAIL_HINT = "نرسل عليه قرار الطلب، وتدخل به لاحقًا إلى لوحة المسوّق";

export function YouStep() {
  const id = useId();
  const { fullName, email, phone, errors, update } = useApplyStore();
  return (
    <ApplyFrame step="you" title="لنبدأ ببياناتك" lead="يستغرق الطلب دقائق قليلة، ونراجعه خلال 48 ساعة.">
      <div className="flex flex-col gap-5">
        <Field id={`${id}-name`} label="الاسم الثلاثي" error={errors.fullName} required>
          <input
            id={`${id}-name`}
            autoComplete="name"
            value={fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="مثال: محمد أحمد العتيبي"
            {...describedBy(`${id}-name`, errors.fullName)}
            className="ma-input"
          />
        </Field>
        <Field id={`${id}-email`} label="البريد الإلكتروني" error={errors.email} hint={EMAIL_HINT} required>
          <input
            id={`${id}-email`}
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="name@example.com"
            {...describedBy(`${id}-email`, errors.email, EMAIL_HINT)}
            className="ma-input"
          />
        </Field>
        <PhoneInputField
          id={`${id}-phone`}
          label="رقم الجوال (مع مفتاح الدولة)"
          value={phone}
          onChange={(value) => update({ phone: value })}
          error={errors.phone}
          required
        />
      </div>
    </ApplyFrame>
  );
}
