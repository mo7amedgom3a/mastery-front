"use client";

import { describedBy } from "@/features/auth/components/field";
import { ChoiceChip } from "@/features/onboarding/components/choice-chip";
import { cn } from "@/lib/cn";

import { MARKETING_PLATFORMS, type PlatformKey } from "../model/platforms";

export type PlatformAnswers = Partial<Record<PlatformKey, { has: boolean; url: string }>>;

/** One yes/no question per platform; "yes" opens a field for the account link. */
export function PlatformLinks({
  baseId,
  value,
  errors,
  onChange,
}: {
  baseId: string;
  value: PlatformAnswers;
  errors: Partial<Record<PlatformKey, string>>;
  onChange: (next: PlatformAnswers) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MARKETING_PLATFORMS.map((platform) => {
        const answer = value[platform.key];
        const id = `${baseId}-link-${platform.key}`;
        const error = errors[platform.key];
        const set = (patch: Partial<{ has: boolean; url: string }>) =>
          onChange({ ...value, [platform.key]: { has: answer?.has ?? false, url: answer?.url ?? "", ...patch } });
        return (
          <div
            key={platform.key}
            className={cn(
              "flex flex-col gap-3 rounded-ctl border bg-surface p-4 transition-colors",
              answer?.has ? "border-accent/40" : "border-line",
              error && "border-pink",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-fg" id={`${id}-q`}>{platform.question}</span>
              <div className="flex shrink-0 items-center gap-2" role="group" aria-labelledby={`${id}-q`}>
                <ChoiceChip selected={answer?.has === true} onToggle={() => set({ has: true })}>نعم</ChoiceChip>
                <ChoiceChip selected={!answer?.has} onToggle={() => set({ has: false })}>لا</ChoiceChip>
              </div>
            </div>
            {answer?.has ? (
              <div className={cn("ma-field", error && "is-error")}>
                <label htmlFor={id} className="ma-label">
                  رابط {platform.label}<span className="ms-1 text-pink" aria-label="مطلوب">*</span>
                </label>
                <input
                  id={id}
                  type="url"
                  dir="ltr"
                  inputMode="url"
                  autoComplete="url"
                  required
                  value={answer.url}
                  onChange={(event) => set({ url: event.target.value })}
                  placeholder={platform.example}
                  {...describedBy(id, error)}
                  className="ma-input text-start"
                />
                {error ? <p id={`${id}-error`} className="ma-help m-0">{error}</p> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
