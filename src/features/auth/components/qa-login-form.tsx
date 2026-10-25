"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth/store";

import { authErrorMessage } from "../model/messages";
import { qaLoginSchema, type QALoginInput } from "../model/schemas";
import { landingPath } from "./code-step";
import { describedBy, Field, FormError } from "./field";

type FieldErrors = Partial<Record<keyof QALoginInput, string>>;

/**
 * Development-only sign-in for the QA customer and expert accounts with the shared QA key; no
 * emailed code. Shown only when `NEXT_PUBLIC_QA_LOGIN_ENABLED=true`.
 */
export function QALoginForm({ next }: { next: string }) {
  const router = useRouter();
  const emailId = useId();
  const keyId = useId();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = qaLoginSchema.safeParse({ email: data.get("email"), key: data.get("key") });
    setFormError(null);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof QALoginInput;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setPending(true);
    let destination: string;
    try {
      const customer = await useAuthStore.getState().qaLogin(parsed.data.email, parsed.data.key);
      destination = await landingPath(next, customer.customer_id);
    } catch (error) {
      setFormError(authErrorMessage(error));
      setPending(false);
      return;
    }
    // Stays pending while the next page loads, as the code step does.
    router.replace(destination as Route);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <FormError message={formError} />
      <Field id={emailId} label="بريد حساب QA" error={fieldErrors.email}>
        <input
          id={emailId}
          name="email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={256}
          required
          className="ma-input text-end"
          {...describedBy(emailId, fieldErrors.email)}
        />
      </Field>
      <Field id={keyId} label="مفتاح QA" error={fieldErrors.key}>
        <input
          id={keyId}
          name="key"
          type="password"
          dir="ltr"
          autoComplete="off"
          maxLength={512}
          required
          className="ma-input text-end"
          {...describedBy(keyId, fieldErrors.key)}
        />
      </Field>
      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? "جارٍ الدخول…" : "الدخول بحساب QA"}
      </Button>
    </form>
  );
}
