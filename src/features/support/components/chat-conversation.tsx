"use client";

import {
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Headset,
  ImageIcon,
  Loader2,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getSupportAttachmentDownloadUrl,
  type SupportAttachment,
} from "@/lib/api/support";

// ============================================================================
// Context for previewing attachments across any chat message or composer
// ============================================================================

interface ChatConversationContextType {
  openAttachment: (attachment: SupportAttachment) => Promise<void>;
  previewAttachment: SupportAttachment | null;
  closePreview: () => void;
  loadingAttachmentId: string | null;
}

const ChatConversationContext = createContext<ChatConversationContextType | null>(null);

export function useChatConversation() {
  const ctx = useContext(ChatConversationContext);
  if (!ctx) {
    throw new Error("useChatConversation must be used within a ChatConversation");
  }
  return ctx;
}

// ============================================================================
// 1. ChatConversation Component
// ============================================================================

export interface ChatConversationProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatConversation({ children, className = "" }: ChatConversationProps) {
  const [previewAttachment, setPreviewAttachment] = useState<SupportAttachment | null>(null);
  const [loadingAttachmentId, setLoadingAttachmentId] = useState<string | null>(null);

  const openAttachment = async (attachment: SupportAttachment) => {
    try {
      setLoadingAttachmentId(attachment.attachment_id);
      // Fetch guaranteed-fresh presigned download URL
      let url = attachment.download_url;
      try {
        const fresh = await getSupportAttachmentDownloadUrl(attachment.attachment_id);
        if (fresh.download_url) {
          url = fresh.download_url;
        }
      } catch {
        // Fallback to attachment.download_url if fetch fails
      }

      if (!url) {
        alert("تعذر إنشاء رابط تحميل المرفق.");
        return;
      }

      const activeAtt = { ...attachment, download_url: url };

      if (attachment.content_type.startsWith("image/")) {
        setPreviewAttachment(activeAtt);
      } else {
        // Open PDF or document in new tab directly with inline disposition
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoadingAttachmentId(null);
    }
  };

  const closePreview = () => setPreviewAttachment(null);

  return (
    <ChatConversationContext.Provider
      value={{
        openAttachment,
        previewAttachment,
        closePreview,
        loadingAttachmentId,
      }}
    >
      <div
        className={`flex flex-col rounded-panel border border-line bg-surface shadow-xs overflow-hidden ${className}`}
      >
        {children}
      </div>

      {/* Global Image & Document Lightbox Preview Modal */}
      {previewAttachment && (
        <AttachmentLightboxModal
          attachment={previewAttachment}
          onClose={closePreview}
        />
      )}
    </ChatConversationContext.Provider>
  );
}

// ============================================================================
// 2. ChatConversationHeader & Subcomponents
// ============================================================================

export interface ChatConversationHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatConversationHeader({ children, className = "" }: ChatConversationHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 border-b border-line/70 bg-surface-alt/40 p-4 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function ChatConversationHeaderInfo({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col gap-2 min-w-0 flex-1 ${className}`}>{children}</div>;
}

export interface ChatConversationTitleProps {
  children?: React.ReactNode;
  ticketNumber?: string;
  subject?: string;
  badges?: React.ReactNode;
  className?: string;
}

export function ChatConversationTitle({
  children,
  ticketNumber,
  subject,
  badges,
  className = "",
}: ChatConversationTitleProps) {
  if (children) {
    return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{children}</div>;
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {ticketNumber && (
        <span className="font-mono text-sm md:text-base font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-md border border-accent/20">
          #{ticketNumber}
        </span>
      )}
      {subject && <h1 className="m-0 text-lg md:text-xl font-bold text-fg line-clamp-1">{subject}</h1>}
      {badges && <div className="flex items-center gap-1.5">{badges}</div>}
    </div>
  );
}

export interface ChatConversationSubtitleProps {
  children?: React.ReactNode;
  createdAt?: string;
  lastActivityAt?: string;
  assignedAdminName?: string | null;
  categoryName?: string | null;
  className?: string;
}

export function ChatConversationSubtitle({
  children,
  createdAt,
  lastActivityAt,
  assignedAdminName,
  categoryName,
  className = "",
}: ChatConversationSubtitleProps) {
  if (children) {
    return <div className={`flex flex-wrap items-center gap-4 text-xs text-fg-muted ${className}`}>{children}</div>;
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-muted ${className}`}>
      {createdAt && (
        <div className="flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-3.5" />
          <span>تاريخ الفتح: {createdAt}</span>
        </div>
      )}
      {lastActivityAt && (
        <div className="flex items-center gap-1.5">
          <span>آخر تحديث: {lastActivityAt}</span>
        </div>
      )}
      {assignedAdminName && (
        <div className="flex items-center gap-1.5 font-medium text-fg">
          <Headset aria-hidden="true" className="size-3.5 text-accent" />
          <span>مسؤول الدعم: {assignedAdminName}</span>
        </div>
      )}
      {categoryName && (
        <span className="rounded bg-surface-alt px-2 py-0.5 text-[11px] font-semibold border border-line">
          {categoryName}
        </span>
      )}
    </div>
  );
}

export function ChatConversationHeaderActions({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center gap-2 shrink-0 ${className}`}>{children}</div>;
}

// ============================================================================
// 3. ChatMessageList Component
// ============================================================================

export interface ChatMessageListProps<T = unknown> {
  items?: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function ChatMessageList<T = unknown>({
  items,
  renderItem,
  children,
  className = "",
}: ChatMessageListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-4 p-4 md:p-6 overflow-y-auto max-h-[750px] ${className}`}
    >
      {items && renderItem ? items.map((item, index) => renderItem(item, index)) : children}
    </div>
  );
}

// ============================================================================
// 4. ChatComposer Component
// ============================================================================

export interface ChatComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  attachments?: SupportAttachment[];
  onAddAttachment?: (file: File) => Promise<void>;
  onRemoveAttachment?: (id: string) => void;
  isUploading?: boolean;
  uploadError?: string | null;
  disabled?: boolean;
  disabledMessage?: React.ReactNode;
  footerNotice?: React.ReactNode;
  className?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  placeholder = "اكتب ردك أو استفسارك هنا…",
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  isUploading = false,
  uploadError = null,
  disabled = false,
  disabledMessage,
  footerNotice,
  className = "",
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (disabled && disabledMessage) {
    return (
      <div className="border-t border-line bg-surface-alt/60 p-6 text-center text-xs text-fg-muted">
        {disabledMessage}
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddAttachment) return;
    try {
      await onAddAttachment(file);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`border-t border-line bg-surface p-4 md:p-6 flex flex-col gap-3.5 ${className}`}
    >
      {footerNotice && <div className="text-xs text-fg-muted">{footerNotice}</div>}

      <div className="relative">
        <textarea
          required
          rows={3}
          value={value}
          disabled={disabled || isSubmitting}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ma-input w-full p-3.5 text-xs md:text-sm resize-y min-h-[90px] focus:outline-accent"
        />
      </div>

      {/* Uploaded attachments chip row */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.attachment_id}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-alt px-3 py-1.5 text-xs font-medium text-fg"
            >
              <Paperclip aria-hidden="true" className="size-3.5 text-accent shrink-0" />
              <span className="max-w-[200px] truncate">{att.original_filename}</span>
              <span className="text-[11px] text-fg-muted">
                ({(att.size_bytes / 1024).toFixed(1)} KB)
              </span>
              {onRemoveAttachment && (
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(att.attachment_id)}
                  className="cursor-pointer text-fg-muted hover:text-danger ms-1"
                  aria-label="حذف المرفق"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadError && <p className="m-0 text-xs font-semibold text-danger">{uploadError}</p>}

      {/* Bottom controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          {onAddAttachment && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                id="chat-composer-file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={disabled || isUploading || isSubmitting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface hover:bg-surface-alt px-3 py-2 text-xs font-semibold text-fg cursor-pointer transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin text-accent" />
                    <span>جارٍ رفع الملف…</span>
                  </>
                ) : (
                  <>
                    <Paperclip aria-hidden="true" className="size-3.5 text-fg-muted" />
                    <span>إرفاق صورة أو ملف</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={disabled || isSubmitting || isUploading || !value.trim()}
          className="h-9 px-6 text-xs gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              <span>جارٍ الإرسال…</span>
            </>
          ) : (
            <>
              <Send aria-hidden="true" className="size-3.5" />
              <span>إرسال الرد</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ============================================================================
// 5. ChatAttachmentCard Component (Interactive Thumbnail / Preview)
// ============================================================================

export function ChatAttachmentCard({
  attachment,
  className = "",
}: {
  attachment: SupportAttachment;
  className?: string;
}) {
  const { openAttachment, loadingAttachmentId } = useChatConversation();
  const isImage = attachment.content_type.startsWith("image/");
  const isLoading = loadingAttachmentId === attachment.attachment_id;

  return (
    <button
      type="button"
      onClick={() => openAttachment(attachment)}
      disabled={isLoading}
      className={`group flex items-center gap-2.5 rounded-xl bg-surface-alt/80 hover:bg-surface-alt px-3.5 py-2 text-start text-xs text-fg transition-all cursor-pointer shadow-2xs ${className}`}
      title="انقر لفتح ومعاينة المرفق"
    >
      {isLoading ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin text-accent shrink-0" />
      ) : isImage ? (
        <div className="grid size-7 place-items-center rounded-md bg-accent/10 text-accent shrink-0 group-hover:scale-105 transition-transform">
          <ImageIcon aria-hidden="true" className="size-4" />
        </div>
      ) : (
        <div className="grid size-7 place-items-center rounded-md bg-fg-muted/10 text-fg-muted shrink-0 group-hover:scale-105 transition-transform">
          <FileText aria-hidden="true" className="size-4" />
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold truncate max-w-[180px] group-hover:text-accent transition-colors">
          {attachment.original_filename}
        </span>
        <span className="text-[11px] text-fg-muted">
          {(attachment.size_bytes / 1024).toFixed(1)} KB • {isImage ? "معاينة صورة" : "عرض الملف"}
        </span>
      </div>

      <div className="grid size-6 place-items-center rounded-full bg-surface text-fg-muted group-hover:bg-accent group-hover:text-on-accent transition-colors shrink-0 ms-1">
        {isImage ? <Eye aria-hidden="true" className="size-3.5" /> : <Download aria-hidden="true" className="size-3.5" />}
      </div>
    </button>
  );
}

// ============================================================================
// 6. Attachment Lightbox & Preview Modal
// ============================================================================

function AttachmentLightboxModal({
  attachment,
  onClose,
}: {
  attachment: SupportAttachment;
  onClose: () => void;
}) {
  const isImage = attachment.content_type.startsWith("image/");
  const downloadUrl = attachment.download_url ?? "#";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-w-4xl w-full max-h-[90vh] rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-line bg-surface-alt/70">
          <div className="flex items-center gap-2.5 min-w-0">
            {isImage ? (
              <ImageIcon className="size-5 text-accent shrink-0" />
            ) : (
              <FileText className="size-5 text-fg-muted shrink-0" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">{attachment.original_filename}</span>
              <span className="text-xs text-fg-muted">
                {(attachment.size_bytes / 1024).toFixed(1)} KB • {attachment.content_type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.original_filename}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-alt text-xs font-semibold text-fg no-underline transition-colors"
            >
              <Download className="size-3.5" />
              <span>تحميل</span>
            </a>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-alt text-xs font-semibold text-fg no-underline transition-colors"
            >
              <ExternalLink className="size-3.5" />
              <span>فتح بنافذة جديدة</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg hover:bg-surface-alt text-fg-muted hover:text-fg cursor-pointer transition-colors"
              aria-label="إغلاق المعاينة"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 grid place-items-center bg-black/5 dark:bg-black/30 min-h-[300px]">
          {isImage ? (
            <div className="relative max-h-[70vh] w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl}
                alt={attachment.original_filename}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg border border-line/40"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="grid size-16 place-items-center rounded-2xl bg-accent/10 text-accent">
                <FileText className="size-8" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-base">{attachment.original_filename}</span>
                <span className="text-xs text-fg-muted">
                  هذا الملف من نوع ({attachment.content_type}). يمكنك استعراضه أو تنزيله مباشرة.
                </span>
              </div>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-md hover:bg-accent/90 transition-colors"
              >
                <Download className="size-4" />
                <span>تحميل واستعراض الملف</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
