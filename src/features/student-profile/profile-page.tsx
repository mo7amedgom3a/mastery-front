"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, GraduationCap, Sparkles, UserRound } from "lucide-react";
import { useId, useState, type ChangeEvent, type ReactNode } from "react";

import { UserAvatar } from "@/components/layout/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { savedAnswers } from "@/features/onboarding/model/prefill";
import { DashboardSection } from "@/features/student-dashboard/components/dashboard-section";
import { RecommendationGrid } from "@/features/student-dashboard/components/recommendation-grid";
import { setAccountProfile } from "@/lib/account/use-account-profile";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/lib/api/avatar";
import { catalogQueries } from "@/lib/api/catalog";
import { customerKeys, customerQueries, uploadAvatar, type CustomerProfileResponse } from "@/lib/api/customers";
import { cn } from "@/lib/cn";

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

function checkFile(file: File): string | null {
  if (!AVATAR_TYPES.has(file.type)) return "الصيغ المدعومة: PNG أو JPG أو WebP.";
  if (file.size > AVATAR_MAX_BYTES) return "حجم الصورة أكبر من 5 ميجابايت.";
  return null;
}

/**
 * Who this is: the picture (with its "change" control), name, e-mail and how complete the profile is.
 * A chosen picture shows at once (a local preview) while it uploads; on success the header's avatar
 * follows, on failure the old one comes back.
 */
function ProfileHeader({ profile, name, percent }: { profile: CustomerProfileResponse; name: string; percent: number }) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updated) => {
      setAccountProfile(updated);
      queryClient.setQueryData(customerKeys.me(), updated);
    },
    onError: (failure) => setError(failure.message || "تعذّر رفع الصورة حالياً."),
    onSettled: () =>
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      }),
  });

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkFile(file);
    setError(problem);
    if (problem) return;
    setPreview(URL.createObjectURL(file));
    upload.mutate(file);
  };

  return (
    <section
      aria-label="بطاقتك"
      className="flex flex-col gap-5 rounded-panel border border-line-strong bg-surface-alt p-5 md:flex-row md:items-center md:gap-8 md:p-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div className="relative shrink-0">
          <UserAvatar
            name={name}
            src={preview ?? profile.avatar_url}
            size={88}
            className={cn("text-3xl ring-4 ring-surface", upload.isPending && "opacity-60")}
          />
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={choose}
            disabled={upload.isPending}
            className="peer sr-only"
          />
          {/* The hidden input keeps focus; the camera button shows it. */}
          <label
            htmlFor={inputId}
            className="absolute -end-1 -bottom-1 grid size-11 cursor-pointer place-items-center rounded-full border-2 border-surface bg-fg text-surface transition-transform peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:scale-105"
          >
            <Camera aria-hidden="true" className="size-5 fill-none" />
            <span className="sr-only">تغيير الصورة الشخصية</span>
          </label>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 truncate text-2xl leading-9 font-bold">
            <bdi>{name}</bdi>
          </p>
          <p dir="ltr" className="m-0 truncate text-start text-sm text-fg-muted">
            {profile.email}
          </p>
          <p aria-live="polite" className="m-0 text-sm text-fg-muted">
            {upload.isPending ? "جارٍ رفع الصورة…" : upload.isSuccess ? "تم تحديث صورتك." : "PNG أو JPG أو WebP، حتى 5 ميجابايت"}
          </p>
          {error ? (
            <p role="alert" className="m-0 border-s-4 border-pink ps-3 text-sm font-medium">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      <div className="ma-progress w-full md:w-72 md:shrink-0">
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
    </section>
  );
}

export function ProfilePage() {
  const me = useQuery(customerQueries.me());
  const learning = useQuery(customerQueries.learningProfile());
  const answers = useQuery(customerQueries.onboardingAnswers());
  const questions = useQuery(customerQueries.onboardingQuestions());
  const options = useQuery(catalogQueries.onboardingOptions());

  if (me.isPending || learning.isPending) {
    return (
      <div role="status" className="flex flex-col gap-6">
        <span className="sr-only">جارٍ تحميل ملفك…</span>
        <Skeleton className="h-36" />
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
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
  const saved = savedAnswers(learning.data, answers.data, questions.data);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHeader profile={profile} name={name} percent={completeness(profile, onboarded)} />
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
  );
}
