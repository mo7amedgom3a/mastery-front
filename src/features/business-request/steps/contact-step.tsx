"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { routes } from "@/config/routes";
import { PhoneInputField } from "@/components/ui/phone-input-field";
import { b2bFormCopy } from "@/features/business/content/b2b";

import { submitCompanyRequest } from "../actions/submit-request";
import { RequestFrame } from "../components/request-frame";
import { TextField } from "../components/text-field";
import { answersOf, useRequestStore } from "../model/request-store";
import { firstStepWith } from "../model/schema";

/** Who to contact, then sends the whole request. */
export function ContactStep() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const countryCode = useRequestStore((state) => state.countryCode);
  const contactPhone = useRequestStore((state) => state.contactPhone);
  const phoneError = useRequestStore((state) => state.errors.contactPhone);
  const update = useRequestStore((state) => state.update);

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const store = useRequestStore.getState();
      const result = await submitCompanyRequest(answersOf(store));
      if (result.status === "success") {
        router.push(routes.businessRequestDone);
        store.reset();
        return;
      }
      if (result.status === "invalid") {
        store.setErrors(result.errors);
        const step = firstStepWith(result.errors);
        if (step && step !== "contact") {
          store.setDirection(-1);
          router.push(routes.businessRequest(step));
        }
        return;
      }
      setError(result.message);
    });

  return (
    <RequestFrame
      step="contact"
      title="مع من نتواصل؟"
      lead="سيتواصل معك فريق حلول الشركات خلال يومي عمل."
      onNext={submit}
      nextLabel={b2bFormCopy.submit}
      pending={pending}
      error={error}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="contactName" label="الاسم الكامل" autoComplete="name" />
        <TextField name="jobTitle" label="المسمّى الوظيفي" autoComplete="organization-title" />
        <TextField
          name="companyEmail"
          label="البريد الإلكتروني للعمل"
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="name@company.com"
          hint="البريد الرسمي للشركة (لا يُقبل بريد مجاني)"
        />
        <PhoneInputField
          label="رقم الهاتف"
          countryCode={countryCode ?? undefined}
          value={contactPhone}
          error={phoneError}
          onChange={(val) => update({ contactPhone: val })}
        />
      </div>
    </RequestFrame>
  );
}
