"use client";

// clsx, not cn(): no class conflicts to merge here, and it keeps tailwind-merge out of the client bundle.
import { clsx as cn } from "clsx";
import { useActionState, useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormError } from "@/features/auth/components/field";

import {
  submitTrainerApplication,
  type TrainerApplicationState,
  type TrainerCheckField,
  type TrainerTextField,
} from "../actions/submit-trainer-application";
import { trainerFormCopy as copy, trainerFormOptions as options } from "../content/copy";

const initialState: TrainerApplicationState = { status: "idle" };

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex flex-col gap-5 border-0 border-t border-line p-0 pt-6">
      <legend className="float-start mb-5 w-full p-0 text-lg font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Works without JS (native form post to the Server Action); enhances to inline errors with JS. */
export function TrainerApplicationForm({ specialities }: { specialities: readonly string[] }) {
  const [state, formAction, pending] = useActionState(submitTrainerApplication, initialState);
  const baseId = useId();

  if (state.status === "success") {
    return (
      <div className="ma-alert ma-alert--success" role="status">
        <p className="ma-alert__text">
          <strong>{copy.success.title}.</strong> {copy.success.body}
        </p>
      </div>
    );
  }

  const values = state.values;
  const errors = state.status === "invalid" ? state.fieldErrors : {};
  const idOf = (name: string) => `${baseId}-${name}`;
  /** Shared control attributes; values are echoed back so a failed submit keeps what was typed. */
  const control = (name: TrainerTextField, required = true) => ({
    id: idOf(name),
    name,
    ...describedBy(idOf(name), errors[name]),
    defaultValue: values?.text[name] ?? "",
    required,
  });
  const select = (name: TrainerTextField, items: readonly string[]) => (
    // Re-keyed on the echoed value so the uncontrolled select picks up its new default.
    <select key={values?.text[name] ?? ""} {...control(name)} className="ma-select">
      <option value="" disabled>
        اختر
      </option>
      {items.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
  const check = (name: TrainerCheckField, label: ReactNode) => (
    <label className="ma-check">
      <input type="checkbox" name={name} defaultChecked={values?.checks[name] ?? false} />
      <span>{label}</span>
    </label>
  );
  const specialityOptions = [...new Set([...specialities, options.otherSpeciality])];

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <Group title={copy.sections.personal}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={idOf("title")} label="اللقب" error={errors.title}>
            {select("title", options.titles)}
          </Field>
          <Field id={idOf("name")} label="الاسم الكامل" error={errors.name}>
            <input {...control("name")} className="ma-input" autoComplete="name" />
          </Field>
          <Field id={idOf("email")} label="البريد الإلكتروني" error={errors.email}>
            <input {...control("email")} type="email" dir="ltr" className="ma-input" autoComplete="email" />
          </Field>
          <Field id={idOf("mobile")} label="رقم الجوال" error={errors.mobile}>
            <input
              {...control("mobile")}
              type="tel"
              dir="ltr"
              inputMode="tel"
              className="ma-input text-end"
              autoComplete="tel"
              placeholder="+966 5x xxx xxxx"
            />
          </Field>
          <Field id={idOf("nationality")} label="الجنسية" error={errors.nationality}>
            <input {...control("nationality")} className="ma-input" />
          </Field>
          <Field id={idOf("birthdate")} label="تاريخ الميلاد" error={errors.birthdate}>
            <input {...control("birthdate")} type="date" dir="ltr" className="ma-input text-end" autoComplete="bday" />
          </Field>
          <Field id={idOf("country")} label="دولة الإقامة" error={errors.country}>
            <input {...control("country")} className="ma-input" autoComplete="country-name" />
          </Field>
          <Field id={idOf("city")} label="المدينة" error={errors.city}>
            <input {...control("city")} className="ma-input" autoComplete="address-level2" />
          </Field>
        </div>
      </Group>

      <Group title={copy.sections.experience}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={idOf("educationalLevel")} label="المؤهل العلمي" error={errors.educationalLevel}>
            {select("educationalLevel", options.educationalLevels)}
          </Field>
          <Field id={idOf("major")} label="التخصص الأكاديمي" error={errors.major}>
            <input {...control("major")} className="ma-input" />
          </Field>
          <Field id={idOf("totalYearsOfExperience")} label="سنوات الخبرة" error={errors.totalYearsOfExperience}>
            {select("totalYearsOfExperience", options.experienceYears)}
          </Field>
          <Field id={idOf("scopedExperience")} label="قطاع الخبرة" error={errors.scopedExperience}>
            {select("scopedExperience", options.sectors)}
          </Field>
        </div>
        <div className={cn("ma-field", errors.languages && "is-error")} role="group" aria-labelledby={idOf("languages")}>
          <span id={idOf("languages")} className="ma-label">
            لغات التدريب
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {options.languages.map((language) => (
              <label key={language} className="ma-check">
                <input
                  type="checkbox"
                  name="languages"
                  value={language}
                  defaultChecked={values ? values.languages.includes(language) : language === options.languages[0]}
                />
                <span>{language}</span>
              </label>
            ))}
          </div>
          {errors.languages ? <p className="ma-help m-0">{errors.languages}</p> : null}
        </div>
      </Group>

      <Group title={copy.sections.program}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={idOf("specialized")} label="مجال التخصص" error={errors.specialized}>
            {select("specialized", specialityOptions)}
          </Field>
          <Field id={idOf("programs")} label="عنوان البرنامج المقترح" error={errors.programs}>
            <input {...control("programs")} className="ma-input" />
          </Field>
        </div>
        <Field
          id={idOf("personalProgram")}
          label="نبذة عن البرنامج"
          error={errors.personalProgram}
          hint="الفئة المستهدفة، المحاور الرئيسية، وما سيكتسبه المتعلّم."
        >
          <textarea
            {...control("personalProgram")}
            {...describedBy(idOf("personalProgram"), errors.personalProgram, "hint")}
            rows={5}
            className="ma-input"
          />
        </Field>
        <Field id={idOf("additionalServices")} label="خدمات إضافية تقدّمها (اختياري)" error={errors.additionalServices}>
          <textarea {...control("additionalServices", false)} rows={3} className="ma-input" />
        </Field>
      </Group>

      <Group title={copy.sections.presence}>
        <p className="m-0 text-fg-muted">حدّد المنصات التي لديك حضور عليها، وأضف الرابط إن وُجد.</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {(
            [
              ["youtube", "يوتيوب", "youtubechannel"],
              ["instagram", "إنستغرام", "instagramprofile"],
              ["facebook", "فيسبوك", "facebookpage"],
            ] as const
          ).map(([name, label, linkField]) => (
            <div key={name} className="flex flex-col gap-3">
              {check(name, `لدي حساب على ${label}`)}
              <Field id={idOf(linkField)} label={`رابط ${label} (اختياري)`} error={errors[linkField]}>
                <input {...control(linkField, false)} type="url" dir="ltr" className="ma-input" placeholder="https://" />
              </Field>
            </div>
          ))}
        </div>
      </Group>

      <Group title={copy.sections.options}>
        <Field
          id={idOf("cvUrl")}
          label="رابط السيرة الذاتية (اختياري)"
          error={errors.cvUrl}
          hint="رابط Google Drive أو LinkedIn أو أي رابط عام لسيرتك الذاتية."
        >
          <input
            {...control("cvUrl", false)}
            {...describedBy(idOf("cvUrl"), errors.cvUrl, "hint")}
            type="url"
            dir="ltr"
            className="ma-input"
            placeholder="https://"
          />
        </Field>
        {check("recorded", "سبق لي تسجيل دورات تدريبية مصوّرة")}
        <div className="flex flex-col gap-2">
          {check("consultancy", "أرغب في تقديم الاستشارات أيضاً")}
          <p className="ma-help m-0 ps-8">نعرض ملفك كمستشار على المنصة ويحجز معك العملاء جلسات استشارية مدفوعة.</p>
        </div>
      </Group>

      <div aria-live="polite">
        <FormError message={state.status === "error" ? state.message : null} />
        {state.status === "invalid" ? (
          <p className="ma-alert ma-alert--danger m-0" role="alert">
            <span className="ma-alert__text">راجع الحقول المظلّلة ثم أعد الإرسال.</span>
          </p>
        ) : null}
      </div>

      <Button type="submit" variant="primary" size="lg" block disabled={pending} aria-disabled={pending} className={cn(pending && "is-loading")}>
        {copy.submit}
      </Button>
    </form>
  );
}
