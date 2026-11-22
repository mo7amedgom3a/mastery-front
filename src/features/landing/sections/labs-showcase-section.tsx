import { ArrowLeft, Check, Clock, FlaskConical, LineChart, Lock, Megaphone, PlayCircle, ShieldAlert, X } from "lucide-react";

import { CountUp } from "@/components/motion/count-up";
import { Marquee } from "@/components/motion/marquee";
import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/routes";
import { journey } from "@/features/labs/content/nuqta/company";
import { findLab, labs } from "@/features/labs/model/catalog";
import { skillLabels, type LabDefinition } from "@/features/labs/model/types";
import { cn } from "@/lib/cn";

import { LabsDemoConsole } from "../components/labs-demo-console";
import { comparisonRows, demoLab, labMoments, type LabMomentIcon } from "../content/labs-showcase";

const momentIcons: Record<LabMomentIcon, typeof Megaphone> = {
  megaphone: Megaphone,
  chart: LineChart,
  shield: ShieldAlert,
  lock: Lock,
};

const EDGE_FADE =
  "[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] max-sm:[mask-image:linear-gradient(to_right,transparent,#000_4%,#000_96%,transparent)]";

function LabCard({ lab }: { lab: LabDefinition }) {
  return (
    <AppLink
      href={routes.lab(lab.slug)}
      className="group flex h-full w-72 flex-col gap-3 rounded-panel border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:w-80"
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold text-ink", brandBg[lab.color])}>{lab.categoryName}</span>
        <span className="inline-flex items-center gap-1 text-xs text-fg-muted tabular-nums">
          <Clock aria-hidden="true" className="size-3.5" />
          {lab.minutes} د · {lab.difficulty}
        </span>
      </span>
      <span className="text-base font-bold leading-snug">{lab.title}</span>
      <span className="text-sm leading-6 text-fg-muted">{lab.tagline}</span>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        ادخل المختبر
        <ArrowLeft aria-hidden="true" className="ma-icon-dir size-4 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none" />
      </span>
    </AppLink>
  );
}

/**
 * Landing «المختبرات العملية»: proves Mastery is learning by doing, not watching. A playable slice of
 * the support lab (client), what the other labs make you do, video-vs-lab, live numbers from the
 * lab catalogue, the six-lab «نقطة» company journey and a rail of every other lab. Server-rendered
 * apart from the console and the counters.
 */
export function LabsShowcaseSection() {
  const fields = new Set(labs.map((lab) => lab.categoryName)).size;
  const avgMinutes = Math.round(labs.reduce((sum, lab) => sum + lab.minutes, 0) / Math.max(1, labs.length));
  const stats = [
    { value: labs.length, label: "مختبرًا تفاعليًا جاهزًا الآن" },
    { value: fields, label: "مجالات عمل حقيقية" },
    { value: Object.keys(skillLabels).length, label: "مهارات يقيسها المراقب" },
    { value: avgMinutes, label: "دقيقة في المتوسط لكل مختبر" },
  ];

  const journeySlugs = new Set<string>(journey.map((step) => step.slug));
  const journeyLabs = journey.map((step) => ({ step, lab: findLab(step.slug) })).filter((item) => item.lab);
  const railLabs = labs.filter((lab) => !journeySlugs.has(lab.slug) && lab.slug !== demoLab.slug);

  return (
    <section id="labs" aria-labelledby="labs-title" data-landing-surface="base" className="ma-section cv-auto overflow-hidden">
      <div className="ma-container">
        <SectionHeader
          id="labs-title"
          label="المختبرات العملية · تعلّم بالممارسة"
          title="لا تكتفِ بالمشاهدة. ادخل الموقف واتخذ القرار."
          lead="سيناريوهات كاملة من بيئات عمل حقيقية: أرقام فعلية، وعملاء وزملاء ومستثمرون يتفاعلون مع كل قرار، ومراقب يقيّم أداءك فورًا. جرّب بنفسك الآن، هنا في الصفحة."
        />

        {/* 1. The playable teaser + what the other labs make you do. */}
        <div className="mt-12 grid items-start gap-8 short:mt-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <LabsDemoConsole />

          <div className="flex flex-col gap-4">
            <p className="m-0 inline-flex items-center gap-2 text-sm font-bold text-fg-muted">
              <PlayCircle aria-hidden="true" className="size-4 text-accent" />
              وفي المختبرات الأخرى ستفعل هذا بنفسك:
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {labMoments.map((moment) => {
                const lab = findLab(moment.slug);
                const Icon = momentIcons[moment.icon];
                if (!lab) return null;
                return (
                  <li key={moment.slug}>
                    <AppLink
                      href={routes.lab(lab.slug)}
                      className="group flex items-start gap-3 rounded-panel border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                    >
                      <span className={cn("grid size-10 shrink-0 place-content-center rounded-ctl text-ink", brandBg[lab.color])}>
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-bold leading-6">{moment.text}</span>
                        <span className="text-xs text-fg-muted">
                          {lab.title} · {lab.minutes} دقيقة
                        </span>
                      </span>
                    </AppLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 2. Video course vs Mastery lab. */}
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          <div className="rounded-panel border border-line p-6">
            <p className="m-0 text-sm font-bold text-fg-muted">دورة فيديو تقليدية</p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {comparisonRows.map((row) => (
                <li key={row.video} className="flex items-start gap-2.5 text-sm leading-6 text-fg-muted">
                  <X aria-hidden="true" className="mt-1 size-4 shrink-0 opacity-60" />
                  {row.video}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-panel border-2 border-accent bg-surface p-6">
            <span className="absolute -top-3 start-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-ink">
              <FlaskConical aria-hidden="true" className="size-3.5" />
              مختبر ماستري
            </span>
            <p className="m-0 text-sm font-bold">تجربة عمل كاملة، لا مشاهدة فقط</p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {comparisonRows.map((row) => (
                <li key={row.lab} className="flex items-start gap-2.5 text-sm leading-6 font-medium">
                  <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-green" />
                  {row.lab}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Live numbers from the lab catalogue. */}
        <dl className="m-0 mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-surface-alt p-5 md:p-6">
              <dt className="order-2 text-sm text-fg-muted">{stat.label}</dt>
              <dd className="order-1 m-0 t-poster text-[clamp(2.75rem,6vw,4.5rem)] leading-none text-accent">
                <CountUp value={stat.value} />
              </dd>
            </div>
          ))}
        </dl>

        {/* 4. One company, six labs: the «نقطة» journey. */}
        <div className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-[60ch] flex-col gap-2">
              <h3 className="m-0 text-xl font-bold md:text-2xl">شركة واحدة، ست مختبرات، رحلة كاملة</h3>
              <p className="m-0 text-sm leading-6 text-fg-muted">
                تابع «نقطة»، شركة تقنية ناشئة في الرياض، من السجل التجاري إلى غرفة التدقيق قبل الاستحواذ. كل مختبر قصة مستقلة، ومعًا تعيش حياة شركة كاملة.
              </p>
            </div>
            <AppLink href={routes.lab(journey[0].slug)} className="ma-link inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
              ابدأ من الخطوة الأولى
              <ArrowLeft aria-hidden="true" className="ma-icon-dir size-4" />
            </AppLink>
          </div>
          <ol className="m-0 mt-6 flex snap-x list-none gap-3 overflow-x-auto p-0 pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible">
            {journeyLabs.map(({ step, lab }) =>
              lab ? (
                <li key={step.slug} className="relative w-56 shrink-0 snap-start lg:w-auto">
                  <AppLink
                    href={routes.lab(lab.slug)}
                    className="group flex h-full flex-col gap-3 rounded-panel border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("grid size-9 shrink-0 place-content-center rounded-full text-sm font-bold text-ink", brandBg[lab.color])}>
                        {step.step}
                      </span>
                      <span className="text-sm font-bold">{step.short}</span>
                    </span>
                    <span className="text-sm leading-6 text-fg-muted">{lab.title.replace(/^رحلة نقطة \d+:\s*/, "")}</span>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs text-fg-muted tabular-nums">
                      <Clock aria-hidden="true" className="size-3.5" />
                      {lab.minutes} دقيقة · {lab.phases.length} مراحل
                    </span>
                  </AppLink>
                </li>
              ) : null,
            )}
          </ol>
        </div>
      </div>

      {/* 5. Every other lab, scrolling. */}
      {railLabs.length ? (
        <Marquee
          items={railLabs}
          getKey={(lab) => lab.slug}
          label="مختبرات أخرى"
          duration={90}
          repeat={2}
          className={cn("marquee--tight marquee--stretch mt-12", EDGE_FADE)}
          renderItem={(lab) => <LabCard lab={lab} />}
        />
      ) : null}

      {/* 6. CTA. */}
      <div className="ma-container mt-12 flex flex-wrap items-center gap-4">
        <ButtonLink href={routes.labs} variant="primary" size="lg">
          ابدأ أول مختبر مجانًا
        </ButtonLink>
        <p className="m-0 text-sm text-fg-muted">بدون تسجيل. تقدّمك ونتائجك تُحفظ على جهازك.</p>
      </div>
    </section>
  );
}
