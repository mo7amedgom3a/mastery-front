"use client";

import { FlaskConical, RotateCcw } from "lucide-react";

import { brandBg } from "@/components/ui/brand-colors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { comingSoonLabs, labs } from "../model/catalog";
import { useLabsProgress } from "../model/progress-store";
import type { LabDefinition } from "../model/types";
import { LabPanel, Pill } from "./bits";
import { BadgeGrid, LabCard, LabStatTiles, SkillRadar, useLabsSnapshot } from "./labs-progress";

/** Live labs grouped by catalog category, in catalog order. */
const groups = labs.reduce<{ name: string; labs: LabDefinition[] }[]>((acc, lab) => {
  const group = acc.find((g) => g.name === lab.categoryName);
  if (group) group.labs.push(lab);
  else acc.push({ name: lab.categoryName, labs: [lab] });
  return acc;
}, []);

/** The labs hub: live labs by catalog category, coming-soon categories, XP, badges and skill profile. */
export function LabsHub() {
  const snapshot = useLabsSnapshot();
  const reset = useLabsProgress((s) => s.reset);

  return (
    <div className="ma-container flex flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-[13px] font-bold text-ink">
          <FlaskConical className="size-4" aria-hidden /> تجريبي · تعلّم بالممارسة
        </span>
        <h1 className="m-0 max-w-[24ch] text-3xl leading-[1.35] font-bold md:text-5xl">المختبرات العملية</h1>
        <p className="m-0 max-w-[62ch] text-lg leading-8 text-fg-muted">
          لا فيديوهات هنا. ادخل بيئة عمل محاكاة، حقق أهدافًا حقيقية بالأرقام، وتعامل مع عملاء وزملاء يتفاعلون مع قراراتك. في النهاية يقيّم المراقب أداءك على كل مهارة.
        </p>
      </header>

      <LabStatTiles snapshot={snapshot} />

      <section aria-labelledby="labs-live" className="flex flex-col gap-6">
        <h2 id="labs-live" className="m-0 text-xl font-bold">
          مختبرات متاحة الآن
        </h2>
        {groups.map((group) => (
          <div key={group.name} className="flex flex-col gap-3">
            <h3 className="m-0 flex items-center gap-2 text-base font-bold text-fg-muted">
              {group.name}
              <span className="rounded-chip bg-surface-alt px-2 py-0.5 text-[12px] tabular-nums">{group.labs.length}</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.labs.map((lab) => (
                <LabCard key={lab.slug} lab={lab} attempts={snapshot.attempts} headingLevel="h4" />
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <LabPanel title="ملفك المهاري" subtitle="أفضل أداء لك في كل مختبر، موزعًا على المهارات">
          <SkillRadar attempts={snapshot.attempts} />
        </LabPanel>
        <LabPanel
          title="الشارات"
          action={
            snapshot.attempts.length ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="size-4" aria-hidden /> إعادة الضبط
              </Button>
            ) : null
          }
        >
          <BadgeGrid badges={snapshot.badges} />
        </LabPanel>
      </div>

      <section aria-labelledby="labs-soon" className="flex flex-col gap-4">
        <h2 id="labs-soon" className="m-0 text-xl font-bold">
          قريبًا في أقسام أخرى
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoonLabs.map((lab) => (
            <article key={lab.categoryLegacyId} className="flex flex-col gap-2 rounded-panel border border-dashed border-line bg-surface p-5">
              <span className="flex items-center justify-between gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-bold text-ink", brandBg[lab.color])}>{lab.categoryName}</span>
                <Pill>قريبًا</Pill>
              </span>
              <h3 className="m-0 text-base font-bold">{lab.title}</h3>
              <p className="m-0 text-[13px] leading-6 text-fg-muted">{lab.tagline}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
