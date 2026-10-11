"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormError } from "@/features/auth/components/field";
import { setAccountProfile } from "@/lib/account/use-account-profile";
import {
  customerKeys,
  updateMe,
  type CustomerProfileResponse,
  type CustomerProfileUpdateRequest,
} from "@/lib/api/customers";
import { cn } from "@/lib/cn";

const PHONE_PATTERN = /^\+?[0-9\s-]{6,20}$/;

/** Name and phone. Only fields that changed are sent, so an untouched one is never overwritten. */
export function PersonalInfoForm({ profile }: { profile: CustomerProfileResponse }) {
  const queryClient = useQueryClient();
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [phoneError, setPhoneError] = useState<string>();

  const save = useMutation({
    mutationFn: (changes: CustomerProfileUpdateRequest) => updateMe(changes),
    onSuccess: (updated) => {
      setAccountProfile(updated);
      queryClient.setQueryData(customerKeys.me(), updated);
    },
  });

  const changes: { full_name?: string; phone?: string } = {};
  if (fullName.trim() !== (profile.full_name ?? "")) changes.full_name = fullName.trim();
  if (phone.trim() !== (profile.phone ?? "")) changes.phone = phone.trim();
  const dirty = Object.keys(changes).length > 0;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (changes.phone && !PHONE_PATTERN.test(changes.phone)) {
      setPhoneError("أدخل رقماً صحيحاً، مثلاً ‎+20 100 123 4567");
      return;
    }
    setPhoneError(undefined);
    save.mutate(changes);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field id={nameId} label="الاسم الكامل" hint="يظهر في حسابك وعلى شهاداتك.">
          <input
            id={nameId}
            className="ma-input"
            value={fullName}
            maxLength={200}
            autoComplete="name"
            onChange={(event) => setFullName(event.target.value)}
            {...describedBy(nameId, undefined, "hint")}
          />
        </Field>
        <Field id={phoneId} label="رقم الهاتف (اختياري)" error={phoneError}>
          <input
            id={phoneId}
            className="ma-input"
            dir="ltr"
            type="tel"
            inputMode="tel"
            value={phone}
            maxLength={20}
            autoComplete="tel"
            onChange={(event) => setPhone(event.target.value)}
            {...describedBy(phoneId, phoneError)}
          />
        </Field>
        <Field id={emailId} label="البريد الإلكتروني" hint="البريد الذي تسجّل الدخول به، ولا يمكن تغييره من هنا.">
          <input id={emailId} className="ma-input" dir="ltr" value={profile.email} readOnly {...describedBy(emailId, undefined, "hint")} />
        </Field>
      </div>

      <FormError message={save.isError ? "تعذّر حفظ بياناتك. تحقّق من اتصالك ثم حاول مجدداً." : null} />
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          variant="primary"
          disabled={!dirty || save.isPending}
          aria-busy={save.isPending}
          className={cn(save.isPending && "is-loading")}
        >
          حفظ التغييرات
        </Button>
        <p aria-live="polite" className="m-0 text-sm text-fg-muted">
          {save.isSuccess && !dirty ? "تم حفظ بياناتك." : null}
        </p>
      </div>
    </form>
  );
}
