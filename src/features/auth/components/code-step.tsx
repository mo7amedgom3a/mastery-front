"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { resendLoginCode } from "@/lib/auth/client";
import { useAuthStore } from "@/lib/auth/store";

import { authErrorMessage, retryAfterSeconds } from "../model/messages";
import { verifySchema } from "../model/schemas";
import { describedBy, Field, FormError } from "./field";

type CodeStepProps = {
  /** What the visitor typed; the code goes to the account's email. */
  loginName: string;
  /** Seconds until another code may be requested. */
  resendAfter: number;
  /** Where to go once signed in (already checked to be a path on this site). */
  next: string;
  onBack: () => void;
};

/** Step two of signing in: the code that was emailed. Signs in and leaves for `next`. */
export function CodeStep({ loginName, resendAfter, next, onBack }: CodeStepProps) {
  const router = useRouter();
  const id = useId();
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(resendAfter);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = verifySchema.safeParse({ code: new FormData(event.currentTarget).get("code") });
    setFormError(null);
    setNotice(null);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setPending(true);
    try {
      await useAuthStore.getState().verifyCode(parsed.data.code);
    } catch (error) {
      setFormError(authErrorMessage(error));
      setPending(false);
      return;
    }
    // Stays pending while the next page loads. `refresh` re-renders what the server made for a guest.
    router.replace(next as Route);
    router.refresh();
  };

  const resend = async () => {
    setFormError(null);
    setNotice(null);
    setResending(true);
    try {
      const sent = await resendLoginCode();
      setSecondsLeft(sent.resendAfter);
      setNotice("أرسلنا رمزاً جديداً. الرمز السابق لم يعد صالحاً.");
    } catch (error) {
      const wait = retryAfterSeconds(error);
      if (wait) setSecondsLeft(wait);
      setFormError(authErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <p className="m-0 leading-7 text-fg-muted">
        إن كان{" "}
        <bdi dir="ltr" className="font-medium text-fg">
          {loginName}
        </bdi>{" "}
        مسجّلاً لدينا، فسيصلك رمز التحقق على بريدك الإلكتروني خلال لحظات. أدخله هنا لإتمام الدخول.
      </p>

      <FormError message={formError} />
      {notice ? (
        <p role="status" className="m-0 text-sm leading-6 text-fg-muted">
          {notice}
        </p>
      ) : null}

      <Field id={id} label="رمز التحقق" error={fieldError}>
        <input
          id={id}
          name="code"
          dir="ltr"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
          required
          autoFocus
          className="ma-input text-center text-xl tracking-[0.3em]"
          {...describedBy(id, fieldError)}
        />
      </Field>

      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? "جارٍ التحقق…" : "تأكيد الدخول"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={resend}
          disabled={secondsLeft > 0 || resending || pending}
          className="ma-btn ma-btn--ghost ma-btn--sm min-h-11"
        >
          {secondsLeft > 0 ? `إعادة الإرسال بعد ${secondsLeft} ث` : resending ? "جارٍ الإرسال…" : "إعادة إرسال الرمز"}
        </button>
        <button type="button" onClick={onBack} disabled={pending} className="ma-btn ma-btn--ghost ma-btn--sm min-h-11">
          تغيير البريد الإلكتروني
        </button>
      </div>
    </form>
  );
}
