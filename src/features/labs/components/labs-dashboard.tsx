"use client";

import { FlaskConical } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import { DashboardSection } from "@/features/student-dashboard/components/dashboard-section";
import { cn } from "@/lib/cn";

import { BadgeTags, LabCard, LabStatTiles, SkillRadar, suggestedLabs, useLabsSnapshot } from "./labs-progress";

const SUGGESTED = 3;

/**
 * Skill profile and badge tags from the practice labs. Sits under «قيد التعلّم» in the dashboard
 * and grows (`className="flex-1"`) to fill the column beside the taller side panels.
 */
export function LabsSkillPanel({ className }: { className?: string }) {
  const snapshot = useLabsSnapshot();
  const started = snapshot.attempts.length > 0;
  return (
    <DashboardPanel
      id="labs-skills-title"
      title="ملفك المهاري"
      subtitle="أفضل أداء لك في المختبرات العملية، موزعًا على المهارات"
      action={
        <AppLink href={routes.labs} className="ma-btn ma-btn--ghost ma-btn--sm">
          المختبرات
        </AppLink>
      }
      className={className}
    >
      <div className="@container flex flex-1 flex-col">
        <div className="grid flex-1 items-center gap-5 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SkillRadar attempts={snapshot.attempts} className="max-w-xs" />
          <div className="flex min-w-0 flex-col gap-3">
            <h3 className="m-0 text-sm font-bold">الشارات</h3>
            <p className="m-0 text-[13px] leading-5 text-fg-muted">
              {started ? "شارات حصلت عليها في المختبرات" : "أكمل المختبرات لتحصل على شارات تظهر هنا"}
            </p>
            <BadgeTags badges={snapshot.badges} />
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

/**
 * The dashboard's practice-labs block: XP, completed labs and badge count, then scenarios to start
 * (untried labs first, then the weakest scores to improve).
 */
export function LabsDashboardSection({ className }: { className?: string }) {
  const snapshot = useLabsSnapshot();
  const started = snapshot.attempts.length > 0;
  const suggestions = suggestedLabs(snapshot.attempts, SUGGESTED);

  return (
    <div className={cn(className)}>
      <DashboardSection
        id="labs-dashboard-title"
        icon={FlaskConical}
        title="ابدأ التعلّم بالسيناريوهات"
        subtitle="مختبرات عملية تحاكي مواقف عمل حقيقية: قرّر، تفاوض، وحقق أهدافًا بالأرقام، ثم احصل على تقييم مفصّل."
        viewAll={{ href: routes.labs, label: "كل المختبرات" }}
      >
        <LabStatTiles snapshot={snapshot} showAttempts={false} />
        <div className="flex flex-col gap-3">
          <h3 className="m-0 text-base font-bold">{started ? "سيناريوهات مقترحة لك" : "ابدأ بأحد هذه السيناريوهات"}</h3>
          <ul className="m-0 grid list-none gap-5 p-0 @xl:grid-cols-2 @4xl:grid-cols-3">
            {suggestions.map((lab) => (
              <li key={lab.slug}>
                <LabCard lab={lab} attempts={snapshot.attempts} headingLevel="h4" />
              </li>
            ))}
          </ul>
        </div>
      </DashboardSection>
    </div>
  );
}
