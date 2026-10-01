"use client";

import { useId, useState, type FormEvent } from "react";

import { AppLink } from "@/components/ui/app-link";
import { Button, ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { registerAccount, requestLoginCode } from "@/lib/auth/client";

import { authErrorMessage } from "../model/messages";
import { registerSchema, type RegisterField } from "../model/schemas";
import { CodeStep } from "./code-step";
import { describedBy, Field, FormError } from "./field";

type FieldErrors = Partial<Record<RegisterField, string>>;

/** After the account exists: `code` when its first sign-in code is on the way, `created` when it isn't. */
type Done = { kind: "code"; loginName: string; resendAfter: number } | { kind: "created" };

const PASSWORD_HINT = "8 أحرف على الأقل.";

/**
 * Creates the account, then goes straight on to the emailed-code step, so a new customer is signed
 * in without filling the sign-in form as well.
 */
export function RegisterForm({ next }: { next: string }) {
  const baseId = useId();
  const [done, setDone] = useState<Done | null>(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (done?.kind === "code") {
    return <CodeStep loginName={done.loginName} resendAfter={done.resendAfter} next={next} onBack={() => setDone({ kind: "created" })} />;
  }
  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <p role="status" className="m-0 leading-7">
          تم إنشاء حسابك. سجّل الدخول ببريدك الإلكتروني للمتابعة.
        </p>
        <ButtonLink href={routes.loginThen(next)} block>
          تسجيل الدخول
        </ButtonLink>
      </div>
    );
  }

  const idOf = (name: RegisterField) => `${baseId}-${name}`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      fullname: form.get("fullname"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      repassword: form.get("repassword"),
      acceptterms: form.get("acceptterms") === "on",
    });
    setFormError(null);
    if (!parsed.success) {
      const found: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const name = issue.path[0] as RegisterField;
        found[name] ??= issue.message;
      }
      setErrors(found);
      // Focus lands on the first field that needs fixing.
      const first = (Object.keys(found) as RegisterField[])[0];
      if (first) document.getElementById(idOf(first))?.focus();
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await registerAccount(parsed.data);
    } catch (error) {
      setFormError(authErrorMessage(error));
      setPending(false);
      return;
    }
    try {
      const sent = await requestLoginCode(parsed.data.email);
      setDone({ kind: "code", loginName: parsed.data.email, resendAfter: sent.resendAfter });
    } catch {
      // The account exists; only the first code couldn't be requested. The sign-in page takes over.
      setDone({ kind: "created" });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <FormError message={formError} />

      <Field id={idOf("fullname")} label="الاسم الكامل" error={errors.fullname}>
        <input
          id={idOf("fullname")}
          name="fullname"
          autoComplete="name"
          maxLength={300}
          required
          className="ma-input"
          {...describedBy(idOf("fullname"), errors.fullname)}
        />
      </Field>

      <Field id={idOf("email")} label="البريد الإلكتروني" error={errors.email}>
        <input
          id={idOf("email")}
          name="email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={256}
          required
          className="ma-input text-end"
          {...describedBy(idOf("email"), errors.email)}
        />
      </Field>

      <Field id={idOf("phone")} label="رقم الهاتف (اختياري)" error={errors.phone}>
        <input
          id={idOf("phone")}
          name="phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          maxLength={80}
          placeholder="+966 5x xxx xxxx"
          className="ma-input text-end"
          {...describedBy(idOf("phone"), errors.phone)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={idOf("password")} label="كلمة المرور" error={errors.password} hint={PASSWORD_HINT}>
          <input
            id={idOf("password")}
            name="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            minLength={8}
            maxLength={200}
            required
            className="ma-input text-end"
            {...describedBy(idOf("password"), errors.password, PASSWORD_HINT)}
          />
        </Field>
        <Field id={idOf("repassword")} label="تأكيد كلمة المرور" error={errors.repassword}>
          <input
            id={idOf("repassword")}
            name="repassword"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            maxLength={200}
            required
            className="ma-input text-end"
            {...describedBy(idOf("repassword"), errors.repassword)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <label className="ma-check">
          <input
            id={idOf("acceptterms")}
            name="acceptterms"
            type="checkbox"
            required
            {...describedBy(idOf("acceptterms"), errors.acceptterms)}
          />
          <span>
            أوافق على{" "}
            <AppLink href={routes.terms} target="_blank" className="ma-link">
              الشروط والأحكام
            </AppLink>{" "}
            و
            <AppLink href={routes.privacy} target="_blank" className="ma-link">
              سياسة الخصوصية
            </AppLink>
          </span>
        </label>
        {errors.acceptterms ? (
          <p id={`${idOf("acceptterms")}-error`} className="ma-help m-0 text-fg">
            {errors.acceptterms}
          </p>
        ) : null}
      </div>

      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? "جارٍ إنشاء الحساب…" : "إنشاء حساب"}
      </Button>
    </form>
  );
}
