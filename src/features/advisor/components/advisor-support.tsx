"use client";

import { ArrowRight, CheckCircle2, Headset, Loader2, Plus, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { BidiText, textDir } from "@/components/content/bidi";
import { TicketStatusTag } from "@/features/support/components/ticket-status-tag";
import { ApiError } from "@/lib/api/client";
import {
  createGuestSupportTicket,
  createSupportTicket,
  getMyTicket,
  getSupportCategories,
  listMyTickets,
  replyToSupportTicket,
  type GuestTicketReceipt,
  type SupportCategory,
  type SupportMessage,
  type SupportTicketDetail,
  type SupportTicketSummary,
} from "@/lib/api/support";
import { useAuthStore } from "@/lib/auth/store";
import { formatDateTime } from "@/lib/format";

import { supportCopy } from "../content/support-copy";
import { useAdvisorStore } from "../model/store";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s.]+$/;

type FormValues = {
  name: string;
  email: string;
  categoryId: string;
  subject: string;
  description: string;
};

const emptyForm: FormValues = { name: "", email: "", categoryId: "", subject: "", description: "" };

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return supportCopy.tooMany;
    if (error.status === 401) return supportCopy.error;
  }
  return supportCopy.error;
}

/** The customer-support face of the widget: open a ticket, then follow it once signed in. */
export function AdvisorSupport() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => (state.status === "authenticated" ? state.user : null));
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const openSupportLogin = useAdvisorStore((state) => state.openSupportLogin);
  const setSupportEmail = useAdvisorStore((state) => state.setSupportEmail);

  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState(false);

  const [receipt, setReceipt] = useState<GuestTicketReceipt | null>(null);
  const [composing, setComposing] = useState(false);
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [detailError, setDetailError] = useState(false);

  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);

  const authenticated = Boolean(user);

  useEffect(() => {
    if (status === "idle") void bootstrap();
  }, [status, bootstrap]);

  useEffect(() => {
    let cancelled = false;
    getSupportCategories()
      .then((items) => {
        if (!cancelled) setCategories(items.filter((item) => item.is_active));
      })
      .catch(() => {
        if (!cancelled) setCategoriesError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const page = await listMyTickets({ limit: 5 });
      setTickets(page.items);
    } catch {
      // The list is an enhancement; the form stays usable.
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    // A new session must start from that account's tickets, never the previous one's.
    queueMicrotask(() => {
      if (authenticated) {
        void loadTickets();
      } else {
        setTickets([]);
        setSelected(null);
        setDetail(null);
      }
    });
  }, [authenticated, loadTickets]);

  // The thread follows replies from the support team while it is open.
  useEffect(() => {
    if (!authenticated || !selected) return;
    let cancelled = false;
    const load = async () => {
      try {
        const next = await getMyTicket(selected);
        if (!cancelled) {
          setDetail(next);
          setDetailError(false);
        }
      } catch {
        if (!cancelled) setDetailError(true);
      }
    };
    void load();
    const timer = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [authenticated, selected]);

  useEffect(() => {
    const list = threadRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [detail?.messages.length, detail?.ticket.status, selected]);

  const submitGuest = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const next = await createGuestSupportTicket({
        name: values.name.trim() || undefined,
        email: values.email.trim(),
        subject: values.subject.trim(),
        category_id: values.categoryId,
        description: values.description.trim(),
      });
      setReceipt(next);
      setComposing(false);
      setSupportEmail(next.email);
    } catch (error) {
      setFormError(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const submitTicket = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const ticket = await createSupportTicket({
        subject: values.subject.trim(),
        category_id: values.categoryId,
        description: values.description.trim(),
      });
      setTickets((current) => [ticket, ...current].slice(0, 5));
      setComposing(false);
      setSelected(ticket.ticket_id);
    } catch (error) {
      setFormError(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selected || replying) return;
    setReplying(true);
    setReplyError(null);
    try {
      await replyToSupportTicket(selected, { body });
      setDraft("");
      const next = await getMyTicket(selected);
      setDetail(next);
      void loadTickets();
    } catch (error) {
      setReplyError(friendlyError(error));
    } finally {
      setReplying(false);
    }
  };

  // ---- Guest: open a ticket -------------------------------------------------------------
  if (!authenticated) {
    if (receipt) {
      return (
        <div role="status" className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 aria-hidden="true" className="size-7" />
            </span>
            <h3 className="m-0 text-lg font-bold">{supportCopy.successTitle}</h3>
            <p className="m-0 text-sm leading-7 text-fg-muted">{supportCopy.successBody(receipt.ticket_number)}</p>
          </div>
          <button type="button" onClick={() => openSupportLogin(receipt.email)} className="ma-btn ma-btn--primary min-h-11">
            {supportCopy.loginToTrack}
          </button>
          <button
            type="button"
            onClick={() => {
              setReceipt(null);
              setComposing(true);
            }}
            className="ma-btn ma-btn--bare min-h-11 text-sm"
          >
            {supportCopy.newTicket}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Headset aria-hidden="true" className="size-5" />
          </span>
          <p className="m-0 text-sm leading-7 text-fg-muted">{supportCopy.guestLead}</p>
        </div>
        {categoriesError ? (
          <p role="alert" className="ma-alert ma-alert--warning m-0 text-sm">
            {supportCopy.error}
          </p>
        ) : null}
        <SupportTicketForm
          mode="guest"
          categories={categories}
          submitting={submitting}
          error={formError}
          onSubmit={submitGuest}
        />
      </div>
    );
  }

  // ---- Signed in: one conversation -----------------------------------------------------
  if (selected) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setDetail(null);
              setDetailError(false);
              setReplyError(null);
            }}
            className="ma-btn ma-btn--bare ma-btn--sm min-h-9 gap-1 text-xs"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
            {supportCopy.backToTickets}
          </button>
        </div>

        {detail ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
            <span className="font-mono text-xs font-bold text-accent">#{detail.ticket.ticket_number}</span>
            <span className="line-clamp-1 text-sm font-semibold">{detail.ticket.subject}</span>
            <TicketStatusTag status={detail.ticket.status} className="ms-auto" />
          </div>
        ) : null}

        <div ref={threadRef} className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-3">
          {detailError && !detail ? (
            <p role="alert" className="ma-alert ma-alert--warning m-0 text-sm">
              {supportCopy.error}
            </p>
          ) : null}
          {!detail && !detailError ? (
            <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              {supportCopy.loading}
            </p>
          ) : null}
          {detail ? <TicketThread detail={detail} /> : null}
        </div>

        {detail ? (
          <form onSubmit={submitReply} className="flex items-end gap-2 border-t border-line p-3">
            <label htmlFor="ma-support-reply" className="sr-only">
              {supportCopy.replyPlaceholder}
            </label>
            <textarea
              id="ma-support-reply"
              rows={1}
              dir={draft.trim() ? textDir(draft) : "rtl"}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={supportCopy.replyPlaceholder}
              className="ma-input max-h-28 min-h-11 flex-1 resize-none py-2 leading-7 [field-sizing:content]"
            />
            <button
              type="submit"
              disabled={replying || !draft.trim()}
              aria-label={supportCopy.send}
              className="ma-btn ma-btn--primary ma-btn--icon size-11 shrink-0"
            >
              {replying ? (
                <Loader2 aria-hidden="true" className="size-5 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="size-5 fill-none rtl:-scale-x-100" />
              )}
            </button>
          </form>
        ) : null}
        {replyError ? (
          <p role="alert" className="m-0 px-4 pb-3 text-xs text-danger">
            {replyError}
          </p>
        ) : null}
      </div>
    );
  }

  // ---- Signed in: list or new ticket ---------------------------------------------------
  if (composing) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <button
          type="button"
          onClick={() => {
            setComposing(false);
            setFormError(null);
          }}
          className="ma-btn ma-btn--bare ma-btn--sm min-h-9 w-fit gap-1 text-xs"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
          {supportCopy.myTickets}
        </button>
        <SupportTicketForm
          mode="customer"
          categories={categories}
          submitting={submitting}
          error={formError}
          onSubmit={submitTicket}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-bold">{supportCopy.myTickets}</h3>
        <button type="button" onClick={() => setComposing(true)} className="ma-btn ma-btn--soft ma-btn--sm min-h-9 gap-1 text-xs">
          <Plus aria-hidden="true" className="size-4" />
          {supportCopy.newTicketShort}
        </button>
      </div>

      {ticketsLoading && tickets.length === 0 ? (
        <p className="m-0 flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          {supportCopy.loading}
        </p>
      ) : null}

      {!ticketsLoading && tickets.length === 0 ? (
        <p className="m-0 text-sm leading-7 text-fg-muted">{supportCopy.noTickets}</p>
      ) : null}

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {tickets.map((ticket) => (
          <li key={ticket.ticket_id}>
            <button
              type="button"
              onClick={() => setSelected(ticket.ticket_id)}
              className="flex w-full flex-col gap-1 rounded-panel border border-line bg-surface-alt/40 p-3 text-start transition-colors hover:bg-surface-alt"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-accent">#{ticket.ticket_number}</span>
                <span className="line-clamp-1 flex-1 text-sm font-semibold">{ticket.subject}</span>
                <TicketStatusTag status={ticket.status} />
              </span>
              <span className="text-[11px] text-fg-muted">
                {supportCopy.lastActivity}: {formatDateTime(ticket.last_activity_at)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SupportTicketForm({
  mode,
  categories,
  submitting,
  error,
  onSubmit,
}: {
  mode: "guest" | "customer";
  categories: SupportCategory[];
  submitting: boolean;
  error: string | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const set = (key: keyof FormValues) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "guest" && !EMAIL_PATTERN.test(values.email.trim())) {
      setFieldError(supportCopy.required);
      return;
    }
    if (!values.categoryId || values.subject.trim().length < 3 || values.description.trim().length < 10) {
      setFieldError(supportCopy.required);
      return;
    }
    setFieldError(null);
    void onSubmit(values);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {mode === "guest" ? (
        <>
          <label className="ma-field">
            <span className="text-xs font-semibold text-fg-muted">{supportCopy.nameLabel}</span>
            <input className="ma-input min-h-11" value={values.name} onChange={set("name")} autoComplete="name" />
          </label>
          <div className="ma-field">
            <label htmlFor="ma-support-email" className="text-xs font-semibold text-fg-muted">
              {supportCopy.emailLabel}
            </label>
            <input
              id="ma-support-email"
              type="email"
              dir="ltr"
              className="ma-input min-h-11"
              value={values.email}
              onChange={set("email")}
              autoComplete="email"
              aria-describedby="ma-support-email-hint"
              required
            />
            <span id="ma-support-email-hint" className="mt-1 block text-[11px] text-fg-muted">
              {supportCopy.emailHint}
            </span>
          </div>
        </>
      ) : null}

      <label className="ma-field">
        <span className="text-xs font-semibold text-fg-muted">{supportCopy.categoryLabel}</span>
        <select className="ma-input min-h-11" value={values.categoryId} onChange={set("categoryId")} required>
          <option value="">{supportCopy.categoryPlaceholder}</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.name_ar}
            </option>
          ))}
        </select>
      </label>

      <label className="ma-field">
        <span className="text-xs font-semibold text-fg-muted">{supportCopy.subjectLabel}</span>
        <input
          className="ma-input min-h-11"
          value={values.subject}
          onChange={set("subject")}
          placeholder={supportCopy.subjectPlaceholder}
          maxLength={300}
          required
        />
      </label>

      <label className="ma-field">
        <span className="text-xs font-semibold text-fg-muted">{supportCopy.descriptionLabel}</span>
        <textarea
          dir="rtl"
          rows={4}
          className="ma-input min-h-24 resize-y py-2 leading-7"
          value={values.description}
          onChange={set("description")}
          placeholder={supportCopy.descriptionPlaceholder}
          maxLength={10000}
          required
        />
      </label>

      {fieldError || error ? (
        <p role="alert" className="m-0 text-xs font-semibold text-danger">
          {error ?? fieldError}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="ma-btn ma-btn--primary min-h-11">
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            {supportCopy.sending}
          </span>
        ) : (
          supportCopy.submit
        )}
      </button>
    </form>
  );
}

function TicketThread({ detail }: { detail: SupportTicketDetail }) {
  const messages: Array<SupportMessage & { initial?: boolean }> = [
    {
      message_id: "initial",
      ticket_id: detail.ticket.ticket_id,
      sender_type: "CUSTOMER",
      sender_customer_id: detail.ticket.customer_id,
      sender_admin_id: null,
      sender_name: detail.ticket.customer_name || "أنت",
      visibility: "PUBLIC",
      body: detail.description,
      created_at: detail.ticket.created_at,
      attachments: detail.initial_attachments,
      initial: true,
    },
    ...detail.messages,
  ];

  return (
    <>
      {messages.map((message) => {
        const mine = message.sender_type === "CUSTOMER";
        return (
          <div
            key={message.message_id}
            className={`flex max-w-[92%] flex-col gap-1 rounded-panel border p-3 text-sm leading-7 ${
              mine
                ? "self-end border-accent/30 bg-accent/10"
                : "self-start border-line bg-surface-alt/50"
            }`}
          >
            <span className="text-[11px] font-semibold text-fg-muted">
              {mine ? "أنت" : message.sender_name || "فريق الدعم"}
            </span>
            <BidiText text={message.body} />
            <span className="text-[10px] text-fg-muted">{formatDateTime(message.created_at)}</span>
          </div>
        );
      })}
      {detail.messages.length === 0 ? (
        <p className="m-0 text-xs leading-6 text-fg-muted">{supportCopy.threadEmpty}</p>
      ) : null}
    </>
  );
}
