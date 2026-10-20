"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Headset,
  Loader2,
  RefreshCw,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import {
  getMyTicket,
  reopenSupportTicket,
  replyToSupportTicket,
  submitSupportFeedback,
  supportKeys,
  uploadSupportAttachment,
  type SupportAttachment,
} from "@/lib/api/support";
import { formatDateTime } from "@/lib/format";

import {
  ChatAttachmentCard,
  ChatComposer,
  ChatConversation,
  ChatConversationHeader,
  ChatConversationHeaderActions,
  ChatConversationHeaderInfo,
  ChatConversationSubtitle,
  ChatConversationTitle,
  ChatMessageList,
} from "./components/chat-conversation";
import { TicketPriorityTag, TicketStatusTag } from "./components/ticket-status-tag";

interface ConversationMessageItem {
  id: string;
  sender_type: "CUSTOMER" | "ADMIN" | "SYSTEM";
  sender_name: string;
  body: string;
  created_at: string;
  attachments: SupportAttachment[];
  isInitial?: boolean;
}

export function SupportDetailPage({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();

  // Active ticket conversation polls every 15 seconds so new messages arrive automatically
  const ticketQuery = useQuery({
    queryKey: supportKeys.ticket(ticketId),
    queryFn: () => getMyTicket(ticketId),
    refetchInterval: 15_000,
  });

  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<SupportAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // CSAT feedback state
  const [csatRating, setCsatRating] = useState<number>(5);
  const [csatComment, setCsatComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Reopen modal/box state
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenForm, setShowReopenForm] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: supportKeys.ticket(ticketId) });
    queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
  };

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToSupportTicket(ticketId, {
        body: replyText.trim(),
        attachment_ids: replyAttachments.map((a) => a.attachment_id),
      }),
    onSuccess: () => {
      setReplyText("");
      setReplyAttachments([]);
      invalidate();
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenSupportTicket(ticketId, { reason: reopenReason.trim() }),
    onSuccess: () => {
      setShowReopenForm(false);
      setReopenReason("");
      invalidate();
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: () =>
      submitSupportFeedback(ticketId, {
        rating: csatRating,
        comment: csatComment.trim() || undefined,
      }),
    onSuccess: () => {
      setFeedbackSent(true);
      invalidate();
    },
  });

  const handleUploadOneAttachment = async (file: File) => {
    if (replyAttachments.length >= 5) {
      setUploadError("الحد الأقصى للمرفقات هو 5 ملفات فقط.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await uploadSupportAttachment(file, ticketId);
      setReplyAttachments((prev) => [...prev, uploaded]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "فشل رفع الملف.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setReplyAttachments((prev) => prev.filter((a) => a.attachment_id !== attachmentId));
  };

  if (ticketQuery.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">جارٍ تحميل التذكرة…</span>
        <Skeleton className="h-28" />
        <Skeleton className="h-44" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">تعذّر تحميل تفاصيل التذكرة</p>
          <p className="ma-alert__text">
            قد يكون الرابط غير صحيح أو التذكرة غير متاحة.{" "}
            <AppLink href={routes.studentSupport} className="font-bold underline">
              العودة إلى التذاكر
            </AppLink>
          </p>
        </div>
      </div>
    );
  }

  const detail = ticketQuery.data;
  const ticket = detail.ticket;
  const isResolved = ticket.status === "RESOLVED";
  const isClosed = ticket.status === "CLOSED";
  const canReopen = detail.can_reopen;

  // Flatten the conversation: item 0 is the initial description, followed by conversation messages
  const conversationItems: ConversationMessageItem[] = [
    {
      id: "initial-description",
      sender_type: "CUSTOMER",
      sender_name: ticket.customer_name || "أنت",
      body: detail.description,
      created_at: ticket.created_at,
      attachments: detail.initial_attachments,
      isInitial: true,
    },
    ...detail.messages.map((m) => ({
      id: m.message_id,
      sender_type: m.sender_type,
      sender_name: m.sender_name || (m.sender_type === "ADMIN" ? "فريق الدعم الفني" : "أنت"),
      body: m.body,
      created_at: m.created_at,
      attachments: m.attachments,
      isInitial: false,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2">
        <AppLink
          href={routes.studentSupport}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-fg no-underline transition-colors"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
          <span>العودة إلى قائمة التذاكر</span>
        </AppLink>
      </div>

      {/* Resolution Banner */}
      {isResolved && (
        <div className="flex flex-col gap-3 rounded-panel border border-success/30 bg-success/5 p-5">
          <div className="flex items-center gap-2 text-success font-bold text-sm">
            <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
            <span>تم حل هذه التذكرة من قبل فريق الدعم الفني</span>
          </div>
          {detail.resolutions.length > 0 && (
            <p className="m-0 text-xs text-fg leading-relaxed bg-surface/80 rounded-lg p-3 border border-success/20">
              {detail.resolutions[0].resolution_summary}
            </p>
          )}
          {canReopen && (
            <div className="flex items-center justify-between gap-2 pt-2 text-xs">
              <span className="text-fg-muted">هل ما زالت المشكلة مستمرة؟</span>
              <button
                type="button"
                onClick={() => setShowReopenForm((v) => !v)}
                className="cursor-pointer font-bold text-accent hover:underline"
              >
                إعادة فتح التذكرة
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reopen Box Form */}
      {showReopenForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reopenReason.trim()) reopenMutation.mutate();
          }}
          className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4"
        >
          <span className="text-xs font-bold">سبب إعادة فتح التذكرة</span>
          <textarea
            required
            rows={2}
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="يرجى توضيح ما زال غير مكتمل أو المشكلة التي واجهتك بعد الحل…"
            className="ma-input w-full p-2.5 text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReopenForm(false)}
              className="ma-btn ma-btn--outline h-8 px-3 text-xs"
            >
              إلغاء
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={reopenMutation.isPending || !reopenReason.trim()}
              className="h-8 px-4 text-xs gap-1.5"
            >
              {reopenMutation.isPending ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : null}
              <span>تأكيد إعادة الفتح</span>
            </Button>
          </div>
        </form>
      )}

      {/* CSAT Rating Widget */}
      {(isResolved || isClosed) && !ticket.csat_rating && !feedbackSent && (
        <div className="flex flex-col gap-3 rounded-panel border border-accent/20 bg-accent/5 p-5">
          <span className="text-sm font-bold">كيف تقيّم تجربتك مع حل هذه التذكرة؟</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setCsatRating(star)}
                className="cursor-pointer p-1 text-accent transition-transform hover:scale-110"
                aria-label={`${star} نجوم`}
              >
                <Star
                  aria-hidden="true"
                  className={`size-6 ${star <= csatRating ? "fill-accent text-accent" : "text-line-strong"}`}
                />
              </button>
            ))}
          </div>
          <input
            type="text"
            value={csatComment}
            onChange={(e) => setCsatComment(e.target.value)}
            placeholder="ملاحظات إضافية حول الخدمة (اختياري)…"
            className="ma-input h-9 text-xs w-full"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              disabled={feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate()}
              className="h-8 px-4 text-xs"
            >
              {feedbackMutation.isPending ? "جارٍ الإرسال…" : "إرسال التقييم"}
            </Button>
          </div>
        </div>
      )}

      {/* Composable Chat Conversation Suite */}
      <ChatConversation>
        <ChatConversationHeader>
          <ChatConversationHeaderInfo>
            <ChatConversationTitle
              ticketNumber={ticket.ticket_number}
              subject={ticket.subject}
              badges={
                <>
                  <TicketPriorityTag priority={ticket.priority} />
                  <TicketStatusTag status={ticket.status} />
                </>
              }
            />
            <ChatConversationSubtitle
              createdAt={formatDateTime(ticket.created_at)}
              lastActivityAt={formatDateTime(ticket.last_activity_at)}
              assignedAdminName={ticket.assigned_admin_name}
              categoryName={ticket.category_name_ar}
            />
            {ticket.related_entity_label && (
              <div className="text-xs text-fg-muted font-medium pt-1">
                مرتبط بـ: {ticket.related_entity_label}
              </div>
            )}
          </ChatConversationHeaderInfo>

          <ChatConversationHeaderActions>
            <button
              type="button"
              onClick={() => void ticketQuery.refetch()}
              disabled={ticketQuery.isFetching}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface hover:bg-surface-alt px-3 py-1.5 text-xs font-bold text-fg transition-colors"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-3.5 ${ticketQuery.isFetching ? "animate-spin text-accent" : ""}`}
              />
              <span>تحديث المحادثة</span>
            </button>
          </ChatConversationHeaderActions>
        </ChatConversationHeader>

        <ChatMessageList<ConversationMessageItem>
          items={conversationItems}
          renderItem={(item) => {
            const isAgent = item.sender_type === "ADMIN";
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl p-4 md:p-5 transition-shadow shadow-xs ${
                  isAgent
                    ? "bg-accent/10 ms-2 md:ms-12"
                    : "bg-surface me-2 md:me-12"
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`grid size-8 place-items-center rounded-full shrink-0 ${
                        isAgent ? "bg-accent text-on-accent" : "bg-surface-alt text-fg-muted"
                      }`}
                    >
                      {isAgent ? (
                        <Headset aria-hidden="true" className="size-4" />
                      ) : (
                        <User aria-hidden="true" className="size-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{item.sender_name}</span>
                      <span className="text-[11px] text-fg-muted">
                        {isAgent
                          ? "فريق دعم ماستري أكاديمي"
                          : item.isInitial
                          ? "صاحب التذكرة · تفاصيل البلاغ"
                          : "صاحب التذكرة"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-fg-muted">{formatDateTime(item.created_at)}</span>
                </div>

                {/* Message Body */}
                <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-fg">
                  {item.body}
                </div>

                {/* Message Attachments using Presigned URL Preview Lightbox */}
                {item.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="sr-only">المرفقات</span>
                    {item.attachments.map((att) => (
                      <ChatAttachmentCard key={att.attachment_id} attachment={att} />
                    ))}
                  </div>
                )}
              </div>
            );
          }}
        />

        <ChatComposer
          value={replyText}
          onChange={setReplyText}
          onSubmit={(e) => {
            e.preventDefault();
            if (replyText.trim()) replyMutation.mutate();
          }}
          isSubmitting={replyMutation.isPending}
          isUploading={uploading}
          uploadError={uploadError}
          attachments={replyAttachments}
          onAddAttachment={handleUploadOneAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          disabled={isClosed && !canReopen}
          disabledMessage={
            <span>
              هذه التذكرة مغلقة نهائياً وانتهت نافذة إعادة الفتح. يمكنك{" "}
              <AppLink href={routes.studentSupportNew} className="font-bold text-accent underline">
                فتح تذكرة دعم جديدة
              </AppLink>{" "}
              في حال استمرار المشكلة.
            </span>
          }
          footerNotice={
            isResolved ? (
              <span className="text-[11px] text-accent font-semibold">
                إرسال رد سيعيد فتح التذكرة تلقائياً
              </span>
            ) : null
          }
        />
      </ChatConversation>
    </div>
  );
}
