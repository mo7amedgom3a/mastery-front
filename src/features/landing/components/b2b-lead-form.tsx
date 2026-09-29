"use client";

// clsx, not cn(): no class conflicts to merge here, and it keeps tailwind-merge out of the client bundle.
import { clsx as cn } from "clsx";
import { useActionState, useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { submitB2BLead, type B2BLeadField, type B2BLeadState } from "../actions/submit-b2b-lead";
import { b2bCopy } from "../content/b2b";

const initialState: B2BLeadState = { status: "idle" };

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

/** Kit `.ma-field`: label, control, and an error message wired up via `aria-describedby`. */
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={cn("ma-field", error && "is-error")}>
      <label htmlFor={id} className="ma-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="ma-help m-0">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Works without JS (native form post to the Server Action); enhances to inline errors with JS. */
export function B2BLeadForm() {
  const [state, formAction, pending] = useActionState(submitB2BLead, initialState);
  const baseId = useId();
  const { form } = b2bCopy;

  const errorOf = (name: B2BLeadField) => (state.status === "invalid" ? state.fieldErrors[name] : undefined);
  const idOf = (name: B2BLeadField) => `${baseId}-${name}`;
  /** Shared control attributes; values are echoed back so a failed submit keeps what was typed. */
  const control = (name: B2BLeadField) => ({
    id: idOf(name),
    name,
    "aria-invalid": errorOf(name) ? true : undefined,
    "aria-describedby": errorOf(name) ? `${idOf(name)}-error` : undefined,
    defaultValue: state.values?.[name] ?? "",
    required: true,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={idOf("company")} label="اسم الشركة" error={errorOf("company")}>
          <input {...control("company")} className="ma-input" autoComplete="organization" />
        </Field>
        <Field id={idOf("name")} label="الاسم الكامل" error={errorOf("name")}>
          <input {...control("name")} className="ma-input" autoComplete="name" />
        </Field>
        <Field id={idOf("email")} label="البريد الإلكتروني للعمل" error={errorOf("email")}>
          <input {...control("email")} type="email" dir="ltr" className="ma-input" autoComplete="email" />
        </Field>
        <Field id={idOf("phone")} label="رقم الهاتف" error={errorOf("phone")}>
          <input
            {...control("phone")}
            type="tel"
            dir="ltr"
            inputMode="tel"
            className="ma-input text-end"
            autoComplete="tel"
            placeholder="+966 5x xxx xxxx"
          />
        </Field>
        <Field id={idOf("teamSize")} label="عدد الموظفين المستهدفين" error={errorOf("teamSize")}>
          {/* Re-keyed on the echoed value so the uncontrolled select picks up its new default. */}
          <select key={state.values?.teamSize ?? ""} {...control("teamSize")} className="ma-select">
            <option value="" disabled>
              اختر
            </option>
            {form.teamSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>
        <Field id={idOf("field")} label="مجال التدريب" error={errorOf("field")}>
          <select key={state.values?.field ?? ""} {...control("field")} className="ma-select">
            <option value="" disabled>
              اختر
            </option>
            {form.fields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div aria-live="polite">
        {state.status === "unavailable" ? (
          <p className="ma-alert ma-alert--warning m-0">
            <span className="ma-alert__text">{state.message}</span>
          </p>
        ) : null}
      </div>

      <Button type="submit" variant="primary" size="lg" block disabled={pending} aria-disabled={pending} className={cn(pending && "is-loading")}>
        {form.submit}
      </Button>
    </form>
  );
}
