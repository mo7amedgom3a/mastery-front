import { ArrowLeft, ChevronDown, Sparkles, TrendingUp, Wallet, Clock } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";

import { APPLY_STEPS } from "@/features/marketer-application/model/steps";

import { marketersPageCopy as copy } from "./content/copy";

type ProgramTerms = {
  applications_open: boolean;
  commission_percent: string | number;
  cookie_days: number;
  payout_terms: string;
  minimum_payout_minor: number;
};

const pad = (index: number) => String(index + 1).padStart(2, "0");

export function MarketersPage({ terms }: { terms: ProgramTerms }) {
  const commission = Math.round(Number(terms.commission_percent) || 20);

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Hero Section */}
        <header data-theme="dark" className="relative overflow-hidden bg-surface-alt text-fg">
          <div className="absolute inset-0 bg-radial-gradient from-accent/10 to-transparent pointer-events-none" />
          <div className="ma-container flex flex-col items-start py-16 md:py-24 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="ma-tag ma-tag--coral">{copy.kicker}</span>
              <span className="inline-flex items-center gap-1.5 rounded-ctl bg-accent/20 px-3 py-1 text-xs font-bold text-accent">
                <Sparkles className="size-3.5" />
                عمولة تصل إلى {commission}%
              </span>
            </div>

            <h1 className="t-hero m-0 mt-6 max-w-3xl leading-tight">
              شارك المعرفة واربح عمولات نقدية تصل إلى{" "}
              <span className="text-accent underline decoration-accent/40 underline-offset-8">
                {commission}%
              </span>{" "}
              مع ماستري
            </h1>

            <p className="t-lead m-0 mt-6 max-w-2xl text-fg-muted leading-relaxed">
              {copy.lead}
            </p>

            {/* Quick highlight bar */}
            <div className="mt-8 flex flex-wrap gap-6 rounded-panel border border-line bg-surface/50 p-4 backdrop-blur-sm sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-ctl bg-accent/15 text-accent">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-fg-muted block">نسبة العمولة</span>
                  <span className="text-sm font-bold text-fg">حتى {commission}% لكل عملية بيع</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-ctl bg-accent/15 text-accent">
                  <Clock className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-fg-muted block">مدة التتبع</span>
                  <span className="text-sm font-bold text-fg">{terms.cookie_days || 30} يوماً (كوكيز وروابط)</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-ctl bg-accent/15 text-accent">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-fg-muted block">طريقة وشروط الدفع</span>
                  <span className="text-sm font-bold text-fg">{terms.payout_terms || "PayPal · NET-15"}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <AppLink
                href={terms.applications_open ? routes.marketersApply(APPLY_STEPS[0].id) : "#apply"}
                className={cn(buttonClass({ variant: "primary", size: "lg" }))}
              >
                {copy.primaryAction}
              </AppLink>
              <a href="#how-it-works" className={cn(buttonClass({ variant: "secondary", size: "lg" }))}>
                كيف يعمل البرنامج؟
              </a>
              <AppLink href={routes.loginThen(routes.marketerDashboard)} className={cn(buttonClass({ variant: "soft", size: "lg" }))}>
                دخول المسوقين
              </AppLink>
            </div>
          </div>
        </header>

        {/* Why Join Section */}
        <Section aria-labelledby="why-title">
          <SectionHeader id="why-title" label={copy.why.label} title={copy.why.title} />
          <ul className="m-0 mt-10 grid list-none gap-px overflow-hidden rounded-panel border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-3">
            {copy.why.items.map((item, index) => (
              <li key={item.title} className="flex flex-col gap-3 bg-surface p-6 sm:p-8">
                <span className="text-sm font-bold text-accent" aria-hidden="true">
                  {pad(index)}
                </span>
                <h3 className="m-0 text-xl font-bold text-fg">{item.title}</h3>
                <p className="m-0 text-fg-muted leading-relaxed text-sm">{item.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* How It Works Section */}
        <Section tone="alt" id="how-it-works" aria-labelledby="join-steps-title">
          <SectionHeader id="join-steps-title" label={copy.steps.label} title={copy.steps.title} />
          <ol className="m-0 mt-10 grid list-none gap-px overflow-hidden rounded-panel border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-5">
            {copy.steps.items.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3 bg-surface-alt p-6">
                <span className="text-sm font-bold text-accent" aria-hidden="true">
                  {pad(index)}
                </span>
                <h3 className="m-0 text-lg font-bold text-fg">{step.title}</h3>
                <p className="m-0 text-fg-muted leading-relaxed text-xs">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* FAQ Section */}
        <Section aria-labelledby="faq-title">
          <div className="mx-auto max-w-[50rem]">
            <SectionHeader id="faq-title" label={copy.faq.label} title={copy.faq.title} />
            <div className="mt-10 flex flex-col gap-4">
              {copy.faq.items.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-panel border border-line bg-surface p-5 transition-colors open:bg-surface-alt"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-fg list-none select-none">
                    <span className="text-base sm:text-lg">{faq.question}</span>
                    <ChevronDown className="size-5 shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="m-0 mt-4 text-fg-muted leading-relaxed text-sm border-t border-line/60 pt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        {/* Application Form Section */}
        <Section id="apply" aria-labelledby="apply-title" tone="alt" className="scroll-mt-20">
          <div className="mx-auto max-w-[56rem]">
            <SectionHeader id="apply-title" label={copy.form.label} title={copy.form.title} lead={copy.form.lead} />
            <div className="mt-10 flex flex-col gap-6 rounded-panel border border-line-strong bg-surface p-5 sm:p-8">
              {terms.applications_open ? (
                <>
                  <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-5">
                    {APPLY_STEPS.map((step, index) => (
                      <li key={step.id} className="flex items-center gap-2 text-sm font-medium sm:flex-col sm:items-start">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-xs tabular-nums" aria-hidden="true">
                          {index + 1}
                        </span>
                        {step.label}
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonLink href={routes.marketersApply(APPLY_STEPS[0].id)} variant="primary" size="lg" className="gap-2">
                      ابدأ طلب الانضمام
                      <ArrowLeft aria-hidden="true" className="size-5 fill-none" />
                    </ButtonLink>
                    <span className="text-sm text-fg-muted">يستغرق نحو 5 دقائق، ونراجعه خلال 48 ساعة.</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <h3 className="m-0 text-xl font-bold">باب التقديم مغلق حاليًا</h3>
                  <p className="m-0 text-fg-muted">
                    نعتذر منك، استقبال طلبات المسوقين الجدد مغلق مؤقتًا. تابع قنواتنا لمعرفة موعد إعادة فتح باب التقديم.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
