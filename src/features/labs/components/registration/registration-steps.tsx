"use client";

import { Building, CircleCheck, CircleX, Landmark, Receipt, Send, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { money, partners } from "../../content/nuqta/company";
import {
  articlesDoc,
  articlesScore,
  legalForms,
  managementOptions,
  serviceRequirements,
  services,
  tradeNames,
} from "../../content/registration";
import { finishDays, summarize, type PortalState } from "../../model/portal-flow";
import { LabPanel, MeterBar, OptionCard, Stat } from "../bits";
import { DataTable } from "../workspace/data-table";
import { PortalWindow, StatusTimeline } from "../workspace/portal-window";
import { RedlineEditor } from "../workspace/redline-editor";

// ---------- 1. legal form ----------

export function LegalFormStep({ onDone }: { onDone: (form: string) => void }) {
  const [form, setForm] = useState<string | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <Users className="size-5 text-sky" aria-hidden /> جدول الملكية المتفق عليه
          </span>
        }
        subtitle="رأس المال 500,000 ر.س نقدًا. صندوق «رواد» يخطط للاستثمار بعد 12 شهرًا."
      >
        <DataTable head={["الشريك", "الدور", "الجنسية", "الحصة"]} rows={partners.map((p) => [p.name, p.role, p.nationality, `${p.share}%`])} />
      </LabPanel>
      <LabPanel
        title={
          <span className="inline-flex items-center gap-2">
            <Building className="size-5 text-accent" aria-hidden /> الشكل النظامي
          </span>
        }
        subtitle="الشكل يحدد المسؤولية، ومن يدخل الملكية، وكيف تستقبل المستثمرين."
      >
        <div role="radiogroup" aria-label="الشكل النظامي" className="flex flex-col gap-2">
          {legalForms.map((f) => (
            <OptionCard key={f.id} selected={form === f.id} onSelect={() => setForm(f.id)} title={f.label} detail={f.detail} />
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={!form} onClick={() => form && onDone(form)}>
            اعتمد الشكل وانتقل لعقد التأسيس
          </Button>
        </div>
      </LabPanel>
    </div>
  );
}

// ---------- 2. articles of association ----------

export function ArticlesStep({
  form,
  onRedline,
  onDone,
}: {
  form: string;
  onRedline: (clauseId: string, optionId: string) => void;
  onDone: (input: { tradeName: string; management: string; redlines: Record<string, string> }) => void;
}) {
  const [tradeName, setTradeName] = useState("");
  const [management, setManagement] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <LabPanel title="حجز الاسم التجاري" subtitle="الاسم يُفحص آليًا ضد الأسماء المحجوزة والألفاظ المنظمة.">
          <div role="radiogroup" aria-label="الاسم التجاري" className="flex flex-col gap-2">
            {tradeNames.map((t) => (
              <OptionCard key={t.id} selected={tradeName === t.id} onSelect={() => setTradeName(t.id)} title={t.label} />
            ))}
          </div>
        </LabPanel>
        <LabPanel title="إدارة الشركة" subtitle="من يدير ويمثل الشركة أمام الجهات؟">
          <div role="radiogroup" aria-label="الإدارة" className="flex flex-col gap-2">
            {managementOptions.map((m) => (
              <OptionCard key={m.id} selected={management === m.id} onSelect={() => setManagement(m.id)} title={m.label} />
            ))}
          </div>
        </LabPanel>
      </div>
      <RedlineEditor
        doc={() => articlesDoc({ form, tradeName, management })}
        fileName="عقد-تأسيس-نقطة-مسودة.pdf"
        gauge={(redlines) => (
          <LabPanel title="جاهزية العقد للرفع">
            <MeterBar label="الجاهزية" value={articlesScore({ form, tradeName, management }, redlines)} />
            <p className="m-0 text-[12px] leading-5 text-fg-muted">تتحسن مع اسم مقبول وإدارة واضحة وبنود متوازنة.</p>
          </LabPanel>
        )}
        cta="اعتمد العقد وادخل البوابة"
        disabled={!tradeName || !management}
        onChange={onRedline}
        onDone={(redlines) => onDone({ tradeName, management, redlines })}
      />
    </div>
  );
}

// ---------- 3. government portal ----------

export function PortalStep({
  state,
  crReturned,
  onSubmit,
  onFinish,
}: {
  state: PortalState;
  /** The commercial-register application has not been through its "returned" round yet. */
  crReturned: boolean;
  onSubmit: (id: string) => void;
  onFinish: () => void;
}) {
  const summary = summarize(services, state);
  const finish = finishDays(services, state);
  const lastLog = state.log.at(-1);
  const lastService = lastLog ? services.find((s) => s.id === lastLog.id) : null;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <PortalWindow url="business.sa/services/establish" agency="البوابة الموحدة للخدمات الحكومية (محاكاة)" service="تأسيس منشأة">
        {lastLog && lastService ? (
          <p
            role="status"
            className={cn(
              "m-0 inline-flex items-start gap-2 rounded-photo px-3 py-2 text-[13px] leading-6",
              lastLog.status === "approved" ? "bg-green/15" : "bg-pink/15",
            )}
          >
            {lastLog.status === "approved" ? <CircleCheck className="mt-1 size-4 shrink-0 text-green" aria-hidden /> : <CircleX className="mt-1 size-4 shrink-0 text-pink" aria-hidden />}
            {lastLog.status === "approved"
              ? `اعتُمد «${lastService.label}»: ${lastService.output}`
              : `رُفض «${lastService.label}»: ${lastService.rejection} (+2 يوم)`}
          </p>
        ) : (
          <p className="m-0 text-[13px] leading-6 text-fg-muted">قدّم الطلبات بالترتيب الذي تراه. الطلب المقدَّم قبل متطلباته يُرفض ويضيف يومين.</p>
        )}
        <div className="grid gap-2 md:grid-cols-2">
          {services.map((service) => {
            const done = state.approved.includes(service.id);
            const rejected = state.log.filter((l) => l.id === service.id && l.status === "rejected").length;
            return (
              <div
                key={service.id}
                className={cn("flex flex-col gap-2 rounded-photo border p-3", done ? "border-green bg-green/5" : "border-line")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[12px] text-fg-muted">{service.agency}</span>
                    <span className="text-sm leading-6 font-semibold">{service.label}</span>
                  </span>
                  {!service.required ? <span className="shrink-0 rounded-chip bg-surface-alt px-2 py-0.5 text-[11px] font-semibold">اختياري</span> : null}
                </div>
                <span className="text-[12px] leading-5 text-fg-muted">
                  {service.days} أيام عمل · {service.fee ? money(service.fee) : "بلا رسوم"}
                  {rejected ? ` · رُفض ${rejected}×` : ""}
                </span>
                <Button
                  size="sm"
                  variant={done ? "ghost" : "secondary"}
                  disabled={done}
                  onClick={() => onSubmit(service.id)}
                  className="self-start"
                >
                  {done ? `مكتمل · يوم ${finish[service.id]}` : (
                    <span className="inline-flex items-center gap-1.5">
                      <Send className="size-3.5" aria-hidden /> قدّم الطلب
                    </span>
                  )}
                </Button>
                {!done ? <span className="text-[11px] leading-4 text-fg-muted">{serviceRequirements(service)}</span> : null}
              </div>
            );
          })}
        </div>
        {crReturned ? null : (
          <p className="m-0 text-[12px] text-fg-muted">ملاحظة: طلبات السجل تُراجع يدويًا وقد تعود بملاحظة.</p>
        )}
      </PortalWindow>
      <aside className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="أيام حتى التشغيل" value={summary.days} />
          <Stat label="الرسوم" value={money(summary.fees)} />
          <Stat label="مرفوض" value={summary.rejections} tone={summary.rejections ? "bad" : "good"} />
          <Stat label="إلزامي متبقٍ" value={summary.missingRequired.length} tone={summary.missingRequired.length ? "bad" : "good"} />
        </div>
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <Landmark className="size-5 text-accent" aria-hidden /> سجل الطلبات
            </span>
          }
        >
          {state.log.length ? (
            <StatusTimeline
              items={state.log.map((entry, index) => {
                const s = services.find((x) => x.id === entry.id);
                return {
                  id: `${entry.id}-${index}`,
                  label: s?.label ?? entry.id,
                  status: entry.status === "approved" ? "done" : "rejected",
                  detail: entry.status === "rejected" ? `ينقص: ${entry.missing.map((m) => services.find((x) => x.id === m)?.label).join("، ")}` : s?.agency,
                };
              })}
            />
          ) : (
            <p className="m-0 text-[13px] text-fg-muted">لم تقدّم أي طلب بعد.</p>
          )}
        </LabPanel>
        <LabPanel
          title={
            <span className="inline-flex items-center gap-2">
              <Receipt className="size-5 text-accent" aria-hidden /> ملخص
            </span>
          }
          subtitle={summary.missingRequired.length ? "يمكنك الإنهاء الآن، لكن الخدمات الإلزامية الناقصة تُحسب فجوات امتثال." : "كل الخدمات الإلزامية مكتملة."}
        >
          <Button size="lg" block disabled={!state.approved.includes("cr")} onClick={onFinish}>
            أنهِ التأسيس وأصدر الملف
          </Button>
        </LabPanel>
      </aside>
    </div>
  );
}
