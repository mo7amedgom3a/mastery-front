"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { companyRanges } from "@/features/business/content/b2b";
import { PhoneInputField } from "@/components/ui/phone-input-field";

import { ChoiceGroup, Reveal } from "../components/choice-group";
import { CountryCityFields } from "../components/country-city-fields";
import { RequestFrame } from "../components/request-frame";
import { TextField } from "../components/text-field";
import { industries } from "../model/options";
import { useRequestStore } from "../model/request-store";

const ranges = companyRanges.map((range) => ({ value: range.value as string, label: range.label }));

/** The company-size choice that holds `size` employees ("51~100" for 60). */
function rangeFor(size: number): string | null {
  const match = companyRanges.find((range) => {
    if (range.value.startsWith("+")) return size > Number(range.value.slice(1));
    const [low, high] = range.value.split("~").map(Number);
    return size >= low && size <= high;
  });
  return match?.value ?? null;
}

export function CompanyStep() {
  const industry = useRequestStore((state) => state.industry);
  const companyRange = useRequestStore((state) => state.companyRange);
  const countryCode = useRequestStore((state) => state.countryCode);
  const contactPhone = useRequestStore((state) => state.contactPhone);
  const errors = useRequestStore((state) => state.errors);
  const update = useRequestStore((state) => state.update);
  const params = useSearchParams();

  // Coming from a "50+ employees, contact us" plan card: start from the team size the company gave.
  useEffect(() => {
    const size = Number(params.get("teamSize"));
    const state = useRequestStore.getState();
    if (!Number.isInteger(size) || size < 1 || state.teamSize) return;
    update({ teamSize: String(size), ...(state.companyRange ? {} : { companyRange: rangeFor(size) }) });
  }, [params, update]);

  return (
    <RequestFrame step="company" title="عرّفنا بشركتك" lead="بيانات أساسية تساعد فريق حلول الشركات على فهم بيئة عملكم.">
      <p className="m-0 text-sm text-fg-muted"><span className="text-pink">*</span> تعني أن الحقل مطلوب.</p>
      <p className="m-0 text-sm text-fg-muted">نحفظ بيانات التواصل وتقدّم الطلب تلقائياً حتى يتمكن فريقنا من المتابعة إذا لم تكتمل الإجابات.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="companyName" label="اسم الشركة" autoComplete="organization" required />
        <TextField name="contactName" label="الاسم الكامل لجهة التواصل" autoComplete="name" required />
        <TextField name="jobTitle" label="المسمّى الوظيفي" autoComplete="organization-title" required />
        <TextField
          name="companyEmail"
          label="البريد الإلكتروني للعمل"
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="name@company.com"
          hint="البريد الرسمي للشركة (لا يُقبل بريد مجاني)"
          required
        />
        <PhoneInputField
          label="رقم الهاتف"
          countryCode={countryCode ?? undefined}
          value={contactPhone}
          error={errors.contactPhone}
          required
          onChange={(value) => update({ contactPhone: value })}
        />
        <TextField name="websiteUrl" label="موقع الشركة" type="url" dir="ltr" placeholder="https://" autoComplete="url" />
      </div>

      <div className="flex flex-col gap-2">
        <ChoiceGroup
          legend="مجال عمل الشركة"
          required
          choices={industries}
          isSelected={(value) => industry === value}
          onToggle={(value) => update({ industry: industry === value ? null : value })}
          error={errors.industry}
        />
        <Reveal show={industry === "other"}>
          <TextField name="industryOther" label="اكتب مجال عمل الشركة" required />
        </Reveal>
      </div>

      <ChoiceGroup
        legend="حجم الشركة"
        required
        choices={ranges}
        isSelected={(value) => companyRange === value}
        onToggle={(value) => update({ companyRange: companyRange === value ? null : value })}
        error={errors.companyRange}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CountryCityFields />
      </div>
    </RequestFrame>
  );
}
