"use client";

// clsx, not cn(): no class conflicts to merge here, and it keeps tailwind-merge out of the client bundle.
import { clsx as cn } from "clsx";
import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormError } from "@/features/auth/components/field";

import { submitB2BLead, type B2BLeadField, type B2BLeadState } from "../actions/submit-b2b-lead";
import { b2bFormCopy, companyRanges } from "../content/b2b";

const initialState: B2BLeadState = { status: "idle" };

/** Works without JS (native form post to the Server Action); enhances to inline errors with JS. */
export function B2BLeadForm() {
  const [state, formAction, pending] = useActionState(submitB2BLead, initialState);
  const baseId = useId();

  if (state.status === "success") {
    return (
      <div className="ma-alert ma-alert--success" role="status">
        <p className="ma-alert__text">
          <strong>{b2bFormCopy.success.title}.</strong> {b2bFormCopy.success.body}
        </p>
      </div>
    );
  }

  const values = state.values;
  const errorOf = (name: B2BLeadField) => (state.status === "invalid" ? state.fieldErrors[name] : undefined);
  const idOf = (name: B2BLeadField) => `${baseId}-${name}`;
  /** Shared control attributes; values are echoed back so a failed submit keeps what was typed. */
  const control = (name: B2BLeadField) => ({
    id: idOf(name),
    name,
    ...describedBy(idOf(name), errorOf(name)),
    defaultValue: values?.[name] ?? "",
    required: true,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={idOf("companyName")} label="اسم الشركة" error={errorOf("companyName")}>
          <input {...control("companyName")} className="ma-input" autoComplete="organization" />
        </Field>
        <Field id={idOf("companyRange")} label="حجم الشركة" error={errorOf("companyRange")}>
          {/* Re-keyed on the echoed value so the uncontrolled select picks up its new default. */}
          <select key={values?.companyRange ?? ""} {...control("companyRange")} className="ma-select">
            <option value="" disabled>
              اختر
            </option>
            {companyRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={idOf("contactName")} label="الاسم الكامل" error={errorOf("contactName")}>
          <input {...control("contactName")} className="ma-input" autoComplete="name" />
        </Field>
        <Field id={idOf("jobTitle")} label="المسمّى الوظيفي" error={errorOf("jobTitle")}>
          <input {...control("jobTitle")} className="ma-input" autoComplete="organization-title" />
        </Field>
        <Field id={idOf("companyEmail")} label="البريد الإلكتروني للعمل" error={errorOf("companyEmail")}>
          <input {...control("companyEmail")} type="email" dir="ltr" className="ma-input" autoComplete="email" />
        </Field>
        <Field id={idOf("contactPhone")} label="رقم الهاتف" error={errorOf("contactPhone")}>
          <input
            {...control("contactPhone")}
            type="tel"
            dir="ltr"
            inputMode="tel"
            className="ma-input text-end"
            autoComplete="tel"
            placeholder="+966 5x xxx xxxx"
          />
        </Field>
        <Field id={idOf("country")} label="الدولة" error={errorOf("country")}>
          <input {...control("country")} className="ma-input" autoComplete="country-name" />
        </Field>
        <Field id={idOf("city")} label="المدينة" error={errorOf("city")}>
          <input {...control("city")} className="ma-input" autoComplete="address-level2" />
        </Field>
      </div>

      <div aria-live="polite">
        <FormError message={state.status === "error" ? state.message : null} />
      </div>

      <Button type="submit" variant="primary" size="lg" block disabled={pending} aria-disabled={pending} className={cn(pending && "is-loading")}>
        {b2bFormCopy.submit}
      </Button>
    </form>
  );
}
