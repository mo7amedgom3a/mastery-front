import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { DashboardPanel } from "@/features/student-dashboard/components/dashboard-panel";
import type { InsightsProfile } from "@/lib/api/insights";
import { formatNumber } from "@/lib/format";

import { levelLabel } from "../model/format";
import { PanelEmpty } from "./panel-states";

/** What the student told us in onboarding: the frame every other chart is read against. */
export function ProfilePanel({ profile }: { profile: InsightsProfile }) {
  const hasProfile = Boolean(profile.goal || profile.current_level || profile.target_skills.length);
  const facts = [
    { label: "المجال", value: profile.domain_name ?? profile.domain },
    { label: "المستوى", value: levelLabel(profile.current_level) },
    {
      label: "هدفك اليومي",
      value: profile.daily_study_minutes ? `${formatNumber(profile.daily_study_minutes)} دقيقة` : null,
    },
  ].filter((fact) => fact.value);

  return (
    <DashboardPanel
      id="insights-profile-title"
      title="ملفك التعليمي"
      subtitle="من إجاباتك في بداية رحلتك"
      action={
        <ButtonLink href={routes.studentProfile} variant="ghost" size="sm">
          تعديل
        </ButtonLink>
      }
    >
      {!hasProfile ? (
        <PanelEmpty
          action={
            <ButtonLink href={routes.studentOnboarding()} variant="primary" size="sm">
              أكمل ملفك
            </ButtonLink>
          }
        >
          أخبرنا بهدفك ومستواك لنقيس تقدّمك على ما يهمّك أنت.
        </PanelEmpty>
      ) : (
        <>
          {profile.goal ? <p className="m-0 text-base leading-7 font-semibold">«{profile.goal}»</p> : null}
          {facts.length ? (
            <dl className="m-0 grid grid-cols-3 gap-px overflow-hidden rounded-photo bg-line">
              {facts.map((fact) => (
                <div key={fact.label} className="flex min-w-0 flex-col gap-0.5 bg-surface p-3">
                  <dt className="text-xs text-fg-muted">{fact.label}</dt>
                  <dd className="m-0 truncate text-sm font-bold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {profile.target_skills.length ? (
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-sm font-bold">المهارات التي تستهدفها</h3>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {profile.target_skills.map((skill) => (
                  <li key={skill.skill_id} className="rounded-chip border border-line px-2.5 py-1 text-[13px]">
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </DashboardPanel>
  );
}
