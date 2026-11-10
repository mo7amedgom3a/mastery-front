"use client";

import { useQuery } from "@tanstack/react-query";
import { UserRoundPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewAllLink } from "@/components/ui/view-all-link";
import { routes } from "@/config/routes";
import { isOnboardingSkipped } from "@/features/onboarding/model/skip";
import { certificateQueries } from "@/lib/api/certificates";
import { commerceQueries } from "@/lib/api/commerce";
import { customerQueries } from "@/lib/api/customers";
import { lmsQueries } from "@/lib/api/lms";
import { useAuthStore } from "@/lib/auth/store";
import { formatCount } from "@/lib/format";

import { ExamsPanel } from "./components/exams-panel";
import { InsightsSnapshotPanel } from "./components/insights-snapshot-panel";
import { InviteFriendCard } from "./components/invite-friend-card";
import { LearningListPanel } from "./components/learning-list-panel";
import { LearningProgressPanel } from "./components/learning-progress-panel";
import { LearningStatsPanel } from "./components/learning-stats-panel";
import { NextConsultationPanel } from "./components/next-consultation-panel";
import { NotificationsPanel } from "./components/notifications-panel";
import { RecommendationGrid } from "./components/recommendation-grid";
import { ResumeLearningHero } from "./components/resume-learning-hero";
import { averageProgress, learningPrograms } from "./model/learning";
import { useCatalogArtwork } from "./model/use-artwork";

const noSubscription = () => () => undefined;

const LEARNING_FORMS = {
  one: "برنامج واحد",
  two: "برنامجان",
  few: "برامج",
  many: "برنامجاً",
};

/**
 * Sends a customer who neither finished nor skipped onboarding to it. Undecided (still loading, or
 * leaving) renders nothing, so the dashboard never flashes before the redirect.
 */
function useOnboardingGate(): { ready: boolean; completed: boolean } {
  const router = useRouter();
  const customerId = useAuthStore((state) => state.user?.customer_id ?? null);
  const profile = useQuery(customerQueries.learningProfile());
  const completed = Boolean(profile.data?.onboarding_completed_at);
  // localStorage is only readable in the browser: null while rendering on the server.
  const skipped = useSyncExternalStore(
    noSubscription,
    () => (customerId ? isOnboardingSkipped(customerId) : null),
    () => null,
  );

  const mustOnboard = profile.isSuccess && !completed && skipped === false;
  useEffect(() => {
    if (mustOnboard) router.replace(routes.studentOnboarding());
  }, [mustOnboard, router]);

  // A failed profile read shouldn't lock the customer out of their dashboard.
  const decided = profile.isError || (profile.isSuccess && (completed || skipped === true));
  return { ready: decided, completed };
}

/** Shown until onboarding is done (e.g. after "skip"): the way back into it. */
function CompleteProfileCard() {
  return (
    <aside
      aria-labelledby="complete-profile-title"
      className="flex flex-wrap items-center justify-between gap-5 rounded-panel border border-line-strong bg-surface-alt p-5 md:p-6"
    >
      <div className="flex min-w-0 items-start gap-4">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-ink">
          <UserRoundPen className="size-6 fill-none" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="complete-profile-title" className="m-0 text-lg font-bold">
            ابنِ ملفك التعليمي
          </h2>
          <p className="m-0 max-w-[55ch] leading-7 text-fg-muted">
            أخبرنا بأهدافك والمهارات التي تريد اكتسابها في دقيقتين، لنقترح عليك ما يناسبك.
          </p>
        </div>
      </div>
      <ButtonLink href={routes.studentOnboarding()} variant="primary">
        أكمل ملفك
      </ButtonLink>
    </aside>
  );
}

function DashboardOverview({ onboardingCompleted }: { onboardingCompleted: boolean }) {
  const user = useAuthStore((state) => state.user);
  // All of them (the API caps at 100), so the snapshot fallback covers every owned program.
  const owned = useQuery(commerceQueries.ownedProducts({ status: "active", limit: 100 }));
  const lmsCourses = useQuery(lmsQueries.courses({ page: 1, page_size: 50 }));
  const certificates = useQuery(certificateQueries.mine());

  const allProducts = owned.data?.items ?? [];
  const lmsItems = lmsCourses.data?.items ?? [];
  const artwork = useCatalogArtwork(allProducts.map((product) => product.slug));
  const programsResult = learningPrograms(lmsItems, allProducts, artwork);
  const programs = programsResult.items.toSorted((a, b) =>
    (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""),
  );
  const average = averageProgress(programs);

  // Wait for the live call before showing anything; once it fails, the real /me/products snapshot is
  // the fallback. No mock data is involved.
  const learningPending =
    lmsCourses.isPending ||
    (owned.isPending && lmsItems.length === 0) ||
    (lmsCourses.isError && owned.isPending);
  const learningError = lmsCourses.isError && owned.isError;
  const resume = learningPending ? null : (programs[0] ?? null);

  const activePrograms = programs.filter((program) => program.status !== "expired").length;

  const validCertificates = certificates.data
    ? certificates.data.items.filter((certificate) => certificate.status !== "revoked")
    : null;
  const certificateCount = validCertificates ? validCertificates.length : null;
  const cpdHours = validCertificates
    ? validCertificates.reduce((sum, certificate) => sum + (certificate.cpd ? (certificate.cpd_hours ?? 0) : 0), 0)
    : null;

  const firstName = user?.full_name?.trim();
  const displayName = firstName && !firstName.includes("@") ? firstName.split(/\s+/)[0] : null;
  const hasLearning = programs.length > 0;
  const ownsNothing = owned.isSuccess && allProducts.length === 0 && !hasLearning;
  const subtitle = learningPending
    ? "تابع من حيث توقفت، أو اكتشف شيئاً جديداً."
    : hasLearning
      ? `لديك ${formatCount(programs.length, LEARNING_FORMS)} قيد التعلّم، وكل جديد بانتظارك.`
      : "ابدأ أول برنامج، وستجد تقدّمك هنا.";

  return (
    <div className="@container flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="m-0 text-2xl leading-[1.4] font-bold md:text-3xl">
          {displayName ? (
            <>
              أهلاً بعودتك، <bdi>{displayName}</bdi>
            </>
          ) : (
            "أهلاً بعودتك"
          )}
        </h1>
        <p className="m-0 max-w-[70ch] leading-7 text-fg-muted">{subtitle}</p>
      </header>

      {onboardingCompleted ? null : <CompleteProfileCard />}

      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        {learningPending ? (
          <Skeleton className="h-80 rounded-panel" />
        ) : (
          <ResumeLearningHero program={resume} />
        )}

        <LearningStatsPanel
          activePrograms={activePrograms}
          averageProgress={learningPending ? null : average}
          certificateCount={certificateCount}
          cpdHours={cpdHours}
          loading={learningPending || certificates.isPending}
        />

        <LearningListPanel
          programs={programs}
          source={programsResult.source}
          pending={learningPending}
          error={learningError}
          onRetry={() => {
            void lmsCourses.refetch();
            void owned.refetch();
          }}
        />

        <div className="flex min-w-0 flex-col gap-6">
          <InsightsSnapshotPanel />
          <NextConsultationPanel />
          <NotificationsPanel />
          <InviteFriendCard />
        </div>

        <div className="grid gap-6 @2xl:grid-cols-2 @4xl:col-span-2">
          <ExamsPanel />
          <LearningProgressPanel />
        </div>

        <section aria-labelledby="what-next-title" className="@4xl:col-span-2 flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 id="what-next-title" className="m-0 text-xl leading-8 font-bold">
                {ownsNothing ? "ابدأ رحلتك من هنا" : "ماذا تتعلّم بعد؟"}
              </h2>
              <p className="m-0 text-sm text-fg-muted">مقترحة لك بناءً على أهدافك ونشاطك.</p>
            </div>
            <ViewAllLink href={routes.search} label="تصفّح البرامج" />
          </div>
          <RecommendationGrid limit={6} compactLoader={!ownsNothing} />
        </section>
      </div>
    </div>
  );
}

export function DashboardHome() {
  const gate = useOnboardingGate();

  if (!gate.ready) {
    return (
      <div role="status" className="flex flex-col gap-8">
        <span className="sr-only">جارٍ تحميل لوحتك…</span>
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return <DashboardOverview onboardingCompleted={gate.completed} />;
}
