import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { formatNumber } from "@/lib/format";

import { DashboardPanel } from "./dashboard-panel";
import { StatGrid } from "./stat-grid";

type LearningStatsPanelProps = {
  activePrograms: number;
  averageProgress: number | null;
  certificateCount: number | null;
  cpdHours: number | null;
  loading?: boolean;
};

/** The demo's «تعلّمك حتى الآن» figures: three real counts and CPD hours from certificates. */
export function LearningStatsPanel({
  activePrograms,
  averageProgress,
  certificateCount,
  cpdHours,
  loading,
}: LearningStatsPanelProps) {
  const number = (value: number | null) => (loading || value === null ? "—" : formatNumber(value));

  return (
    <DashboardPanel
      id="learning-stats-title"
      title="تعلّمك حتى الآن"
      action={
        <AppLink href={routes.studentCertificates} className="ma-btn ma-btn--ghost ma-btn--sm">
          عرض شهاداتي
        </AppLink>
      }
    >
      <StatGrid
        className="my-auto"
        stats={[
          { label: "برامج فعّالة", value: number(activePrograms) },
          { label: "متوسط التقدّم", value: averageProgress === null ? "—" : `${formatNumber(averageProgress)}%` },
          { label: "شهادات ماستري", value: number(certificateCount) },
          { label: "ساعة CPD معتمدة", value: number(cpdHours) },
        ]}
      />
    </DashboardPanel>
  );
}
