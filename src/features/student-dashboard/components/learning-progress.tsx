import { formatDate } from "@/lib/format";

type LearningProgressProps = {
  /** The LMS percentage; null until the learner has started. */
  percent?: number | null;
  lastActivity?: string | null;
};

export function LearningProgress({ percent, lastActivity }: LearningProgressProps) {
  if (percent == null) return null;
  return (
    <div className="ma-progress">
      <div className="ma-progress__row">
        <span>{lastActivity ? `آخر نشاط ${formatDate(lastActivity)}` : "تقدّمك"}</span>
        <span>{percent}%</span>
      </div>
      <div
        className="ma-progress__track"
        role="progressbar"
        aria-label="تقدّمك في البرنامج"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="ma-progress__bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
