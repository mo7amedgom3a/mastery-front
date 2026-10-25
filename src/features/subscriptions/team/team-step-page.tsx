"use client";

import { CalendarClock, Lock, Mail, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState, type InputHTMLAttributes } from "react";

import { FlowStep } from "@/components/flow/flow-step";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { describedBy, Field } from "@/features/auth/components/field";
import { useStartCheckout } from "@/features/checkout/api/use-start-checkout";
import { CheckoutRedirectOverlay } from "@/features/checkout/components/checkout-redirect-overlay";
import { useAuthStore } from "@/lib/auth/store";
import { saveTeamLead } from "@/lib/api/subscriptions";
import { ensureAuthStatus } from "@/lib/shop/use-shop-actions";

import { PlanPrice } from "../components/plan-card";
import { SeatStepper } from "../components/seat-stepper";
import { TeamPriceBreakdown } from "../components/team-price-breakdown";
import { PLAN_TYPE_LABELS, type PlanVM } from "../model/plans";
import { clampSeats, quoteFor } from "../model/quote";
import {
  detailsErrors,
  useTeamCheckoutHydrated,
  useTeamCheckoutStore,
  type TeamField,
} from "../model/team-checkout-store";
import type { TeamStepId } from "./steps";

/**
 * `/subscriptions/{slug}/team/{details|review}`: the company tells us who it is and how big the team is,
 * then reviews the exact monthly (or yearly) total before paying on Stripe. Signed-in only, since the
 * subscription and its seats belong to the buyer's account.
 */
export function TeamStepPage({ plan, step }: { plan: PlanVM; step: TeamStepId }) {
  const hydrated = useTeamCheckoutHydrated();
  const auth = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => (state.status === "authenticated" ? state.user : null));
  const pathname = usePathname();

  useEffect(() => {
    void ensureAuthStatus();
  }, []);

  // Start this plan's answers (or keep them), and fill the contact from the account once.
  useEffect(() => {
    if (!hydrated) return;
    const store = useTeamCheckoutStore.getState();
    store.start(plan.slug, clampSeats(plan, Math.max(plan.minSeats, 10)));
    if (user) {
      const fresh = useTeamCheckoutStore.getState();
      store.update({
        email: fresh.email || user.email,
        // Some accounts carry their email as the name; only a real name is a useful default.
        contactName: fresh.contactName || (user.full_name && !user.full_name.includes("@") ? user.full_name : ""),
      });
    }
  }, [hydrated, plan, user]);

  if (auth === "unauthenticated") {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-5 rounded-panel border border-line p-6 md:p-10">
        <h1 className="m-0 text-3xl leading-[1.4] font-bold">سجّل الدخول للمتابعة</h1>
        <p className="m-0 leading-7 text-fg-muted">
          يرتبط اشتراك الشركة ومقاعد موظفيها بحسابك، ومنه تضيف فريقك بعد الدفع. سجّل الدخول أو أنشئ حساباً، وسنعيدك إلى هنا
          مباشرة.
        </p>
        <ButtonLink href={routes.loginThen(pathname)} variant="primary">
          تسجيل الدخول
        </ButtonLink>
      </section>
    );
  }
  if (!hydrated || auth !== "authenticated") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" role="status" aria-label="جارٍ التحميل">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  return step === "details" ? <DetailsStep plan={plan} /> : <ReviewStep plan={plan} />;
}

function TeamTextField({
  name,
  label,
  hint,
  required,
  ...input
}: {
  name: Exclude<TeamField, "seats">;
  label: string;
  hint?: string;
  required?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange" | "required">) {
  const id = useId();
  const value = useTeamCheckoutStore((state) => state[name]);
  const error = useTeamCheckoutStore((state) => state.errors[name]);
  const update = useTeamCheckoutStore((state) => state.update);
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <input
        {...input}
        id={id}
        name={name}
        value={value}
        required={required}
        onChange={(event) => update({ [name]: event.target.value })}
        className="ma-input"
        {...describedBy(id, error, hint)}
      />
    </Field>
  );
}

function DetailsStep({ plan }: { plan: PlanVM }) {
  const router = useRouter();
  const direction = useTeamCheckoutStore((state) => state.direction);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    const store = useTeamCheckoutStore.getState();
    const errors = detailsErrors(store);
    store.setErrors(errors);
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    // Saved now, before any price or payment: the business team follows up even if checkout is never finished.
    setSaving(true);
    try {
      const lead = await saveTeamLead({
        plan_id: plan.id,
        company_name: store.companyName.trim(),
        seat_count: clampSeats(plan, store.seats),
        contact: {
          name: store.contactName.trim(),
          email: store.email.trim(),
          phone: store.phone.trim(),
          job_title: store.jobTitle.trim() || null,
        },
      });
      store.update({ leadId: lead.lead_id });
    } catch {
      // Never block the purchase on the follow-up record; checkout still carries the details.
    } finally {
      setSaving(false);
    }
    store.setDirection(1);
    router.push(routes.subscriptionTeam(plan.slug, "review"));
  };

  return (
    <FlowStep
      stepKey="details"
      title="عرّفنا بشركتك"
      lead={`بيانات أساسية فقط لاشتراك ${plan.title}. في الخطوة التالية تختار عدد الموظفين وترى السعر النهائي قبل الدفع.`}
      direction={direction}
      onNext={() => void next()}
      canContinue
      pending={saving}
      nextLabel="متابعة: عدد الموظفين والسعر"
    >
      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <legend className="mb-4 text-lg font-bold">الشركة</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TeamTextField name="companyName" label="اسم الشركة" autoComplete="organization" maxLength={255} required />
        </div>
      </fieldset>
      <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
        <legend className="mb-4 text-lg font-bold">المسؤول عن الاشتراك</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TeamTextField name="contactName" label="الاسم" autoComplete="name" maxLength={160} required />
          <TeamTextField name="jobTitle" label="المسمى الوظيفي (اختياري)" autoComplete="organization-title" maxLength={160} />
          <TeamTextField name="email" label="بريد العمل" type="email" dir="ltr" autoComplete="email" maxLength={255} required
            hint="نرسل إليه الفاتورة وتفاصيل الاشتراك." />
          <TeamTextField name="phone" label="رقم الجوال" type="tel" dir="ltr" autoComplete="tel" maxLength={40} required
            hint="لتواصل فريق الأعمال معك بخصوص الاشتراك." />
        </div>
      </fieldset>
    </FlowStep>
  );
}

function ReviewStep({ plan }: { plan: PlanVM }) {
  const router = useRouter();
  const checkout = useStartCheckout();
  const answers = useTeamCheckoutStore();
  const [checked, setChecked] = useState(false);
  const seats = clampSeats(plan, answers.seats);
  const quote = quoteFor(plan, seats);
  const incomplete = Object.keys(detailsErrors(answers)).length > 0;

  // Landing here without the details (a shared link, a cleared tab): fill them in first.
  useEffect(() => {
    if (incomplete) router.replace(routes.subscriptionTeam(plan.slug, "details"));
  }, [incomplete, plan.slug, router]);

  // Pre-checkout record: the company's basic details plus the team size chosen on this step, saved
  // before Stripe so the business team sees every company that reaches review, paid or not.
  useEffect(() => {
    if (incomplete) return;
    const timer = window.setTimeout(() => {
      const state = useTeamCheckoutStore.getState();
      if (Object.keys(detailsErrors(state)).length > 0) return;
      void saveTeamLead({
        plan_id: plan.id,
        company_name: state.companyName.trim(),
        seat_count: clampSeats(plan, state.seats),
        contact: {
          name: state.contactName.trim(),
          email: state.email.trim(),
          phone: state.phone.trim(),
          job_title: state.jobTitle.trim() || null,
        },
      })
        .then((lead) => useTeamCheckoutStore.getState().update({ leadId: lead.lead_id }))
        .catch(() => {
          // Follow-up bookkeeping never blocks the checkout that carries the same details.
        });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    incomplete,
    plan,
    answers.companyName,
    answers.contactName,
    answers.email,
    answers.phone,
    answers.jobTitle,
    seats,
  ]);

  const back = () => {
    answers.setDirection(-1);
    router.push(routes.subscriptionTeam(plan.slug, "details"));
  };
  const pay = () => {
    void checkout.start({
      mode: "subscription",
      planId: plan.id,
      seatCount: seats,
      companyName: answers.companyName.trim(),
      contact: {
        name: answers.contactName.trim(),
        email: answers.email.trim(),
        phone: answers.phone.trim(),
        ...(answers.jobTitle.trim() ? { job_title: answers.jobTitle.trim() } : {}),
      },
      cancelUrl: routes.subscriptionTeam(plan.slug, "review"),
      leadId: answers.leadId,
    });
  };
  const renews = plan.interval === "year" ? "كل سنة" : "كل شهر";

  return (
    <FlowStep
      stepKey="review"
      title="راجع اشتراك فريقك"
      lead="اختر عدد الموظفين، ويتحدّث السعر لكل موظف والإجمالي فوراً. هذا ما ستدفعه بالضبط."
      direction={answers.direction}
      onBack={back}
      onNext={pay}
      canContinue={checked && !incomplete}
      pending={checkout.busy}
      error={checkout.error}
      nextLabel="الدفع الآمن عبر Stripe"
      beforeNext={
        <label className="flex items-start gap-3 rounded-panel border border-line bg-surface p-4 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <span>
            راجعت عدد الموظفين ({seats}) والإجمالي، وأوافق على تجديد الاشتراك {renews}.
          </span>
        </label>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="team-size-title" className="flex flex-col gap-4 rounded-panel border border-line p-5">
            <h2 id="team-size-title" className="m-0 flex items-center gap-2 text-lg font-bold">
              <Users aria-hidden="true" className="size-5 fill-none text-accent" />
              كم موظفاً في فريقك؟
            </h2>
            <SeatStepper value={seats} min={plan.minSeats} max={plan.maxSeats} required onChange={(value) => answers.update({ seats: value })} />
          </section>

          <section aria-labelledby="team-summary-title" className="flex flex-col gap-4 rounded-panel border border-line p-5">
            <h2 id="team-summary-title" className="m-0 text-xl font-bold">
              {plan.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="ma-tag ma-tag--soft">{PLAN_TYPE_LABELS[plan.planType]}</span>
              <span className="ma-tag ma-tag--soft">{plan.interval === "year" ? "اشتراك سنوي" : "اشتراك شهري"}</span>
            </div>
            <PlanPrice plan={plan} />
          </section>

          <section aria-labelledby="team-company-title" className="flex flex-col gap-3 rounded-panel border border-line p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="team-company-title" className="m-0 text-lg font-bold">
                بيانات الشركة
              </h2>
              <button type="button" className="ma-btn ma-btn--bare ma-btn--sm" onClick={back}>
                تعديل البيانات
              </button>
            </div>
            <dl className="m-0 grid gap-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-fg-muted">الشركة</dt>
                <dd className="m-0 font-bold">{answers.companyName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-fg-muted">المسؤول</dt>
                <dd className="m-0 font-bold">{answers.contactName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-fg-muted">البريد</dt>
                <dd className="m-0 min-w-0 font-bold break-all" dir="ltr">
                  {answers.email}
                </dd>
              </div>
              {answers.phone ? (
                <div className="flex gap-2">
                  <dt className="text-fg-muted">الجوال</dt>
                  <dd className="m-0 font-bold" dir="ltr">
                    {answers.phone}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <aside aria-labelledby="team-total-title" className="flex flex-col gap-5 rounded-panel border border-line-strong p-5 lg:sticky lg:top-6">
          <h2 id="team-total-title" className="m-0 text-lg font-bold">
            ملخص الدفع
          </h2>
          <TeamPriceBreakdown plan={plan} quote={quote} />
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm leading-6 text-fg-muted">
            <li className="flex items-start gap-2">
              <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-none" />
              يُخصم المبلغ اليوم، ويتجدد الاشتراك تلقائياً {renews} بنفس السعر. يمكنك إلغاء التجديد متى شئت.
            </li>
            <li className="flex items-start gap-2">
              <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-none" />
              <span className="min-w-0">
                تصلك الفاتورة على
                <bdi dir="ltr" className="block font-bold break-all text-fg">{answers.email}</bdi>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-none" />
              <span>
                بعد الدفع تضيف موظفيك من لوحة <bdi dir="ltr">eMastery Business</bdi>، ويحصل كل موظف على وصوله فوراً.
              </span>
            </li>
          </ul>
          <p className="m-0 flex items-start gap-2 text-xs leading-5 text-fg-muted">
            <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 fill-none" />
            دفع آمن عبر Stripe. ستظهر لك نفس الأرقام في صفحة الدفع.
          </p>
        </aside>
      </div>
      <CheckoutRedirectOverlay phase={checkout.phase} preparingText="جارٍ تجهيز اشتراك فريقك…" />
    </FlowStep>
  );
}
