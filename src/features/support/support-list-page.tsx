"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, Headset, MessageSquare, Plus, Search } from "lucide-react";
import { useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { supportQueries } from "@/lib/api/support";
import { formatDateTime, formatNumber } from "@/lib/format";

import { TicketPriorityTag, TicketStatusTag } from "./components/ticket-status-tag";

const PAGE_SIZE = 10;

type FilterTab = "ALL" | "ACTIVE" | "WAITING" | "RESOLVED";

export function SupportListPage() {
  const [tab, setTab] = useState<FilterTab>("ALL");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const statusParam =
    tab === "ACTIVE"
      ? "IN_PROGRESS"
      : tab === "WAITING"
        ? "WAITING_FOR_CUSTOMER"
        : tab === "RESOLVED"
          ? "RESOLVED"
          : undefined;

  const ticketsQuery = useQuery({
    ...supportQueries.tickets({
      status: statusParam,
      search: search.trim() || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    placeholderData: keepPreviousData,
  });

  const isLoading = ticketsQuery.isPending;
  const isError = ticketsQuery.isError;
  const data = ticketsQuery.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Top CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold">الدعم الفني وتذاكر المساعدة</h1>
          <p className="m-0 mt-1 text-sm text-fg-muted">
            تابع استفساراتك، وتواصل مباشرة مع فريق خدمة المستفيدين لحل أي مشكلة تقنية أو مالية.
          </p>
        </div>
        <ButtonLink href={routes.studentSupportNew} variant="primary" className="shrink-0 gap-2">
          <Plus aria-hidden="true" className="size-4" />
          <span>فتح تذكرة جديدة</span>
        </ButtonLink>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "ALL", label: "جميع التذاكر" },
              { id: "ACTIVE", label: "قيد المتابعة" },
              { id: "WAITING", label: "بانتظار ردك" },
              { id: "RESOLVED", label: "تم الحل" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setOffset(0);
              }}
              className={`cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                tab === t.id
                  ? "bg-fg text-surface"
                  : "border border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="ابحث برقم التذكرة أو الموضوع…"
            className="ma-input h-10 w-full pe-9 text-xs"
          />
          <Search aria-hidden="true" className="pointer-events-none absolute end-3 top-2.5 size-4 text-fg-muted" />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div role="status" className="flex flex-col gap-3">
          <span className="sr-only">جارٍ تحميل التذاكر…</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : isError ? (
        <div className="ma-alert ma-alert--warning" role="alert">
          <div>
            <p className="ma-alert__title">تعذّر تحميل تذاكر الدعم</p>
            <p className="ma-alert__text">
              <button
                type="button"
                onClick={() => void ticketsQuery.refetch()}
                className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold underline"
              >
                أعد المحاولة
              </button>
            </p>
          </div>
        </div>
      ) : !data || data.total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-panel border border-line bg-surface p-10 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-surface-alt">
            <Headset aria-hidden="true" className="size-7 text-accent" />
          </div>
          <div className="max-w-md">
            <h2 className="m-0 text-lg font-bold">لا توجد تذاكر دعم مطابقة</h2>
            <p className="m-0 mt-1 text-sm text-fg-muted">
              {search
                ? "لم نجد تذاكر تطابق عبارة البحث الحالية. جرّب البحث بكلمة مختلفة أو مسح البحث."
                : "هل تواجه مشكلة في تفعيل دورة، اشتراك أو استفسار مالي؟ افتح تذكرة وسنكون سعداء بمساعدتك."}
            </p>
          </div>
          <ButtonLink href={routes.studentSupportNew} variant="primary" className="mt-2 gap-2">
            <Plus aria-hidden="true" className="size-4" />
            <span>فتح تذكرة الآن</span>
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((ticket) => {
            const hasUnread = ticket.customer_unread_count > 0;
            return (
              <AppLink
                key={ticket.ticket_id}
                href={routes.studentSupportTicket(ticket.ticket_id)}
                className={`group flex flex-col gap-3 rounded-panel border p-5 no-underline transition-colors ${
                  hasUnread
                    ? "border-accent/40 bg-accent/5 hover:border-accent"
                    : "border-line bg-surface hover:border-line-strong hover:bg-surface-alt"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-fg-muted" dir="ltr">
                      {ticket.ticket_number}
                    </span>
                    <span className="text-xs text-fg-muted">·</span>
                    <span className="text-xs font-medium text-fg-muted">{ticket.category_name_ar}</span>
                    {hasUnread && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent animate-pulse">
                        رد جديد من الدعم ({formatNumber(ticket.customer_unread_count)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <TicketPriorityTag priority={ticket.priority} />
                    <TicketStatusTag status={ticket.status} />
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="m-0 text-base font-bold text-fg transition-colors group-hover:text-accent">
                    {ticket.subject}
                  </h3>
                  <ChevronLeft aria-hidden="true" className="size-5 shrink-0 text-fg-muted transition-transform group-hover:-translate-x-1" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs text-fg-muted">
                  <div className="flex items-center gap-4">
                    <span>آخر نشاط: {formatDateTime(ticket.last_activity_at)}</span>
                    {ticket.related_entity_label && (
                      <span className="hidden sm:inline">مرتبط بـ: {ticket.related_entity_label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <MessageSquare aria-hidden="true" className="size-3.5" />
                    <span>{formatNumber(ticket.message_count)} رسائل</span>
                  </div>
                </div>
              </AppLink>
            );
          })}

          {/* Pagination */}
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4 text-xs text-fg-muted">
              <span>
                عرض {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} من أصل {formatNumber(data.total)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  className="ma-btn ma-btn--outline h-9 px-3 text-xs disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  type="button"
                  disabled={offset + PAGE_SIZE >= data.total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  className="ma-btn ma-btn--outline h-9 px-3 text-xs disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
