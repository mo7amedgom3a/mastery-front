import { cn } from "@/lib/cn";

type SegmentedProgressProps = {
  value: number;
  segments?: number;
  /** Accessible name for the progress bar. */
  label: string;
  className?: string;
};

/** The demo's hero progress: 20 equal segments filled from the start. */
export function SegmentedProgress({ value, segments = 20, label, className }: SegmentedProgressProps) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const filled = Math.round((safe / 100) * segments);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("min-w-0", className)}
    >
      <div
        aria-hidden="true"
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={index}
            className={cn("h-3.5 rounded-[4px]", index < filled ? "bg-ink" : "bg-ink/15")}
          />
        ))}
      </div>
    </div>
  );
}
