"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { requestLoginCode } from "@/lib/auth/client";
import { trackAuth } from "@/lib/observability/behavior";

import { authErrorMessage } from "../model/messages";
import { loginSchema } from "../model/schemas";
import { CodeStep } from "./code-step";
import { describedBy, Field, FormError } from "./field";

type PendingLogin = { loginName: string; resendAfter: number };

const EMAIL_HINT = "سنرسل إليه رمز تحقق لإتمام الدخول.";

/**
 * Sign-in in two steps, as the API defines it: the email, then the code emailed to it. There is
 * no password step.
 */
export function LoginForm({ next }: { next: string }) {
  const id = useId();
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);
  const [loginName, setLoginName] = useState("");
  const [pending, setPending] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);

  if (pendingLogin) {
    return <CodeStep {...pendingLogin} next={next} onBack={() => setPendingLogin(null)} />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ loginName });
    setFormError(null);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setPending(true);
    try {
      const sent = await requestLoginCode(parsed.data.loginName);
      trackAuth("login_started");
      setPendingLogin({ loginName: parsed.data.loginName, resendAfter: sent.resendAfter });
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <FormError message={formError} />
      <Field id={id} label="البريد الإلكتروني" error={fieldError} hint={EMAIL_HINT}>
        <input
          id={id}
          name="loginName"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={256}
          required
          value={loginName}
          onChange={(event) => setLoginName(event.target.value)}
          className="ma-input text-end"
          {...describedBy(id, fieldError, EMAIL_HINT)}
        />
      </Field>
      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? "جارٍ الإرسال…" : "إرسال رمز التحقق"}
      </Button>
    </form>
  );
}
