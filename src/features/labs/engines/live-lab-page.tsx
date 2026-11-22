"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { brandBg } from "@/components/ui/brand-colors";
import { useAuthStore } from "@/lib/auth/store";
import { cn } from "@/lib/cn";

import { claimAnonymousLabs } from "../api/anonymous";
import type { LiveLabRuntime, LiveScenarioSummary } from "../api/contract";
import { labErrorMessage } from "../api/errors";
import { liveLabQueries } from "../api/services/labs";
import { LabPanel } from "../components/bits";
import { renderLiveRunner } from "./registry";

function pickScenario(runtime: LiveLabRuntime): string | null {
  const scenarios = [...runtime.scenarios].sort((a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key));
  if (!scenarios.length) return null;
  if (runtime.definition.scenario_selection === "random") {
    const weighted = scenarios.filter((s) => s.weight > 0);
    const pool = weighted.length ? weighted : scenarios;
    const total = pool.reduce((sum, s) => sum + Math.max(s.weight, 1), 0);
    let roll = Math.random() * total;
    for (const scenario of pool) {
      roll -= Math.max(scenario.weight, 1);
      if (roll <= 0) return scenario.key;
    }
    return pool[pool.length - 1].key;
  }
  return scenarios[0].key;
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="ma-container py-16 text-center text-sm text-fg-muted" dir="rtl">
      {children}
    </div>
  );
}

function ScenarioPicker({ runtime, scenarios }: { runtime: LiveLabRuntime; scenarios: LiveScenarioSummary[] }) {
  const href = (key: string) => ({ pathname: `/labs/${encodeURIComponent(runtime.card.slug)}`, query: { scenario: key } });
  return (
    <div className="ma-container flex flex-col gap-6 py-8 md:py-12" dir="rtl">
      <header className={cn("flex flex-col gap-2 rounded-panel p-6 text-ink", brandBg[runtime.card.color] ?? "bg-surface-alt")}>
        <span className="text-[13px] font-semibold">{runtime.card.category_name}</span>
        <h1 className="m-0 text-2xl leading-10 font-bold md:text-3xl">{runtime.card.title}</h1>
        <p className="m-0 max-w-[62ch] text-sm leading-7">{runtime.card.tagline}</p>
      </header>
      <LabPanel title="اختر السيناريو" subtitle="المهارات والتقييم واحدة؛ يختلف القطاع والعميل والأرقام.">
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {scenarios.map((scenario) => (
            <li key={scenario.key}>
              <Link
                href={href(scenario.key)}
                className="flex h-full flex-col gap-1 rounded-panel border border-line bg-surface p-4 text-fg no-underline hover:border-accent focus-visible:ring-2 focus-visible:ring-focus/40"
              >
                <strong className="text-base">{scenario.title}</strong>
                <span className="text-[13px] text-fg-muted">ابدأ هذا السيناريو</span>
              </Link>
            </li>
          ))}
        </ul>
      </LabPanel>
    </div>
  );
}

/** `/labs/{slug}` in live mode: lab + scenario from the API, then the engine's runner. */
export function LiveLabPage({ slug }: { slug: string }) {
  const params = useSearchParams();
  const requested = params.get("scenario");
  const previewToken = params.get("preview");

  const signedIn = useAuthStore((state) => state.status) === "authenticated";
  useEffect(() => {
    if (signedIn) void claimAnonymousLabs();
  }, [signedIn]);

  // First load: the lab definition and its scenario list (no scenario content yet).
  const base = useQuery(liveLabQueries.detail(slug, requested, previewToken));
  const runtime = base.data;
  const needsPick = Boolean(runtime && !runtime.scenario && runtime.scenarios.length);
  const choose = runtime?.definition.scenario_selection === "choose" && (runtime?.scenarios.length ?? 0) > 1;
  const autoKey = useMemo(() => (runtime && needsPick && !choose ? pickScenario(runtime) : null), [runtime, needsPick, choose]);
  const picked = useQuery({ ...liveLabQueries.detail(slug, autoKey, previewToken), enabled: Boolean(autoKey) });

  if (base.isPending) return <Message>جارٍ تحميل المختبر…</Message>;
  if (base.isError || !runtime) return <Message>{labErrorMessage(base.error) || "تعذّر العثور على المختبر أو أنه غير منشور."}</Message>;
  if (needsPick && choose) return <ScenarioPicker runtime={runtime} scenarios={runtime.scenarios} />;
  const active = runtime.scenario ? runtime : picked.data;
  if (!active) {
    if (picked.isError) return <Message>{labErrorMessage(picked.error)}</Message>;
    return <Message>جارٍ تحضير السيناريو…</Message>;
  }
  const runner = renderLiveRunner({ runtime: active, previewToken });
  if (!runner) {
    return <Message>هذا السيناريو يحتاج محرّكًا لم يُفعَّل بعد في الواجهة ({active.engine}).</Message>;
  }
  return <>{runner}</>;
}
