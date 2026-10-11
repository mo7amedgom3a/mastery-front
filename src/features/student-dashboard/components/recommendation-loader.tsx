"use client";

import { Check, Filter, ListOrdered, Sparkles, Target, UserRoundCog, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type Stage = { icon: LucideIcon; label: string };

const STAGES: readonly Stage[] = [
  { icon: Target, label: "نحلّل أهدافك والمهارات التي تريد اكتسابها" },
  { icon: UserRoundCog, label: "نبني ملفك التعليمي المخصّص" },
  { icon: Filter, label: "نطابق مهاراتك مع البرامج ونصفّي النتائج" },
  { icon: ListOrdered, label: "نرتّب الاقتراحات حسب ما يناسبك" },
  { icon: Sparkles, label: "نجهّز نقطة البداية المناسبة لك" },
];

/** Time on each stage. The last one stays active until the answer arrives. */
const STAGE_MS = 1600;

/**
 * What the visitor sees while personalised recommendations are worked out (they can take several
 * seconds): the stages of the work ticking off, and a bar that keeps creeping forward without ever
 * claiming to be done. `compact` drops the stage list to its current line, for the dashboard.
 */
export function RecommendationLoader({ compact = false }: { compact?: boolean }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGES.length - 1) return;
    const timer = window.setTimeout(() => setStage((value) => value + 1), STAGE_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);

  // Eases toward 92%: it slows down near the end instead of stalling at a fake 100%.
  const percent = 92 * (1 - Math.exp(-(stage + 1) / 2.2));
  const current = STAGES[stage];
  const Icon = current.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-5 rounded-panel border border-line bg-surface",
        compact ? "p-5" : "mx-auto w-full max-w-2xl p-6 md:p-8",
      )}
    >
      <div className="flex items-center gap-4">
        <motion.span
          aria-hidden="true"
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-ink"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={stage}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              className="grid place-items-center"
            >
              <Icon className="size-6 fill-none" />
            </motion.span>
          </AnimatePresence>
        </motion.span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-fg-muted">نجهّز اقتراحاتك…</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-bold"
            >
              {current.label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div aria-hidden="true" className="relative h-2 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: "4%" }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 40, damping: 18 }}
        />
        {/* A soft sheen sliding across, so the bar reads as "working" between stages. */}
        <motion.div
          className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-l from-transparent via-white/40 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "400%" }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {compact ? null : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {STAGES.map((item, index) => {
            const done = index < stage;
            const active = index === stage;
            return (
              <motion.li
                key={item.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: done || active ? 1 : 0.45, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-3 text-[15px]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                    done ? "border-accent bg-accent text-ink" : active ? "border-fg" : "border-line-strong",
                  )}
                >
                  {done ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid place-items-center">
                      <Check className="size-3.5 fill-none" strokeWidth={3} />
                    </motion.span>
                  ) : active ? (
                    <motion.span
                      className="size-2 rounded-full bg-fg"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ) : null}
                </span>
                <span className={cn(active && "font-bold")}>{item.label}</span>
              </motion.li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
