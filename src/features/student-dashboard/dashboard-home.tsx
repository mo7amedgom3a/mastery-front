"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, Sparkles, UserRoundPen } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { isOnboardingSkipped } from "@/features/onboarding/model/skip";
import { commerceQueries } from "@/lib/api/commerce";
import { customerQueries } from "@/lib/api/customers";
import { useAuthStore } from "@/lib/auth/store";

import { DashboardSection } from "./components/dashboard-section";
import { LearningCard } from "./components/learning-card";
import { RecommendationGrid } from "./components/recommendation-grid";
import { TypeFilter } from "./components/type-filter";
import { countByType } from "./model/products";
import { useCatalogArtwork } from "./model/use-artwork";

const noSubscription = () => () => undefined;

/** Cards shown under «كمّل التعلّم»; the rest are on the تعلّمي page. */
const CONTINUE_LIMIT = 6;

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

export function DashboardHome() {
  const user = useAuthStore((state) => state.user);
  const gate = useOnboardingGate();
  const [type, setType] = useState<string | null>(null);
  // All of them (the API caps at 100), so the type chips count everything, not just the first page.
  const owned = useQuery(commerceQueries.ownedProducts({ status: "active", limit: 100 }));
  const allProducts = owned.data?.items ?? [];
  const counts = countByType(allProducts, (product) => product.product_type);
  const selected = type && counts.some((count) => count.type === type) ? type : null;
  const products = (selected ? allProducts.filter((product) => product.product_type === selected) : allProducts).slice(
    0,
    CONTINUE_LIMIT,
  );
  const artwork = useCatalogArtwork(products.map((product) => product.slug));

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

  const name = user?.full_name?.trim();
  const named = Boolean(name);
  const ownsNothing = owned.isSuccess && allProducts.length === 0;

  const continueLearning = (
    <DashboardSection
      id="continue-learning-title"
      icon={BookOpenCheck}
      title="كمّل التعلّم"
      subtitle="تابع من حيث توقفت."
      viewAll={
        allProducts.length > 0
          ? {
              href: selected ? (`${routes.studentAccess}?type=${encodeURIComponent(selected)}` as Route) : routes.studentAccess,
            }
          : undefined
      }
    >
      <TypeFilter counts={counts} total={allProducts.length} value={selected} onChange={setType} />
      {owned.isPending ? (
        <div role="status" className="grid gap-5 @xl:grid-cols-2 @4xl:grid-cols-3">
          <span className="sr-only">جارٍ التحميل…</span>
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : products.length > 0 ? (
        <ul className="m-0 grid list-none gap-5 p-0 @xl:grid-cols-2 @4xl:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.product_id}>
              <LearningCard
                product={product}
                index={index}
                image={artwork.get(product.slug)?.image}
                fallbackTitle={artwork.get(product.slug)?.title}
                instructor={artwork.get(product.slug)?.instructor}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 rounded-panel border border-line p-5 text-fg-muted">تعذّر تحميل برامجك الآن.</p>
      )}
    </DashboardSection>
  );

  const whatNext = (
    <DashboardSection
      id="what-next-title"
      icon={Sparkles}
      title={ownsNothing ? "ابدأ رحلتك من هنا" : "ماذا تتعلّم بعد؟"}
      subtitle="مقترحة لك بناءً على أهدافك ونشاطك."
      viewAll={{ href: routes.search, label: "تصفّح البرامج" }}
    >
      <RecommendationGrid limit={ownsNothing ? 6 : 3} compactLoader={!ownsNothing} />
    </DashboardSection>
  );

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 text-3xl leading-[1.4] font-bold md:text-4xl">
          {named ? (
            <>
              أهلاً بعودتك، <bdi>{name}</bdi>
            </>
          ) : (
            "أهلاً بك"
          )}
        </h1>
        <p className="m-0 leading-7 text-fg-muted">تابع من حيث توقفت، أو اكتشف شيئاً جديداً.</p>
      </header>

      {gate.completed ? null : <CompleteProfileCard />}

      {/* Nothing bought yet: the suggestions are the whole story. */}
      {ownsNothing ? null : continueLearning}
      {whatNext}
    </div>
  );
}
