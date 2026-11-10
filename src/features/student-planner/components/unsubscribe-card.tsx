"use client";

import { CheckCircle2, MailX, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { unsubscribePlannerReminders } from "@/lib/api/planner";

type State = "loading" | "done" | "invalid" | "error";

const COPY: Record<Exclude<State, "loading">, { title: string; body: string }> = {
  done: {
    title: "أوقفنا تذكيرات خطة التعلّم",
    body: "لن تصلك تذكيرات المواعيد ولا الملخّص اليومي. يمكنك تفعيلها من جديد في أي وقت من صفحة خطة التعلّم.",
  },
  invalid: {
    title: "رابط غير صالح",
    body: "الرابط ناقص. استخدم الرابط الموجود في آخر رسالة وصلتك، أو عدّل التذكيرات من صفحة خطة التعلّم.",
  },
  error: {
    title: "تعذّر إيقاف التذكيرات",
    body: "حدث خطأ مؤقت. حاول فتح الرابط مرة أخرى بعد قليل.",
  },
};

// Idempotent POST; StrictMode runs effects twice in dev, so share one request per token.
const requests = new Map<string, ReturnType<typeof unsubscribePlannerReminders>>();

/** Posts the token from `/planner/unsubscribe?token=…` once, then shows the result. */
export function PlannerUnsubscribeCard({ token }: { token: string | null }) {
  const [state, setState] = useState<State>(token ? "loading" : "invalid");

  useEffect(() => {
    if (!token) return;
    let pending = requests.get(token);
    if (!pending) {
      pending = unsubscribePlannerReminders(token);
      requests.set(token, pending);
    }
    pending.then(() => setState("done")).catch(() => setState("error"));
  }, [token]);

  const copy = state === "loading" ? null : COPY[state];
  const Icon = state === "done" ? CheckCircle2 : state === "error" ? TriangleAlert : MailX;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-panel border border-line bg-surface p-8 text-center">
      <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-surface-alt">
        {state === "loading" ? (
          <span className="size-5 animate-spin rounded-full border-2 border-fg border-t-transparent" />
        ) : (
          <Icon className="size-6 fill-none" />
        )}
      </span>
      <h1 className="m-0 text-2xl font-bold" aria-live="polite">
        {state === "loading" ? "جارٍ إيقاف التذكيرات…" : copy?.title}
      </h1>
      <p className="m-0 leading-7 text-fg-muted">{state === "loading" ? "لحظة واحدة." : copy?.body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href={routes.studentPlanner()}>خطة التعلّم</ButtonLink>
        <ButtonLink href={routes.home} variant="soft">
          ماستري أكاديمي
        </ButtonLink>
      </div>
    </div>
  );
}
