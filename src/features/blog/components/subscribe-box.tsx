"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api/client";

import { subscribeToBlog } from "../api/subscribe";

type Status = "idle" | "pending" | "done" | "already" | "error";

/** The newsletter box; posts to the backend through the same-origin door. */
export function SubscribeBox({ source = "blog" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || status === "pending") return;
    setStatus("pending");
    setError(null);
    try {
      const result = await subscribeToBlog(email, source);
      setStatus(result.already_subscribed ? "already" : "done");
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof ApiError && requestError.status === 422
          ? "تحقّق من صيغة البريد الإلكتروني ثم أعد المحاولة."
          : "تعذّر إتمام الاشتراك الآن، حاول مرة أخرى بعد قليل.",
      );
    }
  };

  const settled = status === "done" || status === "already";

  return (
    <div className="cta-box" data-reveal id="subscribe">
      <h2 className="type-h2">مقالات أسبوعية بلا ضجيج</h2>
      <p className="type-body-16 cta-desc">
        رسالة واحدة كل أسبوع عن التسويق والقيادة وريادة الأعمال — بلا إعلانات، ويمكنك إلغاء
        الاشتراك في أي وقت.
      </p>

      {settled ? (
        <p className="cta-success" role="status">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          {status === "already"
            ? "بريدك مشترك معنا بالفعل — ستصلك الرسالة القادمة قريبًا."
            : "تم الاشتراك بنجاح — ستصلك إشعارات المقالات الجديدة على بريدك."}
        </p>
      ) : (
        <form className="cta-form" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="blog-subscribe-email">
            البريد الإلكتروني
          </label>
          <input
            id="blog-subscribe-email"
            className="cta-input"
            type="email"
            required
            dir="ltr"
            placeholder="name@email.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className="btn btn-accent" type="submit" disabled={status === "pending"}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {status === "pending" ? "جارٍ الاشتراك…" : "اشترك"}
          </button>
        </form>
      )}

      {error ? (
        <p className="cta-error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="cta-note">نجمع بريدك بغرض إرسال النشرة فقط، ولا نشاركه مع أي طرف ثالث.</p>
    </div>
  );
}
