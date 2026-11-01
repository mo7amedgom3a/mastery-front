"use client";

import { CheckCircle2, MailX, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";

import { unsubscribeFromBlog } from "../api/subscribe";

type State = "loading" | "done" | "already" | "invalid" | "error";

const COPY: Record<Exclude<State, "loading">, { title: string; body: string }> = {
  done: {
    title: "تم إلغاء اشتراكك",
    body: "لن تصلك رسائل المدونة بعد الآن. سنفتقدك — ويمكنك الاشتراك من جديد في أي وقت من صفحة المدونة.",
  },
  already: {
    title: "بريدك غير مشترك",
    body: "هذا البريد غير موجود في قائمة النشرة، أو سبق إلغاء اشتراكه. لا حاجة لأي إجراء آخر.",
  },
  invalid: {
    title: "رابط غير صالح",
    body: "رابط إلغاء الاشتراك ناقص أو منتهي الصلاحية. استخدم الرابط الموجود في آخر رسالة وصلتك، أو تواصل معنا.",
  },
  error: {
    title: "تعذّر إلغاء الاشتراك",
    body: "حدث خطأ مؤقت أثناء الاتصال. حاول فتح الرابط مرة أخرى بعد قليل.",
  },
};

// The unsubscribe POST is idempotent, and React StrictMode mounts effects twice in dev: share one
// in-flight request per token instead of gating state updates on a cleanup flag (which would leave
// the card stuck on "loading" forever).
const requests = new Map<string, Promise<Awaited<ReturnType<typeof unsubscribeFromBlog>>>>();

function requestUnsubscribe(token: string) {
  let pending = requests.get(token);
  if (!pending) {
    pending = unsubscribeFromBlog(token);
    requests.set(token, pending);
  }
  return pending;
}

/** Posts the token from `/blog/unsubscribe?token=…` once, then shows the result. */
export function UnsubscribeCard({ token }: { token: string | null }) {
  const [state, setState] = useState<State>(token ? "loading" : "invalid");

  useEffect(() => {
    if (!token) return;
    requestUnsubscribe(token)
      .then((result) => setState(result.unsubscribed ? "done" : "already"))
      .catch((error: unknown) => {
        const status = error instanceof ApiError ? error.status : 0;
        setState(status === 422 || status === 404 ? "invalid" : "error");
      });
  }, [token]);

  const copy = state === "loading" ? null : COPY[state];
  const Icon = state === "done" ? CheckCircle2 : state === "loading" ? null : state === "error" ? TriangleAlert : MailX;

  return (
    <main className="blog-main flex items-center px-5">
      <div className="unsubscribe-card">
        <div className="icon-wrap" aria-hidden="true">
          {state === "loading" ? <span className="spinner" /> : Icon ? <Icon className="h-6 w-6" /> : null}
        </div>
        <h1>{state === "loading" ? "جارٍ تأكيد إلغاء الاشتراك…" : copy?.title}</h1>
        <p>{state === "loading" ? "لحظة واحدة، نتحقّق من الرابط." : copy?.body}</p>
        <div className="actions">
          <Link href={routes.blog} className="btn btn-ink">
            العودة إلى المدونة
          </Link>
          <Link href={routes.home} className="btn btn-ghost">
            ماستري أكاديمي
          </Link>
        </div>
      </div>
    </main>
  );
}
