"use client";

import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";

import { routes } from "@/config/routes";
import { PolicyReader } from "@/features/marketers/components/policy-reader";
import type { ProgramPolicy } from "@/features/marketers/model/policy";

import { ApplyFrame } from "../components/apply-frame";
import { answersOf, useApplyStore } from "../model/apply-store";
import { applicationBody, firstInvalidStep, stepErrors } from "../model/schema";
import { APPLY_STEPS } from "../model/steps";

/** Last step: read the programme policy to the end, accept it, and send the application. */
export function PolicyStep({ policy }: { policy: ProgramPolicy | null }) {
  const id = useId();
  const router = useRouter();
  const [read, setRead] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markRead = useCallback(() => setRead(true), []);

  const submit = async () => {
    const answers = answersOf(useApplyStore.getState());
    // A refresh keeps answers, so an earlier step may still be incomplete: send the applicant back there.
    const invalid = firstInvalidStep(APPLY_STEPS.map((step) => step.id), answers);
    if (invalid) {
      useApplyStore.getState().setErrors(stepErrors(invalid, answers));
      useApplyStore.getState().setDirection(-1);
      router.push(routes.marketersApply(invalid));
      return;
    }
    if (!policy) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/b2c/affiliates/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...applicationBody(answers, policy.version), website: honeypot.trim() || null }),
      });
      if (res.ok) {
        sessionStorage.setItem("mastery-marketer-applied-email", answers.email.trim().toLowerCase());
        useApplyStore.getState().reset();
        router.push(routes.marketersApplyDone);
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.status === 409 && data?.detail === "policy_changed") {
        setRead(false);
        setAccepted(false);
        setError("تم تحديث سياسة البرنامج. حدّث الصفحة واقرأ السياسة الجديدة ثم أرسل الطلب.");
      } else if (res.status === 409) {
        setError("هذا البريد مسجّل بالفعل كمسوّق أو قدّم طلبًا سابقًا. عدّل البريد من الخطوة الأولى.");
      } else if (res.status === 403) {
        setError("نعتذر، باب التقديم مغلق حاليًا.");
      } else if (res.status === 422) {
        setError("تحقّق من بياناتك في الخطوات السابقة ثم أعد الإرسال.");
      } else {
        setError("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقّق من اتصالك وحاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  };

  const consent = (
    <div className="flex flex-col gap-2">
      <label className={`ma-check items-start ${read ? "" : "opacity-60"}`}>
        <input
          type="checkbox"
          checked={accepted}
          disabled={!read}
          onChange={(e) => setAccepted(e.target.checked)}
          aria-describedby={read ? undefined : `${id}-hint`}
        />
        <span className="text-sm leading-relaxed text-fg-muted">
          قرأت <strong className="text-fg">سياسة برنامج التسويق بالعمولة</strong> وأوافق عليها، وأتعهد بالالتزام بأخلاقيات
          التسويق الرقمي وعدم استخدام وسائل تضليلية أو غير مصرح بها.
        </span>
      </label>
      {policy && !read ? <p id={`${id}-hint`} className="ma-help m-0">مرّر حتى نهاية السياسة لتفعيل الموافقة.</p> : null}
    </div>
  );

  return (
    <ApplyFrame
      step="policy"
      title="سياسة البرنامج"
      lead="اقرأ سياسة برنامج التسويق بالعمولة حتى النهاية، ثم وافق عليها وأرسل طلبك."
      onNext={submit}
      nextLabel={pending ? "جارٍ الإرسال…" : "إرسال الطلب"}
      beforeNext={consent}
      pending={pending}
      error={error}
      disabled={!policy || !read || !accepted}
    >
      {policy && policy.sections.length > 0 ? (
        <PolicyReader sections={policy.sections} read={read} onRead={markRead} />
      ) : (
        <p className="ma-alert ma-alert--warning m-0 text-sm" role="alert">
          تعذّر تحميل سياسة البرنامج. حدّث الصفحة لتتمكن من قراءتها وإرسال الطلب.
        </p>
      )}
      {/* Honeypot: hidden from people, filled by bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -start-[9999px] h-0 w-0 opacity-0"
      />
    </ApplyFrame>
  );
}
