"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Direction for a short value: "1 / 5" or "42.86$" has no strong characters, so `dir="auto"` falls
 * back to RTL and flips it; force LTR unless the value contains Arabic text.
 */
export function valueDir(value: ReactNode): "ltr" | undefined {
  if (typeof value === "number") return "ltr";
  if (typeof value === "string") return /[\u0600-\u06FF]/.test(value.replace(/٪/g, "")) ? undefined : "ltr";
  return undefined;
}

/** A bordered panel used by every lab surface. */
export function LabPanel({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-panel border border-line bg-surface p-5 md:p-6", className)}>
      {title || action ? (
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? <h2 className="m-0 text-[17px] leading-7 font-bold">{title}</h2> : null}
            {subtitle ? <p className="m-0 text-[13px] leading-5 text-fg-muted">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** A labelled 0–100 meter; `invert` paints high values as bad (tension). */
export function MeterBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const good = invert ? v <= 40 : v >= 60;
  const bad = invert ? v >= 70 : v <= 30;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[13px] leading-5 text-fg-muted">
        <span>{label}</span>
        <span className="font-semibold text-fg tabular-nums">{v}٪</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", good ? "bg-green" : bad ? "bg-pink" : "bg-yellow")}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

/** A selectable card (radio or checkbox semantics via `role`). */
export function OptionCard({
  selected,
  onSelect,
  title,
  detail,
  multi = false,
  disabled,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  detail?: ReactNode;
  multi?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-photo border p-3 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-line-strong",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center border",
          multi ? "rounded-[4px]" : "rounded-full",
          selected ? "border-accent bg-accent text-on-accent" : "border-line-strong",
        )}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm leading-6 font-semibold">{title}</span>
        {detail ? <span className="text-[13px] leading-5 text-fg-muted">{detail}</span> : null}
      </span>
    </button>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "good" | "bad" }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-photo border border-line bg-surface-alt/40 p-3">
      <span className="text-[12px] leading-5 text-fg-muted">{label}</span>
      <span dir={valueDir(value)} className={cn("text-xl leading-7 font-bold tabular-nums", valueDir(value) && "text-end", tone === "good" && "text-green", tone === "bad" && "text-pink")}>
        {value}
      </span>
      {hint ? <span className="text-[12px] leading-5 text-fg-muted">{hint}</span> : null}
    </div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-chip bg-surface-alt px-2 py-0.5 text-[12px] leading-5 font-semibold", className)}>
      {children}
    </span>
  );
}
