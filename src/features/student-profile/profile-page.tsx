"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Sparkles, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { savedAnswers } from "@/features/onboarding/model/prefill";
import { DashboardSection } from "@/features/student-dashboard/components/dashboard-section";
import { RecommendationGrid } from "@/features/student-dashboard/components/recommendation-grid";
import { catalogQueries } from "@/lib/api/catalog";
import { customerQueries, type CustomerProfileResponse } from "@/lib/api/customers";

import { AvatarUploader } from "./components/avatar-uploader";
import { LearningProfileCard } from "./components/learning-profile-card";
import { PersonalInfoForm } from "./components/personal-info-form";

function Panel({ id, icon: Icon, title, children }: { id: string; icon: typeof UserRound; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-5 md:p-6">
      <h2 id={id} className="m-0 flex items-center gap-3 text-xl font-bold">
        <Icon aria-hidden="true" className="size-5 fill-none text-accent" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** How complete the profile is: name, phone, picture and onboarding, a quarter each. */
function completeness(profile: CustomerProfileResponse, onboarded: boolean): number {
  const parts = [Boolean(profile.full_name?.trim()), Boolean(profile.phone?.trim()), Boolean(profile.avatar_url), onboarded];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}

export function ProfilePage() {
  const me = useQuery(customerQueries.me());
  const learning = useQuery(customerQueries.learningProfile());
  const answers = useQuery(customerQueries.onboardingAnswers());
  const questions = useQuery(customerQueries.onboardingQuestions());
  const options = useQuery(catalogQueries.onboardingOptions());

  if (me.isPending || learning.isPending) {
    return (
      <div role="status" className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <span className="sr-only">جارٍ تحميل ملفك…</span>
        <Skeleton className="h-80" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  if (me.isError || !me.data) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">تعذّر تحميل ملفك</p>
          <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
        </div>
      </div>
    );
  }

  const profile = me.data;
  const name = profile.full_name?.trim() || profile.email;
  const onboarded = Boolean(learning.data?.onboarding_completed_at);
  const percent = completeness(profile, onboarded);
  const saved = savedAnswers(learning.data, answers.data, questions.data);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <aside
        aria-label="بطاقتك"
        className="flex flex-col items-center gap-5 rounded-panel border border-line-strong bg-surface-alt p-6 text-center lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]"
      >
        <AvatarUploader profile={profile} name={name} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 truncate text-xl font-bold">
            <bdi>{name}</bdi>
          </p>
          <p dir="ltr" className="m-0 truncate text-sm text-fg-muted">
            {profile.email}
          </p>
        </div>
        <div className="ma-progress w-full text-start">
          <div className="ma-progress__row">
            <span>اكتمال الملف</span>
            <span>{percent}%</span>
          </div>
          <div
            className="ma-progress__track"
            role="progressbar"
            aria-label="اكتمال الملف"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="ma-progress__bar transition-[width] duration-700" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <Panel id="personal-info-title" icon={UserRound} title="بياناتك الشخصية">
          <PersonalInfoForm key={profile.customer_id} profile={profile} />
        </Panel>
        <Panel id="learning-profile-title" icon={GraduationCap} title="ملفك التعليمي">
          {answers.isPending || options.isPending ? (
            <Skeleton className="h-48" />
          ) : (
            <LearningProfileCard answers={saved} options={options.data} completed={onboarded} />
          )}
        </Panel>
        {onboarded ? (
          <DashboardSection
            id="profile-suggestions-title"
            icon={Sparkles}
            title="مقترح لك الآن"
            subtitle="يتغيّر مع تعديل ملفك ونشاطك."
          >
            <RecommendationGrid limit={3} compactLoader />
          </DashboardSection>
        ) : null}
      </div>
    </div>
  );
}
