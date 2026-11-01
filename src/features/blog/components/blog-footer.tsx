import Link from "next/link";

import { routes } from "@/config/routes";

import { blogAnchor } from "../model/links";

const year = new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(new Date().getFullYear());

/** The blog's own footer; links stay inside the sub-brand plus a way back to the academy. */
export function BlogFooter() {
  return (
    <footer className="mt-auto border-t" style={{ borderColor: "var(--line)" }}>
      <div className="wrap flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              م
            </span>
            <span className="brand-name">مدونة ماستري</span>
          </div>
          <p className="type-caption-13 mt-3 max-w-72" style={{ color: "var(--muted)" }}>
            قراءة عربية هادئة عن التسويق والقيادة وريادة الأعمال — من خبراء ماستري أكاديمي.
          </p>
        </div>

        <nav className="flex flex-wrap gap-1" aria-label="روابط التذييل">
          <Link className="header-link" href={routes.blog}>
            المقالات
          </Link>
          <Link className="header-link" href={routes.blogAuthors}>
            الخبراء
          </Link>
          <Link className="header-link" href={blogAnchor("categories")}>
            التصنيفات
          </Link>
          <Link className="header-link" href={blogAnchor("about")}>
            عن المدونة
          </Link>
          <Link className="header-link" href={routes.home}>
            ماستري أكاديمي
          </Link>
        </nav>
      </div>

      <div
        className="wrap flex flex-wrap items-center justify-between gap-3 border-t py-5"
        style={{ borderColor: "var(--line)" }}
      >
        <p className="type-caption-12-400" style={{ color: "var(--muted)" }}>
          © {year} مدونة ماستري — جميع الحقوق محفوظة.
        </p>
      
      </div>
    </footer>
  );
}
