"use client";

import { Building2, Eye, FileText, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ObjectionScenario } from "../../content/objections/types";
import { LabPanel, Pill, Stat } from "../bits";

/** The account file the learner reads before the first objection: context, notes and tells. */
export function DossierCard({ scenario, onStart }: { scenario: ObjectionScenario; onStart: () => void }) {
  const { dossier } = scenario;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <FileText className="size-5 text-accent" aria-hidden /> ملف الحساب
          </span>
        }
        subtitle={`${scenario.seller} · ${dossier.company}`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="القطاع" value={dossier.industry} />
          <Stat label="الحجم" value={dossier.size} />
          <Stat label="النظام الحالي" value={dossier.current} />
          <Stat label="الميزانية" value={dossier.budget} />
          <Stat label="الموعد" value={dossier.timeline} />
          <Stat label="جهة الاتصال" value={scenario.contact.name} hint={scenario.contact.role} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="m-0 inline-flex items-center gap-2 text-sm font-bold">
            <Building2 className="size-4 text-sky" aria-hidden /> ملاحظات الفريق
          </h3>
          <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-sm leading-6 text-fg-muted">
            {dossier.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        {scenario.mechanic === "classify" ? (
          <p className="m-0 rounded-photo bg-surface-alt p-3 text-[13px] leading-6 text-fg-muted">
            هذا المختبر يغطي أربعة أنواع من الاعتراضات. النوعان الآخران — الرضا عن المنافس وعدم الاحتياج —
            في مختبرَي «المسطرة» و«أسبوع فشل المبيعات».
          </p>
        ) : null}
      </LabPanel>

      <aside className="flex flex-col gap-4">
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <Eye className="size-5 text-purple" aria-hidden /> إشارات لغة الجسد
            </span>
          }
          subtitle="ما ستراه أثناء الحوار"
        >
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {dossier.signals.map((signal) => (
              <li key={signal} className="rounded-photo border border-line px-3 py-2 text-[13px] leading-5">
                {signal}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Pill>
              <Target className="size-3.5" aria-hidden /> {scenario.mechanic === "classify" ? "4 جولات" : "5 خطوات"}
            </Pill>
            <Pill>{scenario.mechanic === "classify" ? "صنّف ثم جسر ثم رد" : "مسطرة المنافس"}</Pill>
          </div>
        </LabPanel>
        <LabPanel title="قاعدة اللعبة">
          <p className="m-0 text-sm leading-7 text-fg-muted">
            كل خيار صحيح يرفع الثقة ويخفض التوتر، وكل خيار متسرّع يترك أثرًا في التقييم. لا يوجد «رجوع»،
            لكن يوجد تعلّم: ستشرح لك البطاقات سبب كل إجابة.
          </p>
          <Button block onClick={onStart}>
            ابدأ الحوار
          </Button>
        </LabPanel>
      </aside>
    </div>
  );
}
