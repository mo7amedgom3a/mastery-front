"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { HeaderAccount } from "@/components/layout/header-account";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";
import { useActivityHeartbeat } from "@/features/student-insights/model/use-activity-heartbeat";
import { cn } from "@/lib/cn";

import { SidebarPlan } from "./sidebar-plan";
import { StudentNav } from "./student-nav";
import { StudentTopbar } from "./student-topbar";

/**
 * The student area's demo-style shell: a full-height sidebar (brand, search, grouped nav, plan
 * footer) and a slim sticky topbar. It replaces the marketing site header/footer on `/students/*`,
 * so the dashboard uses the whole viewport like the reference demo. Below `lg` the sidebar becomes
 * an off-canvas drawer opened from the topbar.
 */
export function StudentShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useActivityHeartbeat();

  // Escape closes the drawer and Ctrl/⌘+K opens search.
  useEffect(() => {
    const onPopState = () => setOpen(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // A drawer left open while the viewport grows into the fixed sidebar must not keep body scroll locked.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1200px)");
    const onChange = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(false);
        router.push(routes.search);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside
        id="student-sidebar"
        aria-label="لوحة الطالب"
        className={cn(
          "fixed inset-y-0 start-0 z-[70] flex w-[min(320px,86vw)] flex-col border-e border-line bg-surface-alt transition-transform duration-200 ease-out",
          "lg:sticky lg:inset-auto lg:top-0 lg:z-30 lg:h-dvh lg:w-auto lg:translate-x-0 lg:visible",
          open ? "visible translate-x-0" : "invisible translate-x-full",
        )}
      >
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between gap-2 px-4">
          <AppLink
            href={routes.studentHome}
            onClick={() => setOpen(false)}
            aria-label="ماستري أكاديمي — لوحة الطالب"
            className="flex min-w-0 items-center gap-2.5 no-underline"
          >
            <Image src="/brand/ma-mark-coral.svg" alt="" width={53} height={22} unoptimized className="shrink-0" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[17px] font-bold text-fg">ماستري</span>
              <span className="text-[11px] text-fg-muted">لوحة الطالب</span>
            </span>
          </AppLink>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
            className="ma-btn ma-btn--bare ma-btn--icon size-10 lg:hidden"
          >
            <X aria-hidden="true" className="size-5 fill-none" />
          </button>
        </div>

        <AppLink
          href={routes.search}
          onClick={() => setOpen(false)}
          className="mx-3 mb-2 flex min-h-[42px] items-center gap-2.5 rounded-ctl border border-line bg-surface px-3 text-sm text-fg-muted no-underline hover:border-line-strong hover:text-fg"
        >
          <Search aria-hidden="true" className="size-4 shrink-0 fill-none" />
          <span className="min-w-0 flex-1 truncate">ابحث أو انتقل</span>
          <kbd
            dir="ltr"
            className="rounded border border-line px-1 font-mono text-[11px] leading-[18px] text-fg-muted"
          >
            Ctrl K
          </kbd>
        </AppLink>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
          <StudentNav onNavigate={() => setOpen(false)} />
          <div className="mt-4 border-t border-line pt-4 sm:hidden" onClickCapture={() => setOpen(false)}>
            <HeaderAccount placement="drawer" />
          </div>
        </div>

        <div className="shrink-0 border-t border-line p-3">
          <div onClickCapture={() => setOpen(false)}>
            <SidebarPlan />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line px-1 pt-2 lg:hidden">
            <span className="text-xs text-fg-muted">المظهر</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] cursor-default border-0 bg-black/55 lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <StudentTopbar open={open} onOpenMenu={() => setOpen(true)} />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-[clamp(16px,2vw,32px)] py-6 outline-none lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
