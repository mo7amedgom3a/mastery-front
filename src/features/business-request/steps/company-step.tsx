"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { companyRanges } from "@/features/business/content/b2b";

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
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="companyName" label="اسم الشركة" autoComplete="organization" />
        <TextField name="websiteUrl" label="موقع الشركة" type="url" dir="ltr" placeholder="https://" autoComplete="url" />
      </div>

      <div className="flex flex-col gap-2">
        <ChoiceGroup
          legend="مجال عمل الشركة"
          choices={industries}
          isSelected={(value) => industry === value}
          onToggle={(value) => update({ industry: industry === value ? null : value })}
          error={errors.industry}
        />
        <Reveal show={industry === "other"}>
          <TextField name="industryOther" label="اكتب مجال عمل الشركة" />
        </Reveal>
      </div>

      <ChoiceGroup
        legend="حجم الشركة"
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
