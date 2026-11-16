"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, X } from "lucide-react";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { labs } from "@/features/labs/model/catalog";
import { commerceQueries } from "@/lib/api/commerce";
import { lmsQueries } from "@/lib/api/lms";
import { studentConsultationHref } from "@/lib/shop/product-links";

import { lmsProgram, ownedProgram } from "../model/learning";
import { ContinueLearningButton } from "./continue-learning-button";
import { studentNavGroups } from "./student-nav";

type Destination = { title: string; description: string; href: Route };

const sections: Destination[] = [
  { title: "قيد التعلّم", description: "برامجك ودوراتك الحالية", href: `${routes.studentHome}#learning-list-title` as Route },
  { title: "ملفك المهاري والشارات", description: "مهاراتك في المختبرات العملية", href: `${routes.studentHome}#labs-skills-title` as Route },
  { title: "سيناريوهات مقترحة", description: "اكتشف المختبرات العملية", href: `${routes.studentHome}#labs-dashboard-title` as Route },
  { title: "آخر النتائج", description: "درجات الاختبارات", href: `${routes.studentProgress}#recent-results-title` as Route },
  { title: "اكتشف الدورات", description: "تصفّح الدورات والبرامج المتاحة", href: routes.courses },
  { title: "تصفّح الاستشارات", description: "اكتشف الخبراء والاستشارات", href: routes.consultations },
];

// Ignore Arabic diacritics and common letter variants, so typing doesn't require exact spelling.
export function normalizeStudentSearch(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").trim();
}

/** Shared by the sidebar, topbar, and keyboard shortcut. Only mounted while open. */
export function StudentSearch({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const courses = useQuery(lmsQueries.courses({ page: 1, page_size: 50 }));
  const owned = useQuery(commerceQueries.ownedProducts({ status: "active", limit: 100 }));
  const livePrograms = (courses.data?.items ?? []).map(lmsProgram);
  const programs = [
    ...livePrograms,
    ...(owned.data?.items ?? [])
      .filter((product) => !livePrograms.some((program) => program.productSlug === product.slug || (program.entitlementId && program.entitlementId === product.entitlement_id)))
      .map((product) => {
        const program = ownedProgram(product, product.title || product.slug);
        return product.product_type === "consultation"
          ? { ...program, detailsHref: studentConsultationHref(product.slug) ?? routes.studentConsultations }
          : program;
      }),
  ];
  const terms = normalizeStudentSearch(query).split(/\s+/).filter(Boolean);
  const matches = (value: string) => terms.every((term) => normalizeStudentSearch(value).includes(term));
  const pages = studentNavGroups.flatMap((group) => group.items
    .filter((item) => !item.expertOnly && item.href !== routes.search)
    .map((item) => ({ title: item.label, description: group.label, href: item.href })));
  const groups = [
    { title: "الصفحات", items: pages.filter((item) => matches(`${item.title} ${item.description}`)) },
    { title: "الأقسام والموارد", items: sections.filter((item) => matches(`${item.title} ${item.description}`)) },
    { title: "المختبرات", items: labs.filter((lab) => matches(`${lab.title} ${lab.categoryName} ${lab.courseKeywords.join(" ")}`)).map((lab) => ({ title: lab.title, description: lab.categoryName, href: routes.lab(lab.slug) })) },
  ];
  const foundPrograms = programs.filter((program) => matches(`${program.title} ${program.typeLabel} ${program.instructor ?? ""}`));
  const pending = courses.isPending || owned.isPending;
  const failed = courses.isError && owned.isError;
  const count = foundPrograms.length + groups.reduce((total, group) => total + group.items.length, 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const close = () => {
    dialogRef.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="student-search-title"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] rounded-panel border border-line-strong bg-surface p-0 text-fg backdrop:bg-ink/70"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <h2 id="student-search-title" className="m-0 text-lg font-bold">ابحث في لوحة الطالب</h2>
        <button type="button" aria-label="إغلاق البحث" onClick={close} className="ma-btn ma-btn--bare ma-btn--icon size-11"><X aria-hidden="true" className="size-5" /></button>
      </div>
      <div className="p-4">
        <label htmlFor="student-search-input" className="mb-2 block text-sm text-fg-muted">برامجك، الصفحات، الأقسام والمختبرات</label>
        <div className="flex items-center gap-2 rounded-ctl border border-line-strong px-3 focus-within:ring-2 focus-within:ring-accent">
          <Search aria-hidden="true" className="size-5 shrink-0" />
          <input ref={inputRef} id="student-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم دورة أو صفحة أو مهارة…" className="min-h-12 min-w-0 flex-1 border-0 bg-transparent text-base text-fg outline-none" />
        </div>
      </div>
      <div className="max-h-[55dvh] overflow-y-auto px-4 pb-4">
        <p role="status" className="m-0 mb-3 text-sm text-fg-muted">{query.trim() ? `${count} نتيجة` : "انتقل بسرعة أو اكتب للبحث"}</p>
        <section aria-label="برامجك" className="mb-4">
          <h3 className="mb-2 text-sm font-bold">برامجك</h3>
          {pending ? <p role="status" className="text-sm text-fg-muted">جارٍ تحميل برامجك…</p> : failed ? (
            <div className="flex flex-col items-start gap-2"><p className="m-0 text-sm text-fg-muted">تعذّر تحميل برامجك. يمكنك البحث في الصفحات والمختبرات.</p><button type="button" className="ma-btn ma-btn--soft ma-btn--sm" onClick={() => { void courses.refetch(); void owned.refetch(); }}>إعادة المحاولة</button></div>
          ) : foundPrograms.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {foundPrograms.map((program) => <li key={program.id} className="flex flex-wrap items-center justify-between gap-3 rounded-ctl border border-line p-3">
                <div className="min-w-0 flex-1"><p className="m-0 break-words font-semibold">{program.title}</p><p className="m-0 text-xs text-fg-muted">{program.typeLabel}</p></div>
                {program.detailsHref ? <ButtonLink href={program.detailsHref} variant="soft" size="sm" onClick={onClose}>عرض التفاصيل</ButtonLink> : program.entitlementId ? <ContinueLearningButton entitlementId={program.entitlementId} fulfillmentStatus={owned.data?.items.find((product) => product.entitlement_id === program.entitlementId)?.fulfillment_status} title={program.title} label="افتح البرنامج" variant="soft" size="sm" block={false} /> : <ButtonLink href={routes.studentAccess} variant="soft" size="sm" onClick={onClose}>عرض في تعلّمي</ButtonLink>}
              </li>)}
            </ul>
          ) : <p className="text-sm text-fg-muted">{programs.length ? "لا توجد برامج تطابق بحثك." : "لا توجد برامج في حسابك بعد. اكتشف الدورات أدناه."}</p>}
        </section>
        {groups.filter((group) => group.items.length > 0).map((group) => <section key={group.title} aria-label={group.title} className="mb-4">
          <h3 className="mb-2 text-sm font-bold">{group.title}</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">{group.items.map((item) => <li key={item.href}>
            <AppLink href={item.href} onClick={onClose} className="flex min-h-12 items-center justify-between gap-3 rounded-ctl border border-line px-3 py-2 text-fg no-underline hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-accent">
              <span><span className="block text-sm font-semibold">{item.title}</span><span className="block text-xs text-fg-muted">{item.description}</span></span><ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
            </AppLink>
          </li>)}</ul>
        </section>)}
        {!pending && count === 0 ? <p className="text-sm text-fg-muted">لا توجد نتائج. جرّب اسمًا آخر أو اكتشف البرامج المتاحة.</p> : null}
        <ButtonLink href={routes.search} variant="soft" size="sm" onClick={onClose}>اكتشف كل البرامج</ButtonLink>
      </div>
    </dialog>
  );
}
