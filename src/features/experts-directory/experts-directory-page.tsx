import { ChevronLeft } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppLink } from "@/components/ui/app-link";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { routes } from "@/config/routes";
import { CtaBand } from "@/features/landing/sections/cta-band";

import { ExpertGrid } from "./components/expert-card";
import {
  directoryFields,
  directoryHref,
  EXPERTS_PAGE_SIZE,
  filterExperts,
  type ExpertCardVM,
  type ExpertsDirectoryState,
} from "./model";

const KIND_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "trainers", label: "المدربون" },
  { value: "consultants", label: "خبراء الاستشارات" },
] as const;

/**
 * `/experts`: every trainer and expert, filtered by name, field and role. The filters are a plain GET form,
 * so the page works without JavaScript and every filtered view has its own URL.
 */
export function ExpertsDirectoryPage({ experts, state }: { experts: readonly ExpertCardVM[]; state: ExpertsDirectoryState }) {
  const fields = directoryFields(experts);
  const matches = filterExperts(experts, state);
  const pageCount = Math.max(1, Math.ceil(matches.length / EXPERTS_PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  const shown = matches.slice((page - 1) * EXPERTS_PAGE_SIZE, page * EXPERTS_PAGE_SIZE);
  const filtered = Boolean(state.query || state.field || state.kind !== "all");
  const consultants = experts.filter((expert) => expert.isConsultant).length;

  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="experts-title" className="border-b border-line bg-surface-alt text-fg">
          <div className="ma-container pt-8 pb-10 md:pt-12 md:pb-14">
            <nav aria-label="مسار التصفح">
              <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm text-fg-muted">
                <li>
                  <AppLink href={routes.home} className="text-fg-muted no-underline hover:text-fg">
                    الرئيسية
                  </AppLink>
                </li>
                <li aria-hidden="true">
                  <ChevronLeft className="size-4" />
                </li>
                <li aria-current="page" className="text-fg">
                  المدربون والخبراء
                </li>
              </ol>
            </nav>
            <h1 id="experts-title" className="t-section m-0 mt-6 md:mt-8">
              المدربون والخبراء
            </h1>
            <p className="t-lead m-0 mt-4 max-w-[60ch]">
              {experts.length} مدرّب وخبير عربي، منهم {consultants} يقدّمون استشارات فردية. ابحث بالاسم أو المجال وتعرّف على
              برامج كلٍّ منهم.
            </p>

            <form action={routes.experts} method="get" role="search" className="mt-8 grid max-w-[60rem] gap-3 md:grid-cols-[2fr_1.5fr_1fr_auto] md:items-end">
              <label className="ma-field">
                <span className="ma-label">بحث</span>
                <input className="ma-input" type="search" name="q" defaultValue={state.query} placeholder="اسم المدرّب أو تخصصه" maxLength={100} />
              </label>
              <label className="ma-field">
                <span className="ma-label">المجال</span>
                <select className="ma-select" name="field" defaultValue={state.field}>
                  <option value="">كل المجالات</option>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ma-field">
                <span className="ma-label">الصفة</span>
                <select className="ma-select" name="kind" defaultValue={state.kind}>
                  {KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={buttonClass({ variant: "primary" })}>
                عرض النتائج
              </button>
            </form>
          </div>
        </section>

        <div className="ma-section pt-8 md:pt-10">
          <div className="ma-container flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p role="status" className="m-0 text-fg-muted">
                {matches.length === experts.length ? `${experts.length} مدرّب وخبير` : `${matches.length} من ${experts.length}`}
              </p>
              {filtered ? (
                <AppLink href={routes.experts} className="text-fg-muted underline-offset-4 hover:text-fg">
                  مسح الفلاتر
                </AppLink>
              ) : null}
            </div>
            {shown.length > 0 ? (
              <ExpertGrid experts={shown} label="المدربون والخبراء" />
            ) : (
              <div className="rounded-panel border border-line p-8 text-center">
                <p className="m-0 text-lg font-bold">لا يوجد مدربون مطابقون</p>
                <p className="m-0 mt-2 text-fg-muted">جرّب اسماً أو مجالاً آخر.</p>
                <ButtonLink href={routes.experts} variant="secondary" className="mt-6">
                  عرض كل المدربين
                </ButtonLink>
              </div>
            )}
            {pageCount > 1 ? (
              <Pagination
                page={page}
                pageCount={pageCount}
                hrefFor={(target) => directoryHref({ ...state, page: target })}
                label="صفحات المدربين"
              />
            ) : null}
          </div>
        </div>
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
