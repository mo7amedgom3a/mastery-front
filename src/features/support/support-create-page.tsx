"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, FileUp, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import {
  createSupportTicket,
  supportKeys,
  supportQueries,
  uploadSupportAttachment,
  type SupportAttachment,
} from "@/lib/api/support";

export function SupportCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery(supportQueries.categories());
  const relatedOptionsQuery = useQuery(supportQueries.relatedOptions());

  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [relatedEntity, setRelatedEntity] = useState<string>(""); // format: "type:id"
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
      router.push(routes.studentSupportTicket(data.ticket_id));
    },
  });

  const categories = categoriesQuery.data ?? [];
  const selectedCategory = categories.find((c) => c.category_id === categoryId);
  const relatedOptions = relatedOptionsQuery.data ?? [];

  const groupedRelatedOptions = useMemo(() => {
    const groups: Record<string, typeof relatedOptions> = {};
    for (const opt of relatedOptions) {
      const groupName =
        opt.group_name_ar ||
        (opt.entity_type === "PRODUCT"
          ? "الدورات والبرامج"
          : opt.entity_type === "CONSULTATION"
            ? "الاستشارات والجلسات"
            : opt.entity_type === "SUBSCRIPTION"
              ? "الاشتراكات"
              : opt.entity_type === "ORDER"
                ? "الطلبات والفواتير"
                : "أخرى");
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(opt);
    }
    return groups;
  }, [relatedOptions]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (attachments.length + files.length > 5) {
      setUploadError("الحد الأقصى للمرفقات هو 5 ملفات فقط.");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadSupportAttachment(file);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "فشل رفع الملف. تحقّق من حجم ونوع الملف.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.attachment_id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !subject.trim() || !description.trim()) return;

    let relatedType: "ORDER" | "PRODUCT" | "SUBSCRIPTION" | "CONSULTATION" | undefined;
    let relatedId: string | undefined;
    let relatedLabel: string | undefined;

    if (relatedEntity) {
      const opt = relatedOptions.find((o) => `${o.entity_type}:${o.entity_id}` === relatedEntity);
      if (opt) {
        relatedType = opt.entity_type;
        relatedId = opt.entity_id;
        relatedLabel = opt.label;
      }
    }

    createMutation.mutate({
      category_id: categoryId,
      subject: subject.trim(),
      description: description.trim(),
      requested_priority: priority,
      related_entity_type: relatedType,
      related_entity_id: relatedId,
      related_entity_label: relatedLabel,
      attachment_ids: attachments.map((a) => a.attachment_id),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Back button */}
      <div>
        <AppLink
          href={routes.studentSupport}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-fg no-underline mb-3 transition-colors"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
          <span>العودة إلى التذاكر</span>
        </AppLink>
        <h1 className="m-0 text-2xl font-bold">فتح تذكرة دعم جديدة</h1>
        <p className="m-0 mt-1 text-sm text-fg-muted">
          يرجى وصف المشكلة بأكبر قدر ممكن من التفاصيل، وإرفاق لقطات الشاشة أو الإيصالات لمساعدتنا على معالجة طلبك سريعاً.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-panel border border-line bg-surface p-6 md:p-8">
        {/* Category selection */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ticket-category" className="text-sm font-bold">
            نوع المشكلة / التصنيف <span className="text-accent">*</span>
          </label>
          <select
            id="ticket-category"
            required
            value={categoryId}
            onChange={(e) => {
              const val = e.target.value;
              setCategoryId(val);
              const found = categories.find((c) => c.category_id === val);
              if (found) {
                setPriority(found.default_priority);
              }
            }}
            className="ma-input h-11 w-full text-sm"
          >
            <option value="">اختر التصنيف الأنسب لمشكلتك…</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name_ar} ({cat.name_en})
              </option>
            ))}
          </select>
          {selectedCategory?.description_ar && (
            <p className="m-0 text-xs text-fg-muted">{selectedCategory.description_ar}</p>
          )}
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ticket-subject" className="text-sm font-bold">
            عنوان المشكلة / الموضوع <span className="text-accent">*</span>
          </label>
          <input
            id="ticket-subject"
            type="text"
            required
            minLength={3}
            maxLength={300}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="مثال: تم خصم قيمة الاشتراك ولم يتفعّل الحساب"
            className="ma-input h-11 w-full text-sm"
          />
        </div>

        {/* Priority & Related Entity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold">
              الأولوية (محددة تلقائياً حسب التصنيف)
            </label>
            <div className="flex items-center gap-2 rounded-field border border-line bg-surface-muted/50 px-3 h-11">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                priority === "URGENT"
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                  : priority === "HIGH"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                    : priority === "LOW"
                      ? "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                      : "bg-blue-500/10 text-blue-500 border border-blue-500/30"
              }`}>
                {priority === "URGENT" ? "حرجة للغاية (URGENT)" : priority === "HIGH" ? "عالية (HIGH)" : priority === "LOW" ? "منخفضة (LOW)" : "متوسطة (MEDIUM)"}
              </span>
              <span className="text-[11px] text-fg-muted">
                {selectedCategory ? `وفق سياسة: ${selectedCategory.name_ar}` : "اختر تصنيفاً لتحديد الأولوية"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="ticket-related" className="text-sm font-bold">
              المنتج أو الطلب المرتبط (اختياري)
            </label>
            <select
              id="ticket-related"
              value={relatedEntity}
              onChange={(e) => setRelatedEntity(e.target.value)}
              className="ma-input h-11 w-full text-sm"
            >
              <option value="">بدون ارتباط محدد</option>
              {Object.entries(groupedRelatedOptions).map(([groupTitle, items]) => (
                <optgroup key={groupTitle} label={`── ${groupTitle} ──`}>
                  {items.map((opt) => (
                    <option key={`${opt.entity_type}:${opt.entity_id}`} value={`${opt.entity_type}:${opt.entity_id}`}>
                      {opt.label} {opt.subtitle ? ` (${opt.subtitle})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed description */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ticket-description" className="text-sm font-bold">
            شرح المشكلة بالتفصيل <span className="text-accent">*</span>
          </label>
          <textarea
            id="ticket-description"
            required
            rows={5}
            minLength={10}
            maxLength={10000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وضّح الخطوات التي قمت بها، ورسائل الخطأ إن وجدت، وأي معلومات تساعدنا في التحقق السريع…"
            className="ma-input w-full p-3 text-sm leading-relaxed"
          />
        </div>

        {/* Attachments Section */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold">المرفقات والملفات الداعمة (اختياري)</span>
          <p className="m-0 text-xs text-fg-muted">
            يمكنك إرفاق صور ولقطات شاشة (PNG، JPG، WebP) أو ملفات PDF وإيصالات الدفع حتى 15 ميجابايت للملف الواحد.
          </p>

          {/* Upload input button */}
          <div className="flex items-center gap-3">
            <label className="ma-btn ma-btn--outline cursor-pointer gap-2 h-10 px-4 text-xs font-bold">
              {uploading ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin text-accent" />
                  <span>جارٍ رفع الملف…</span>
                </>
              ) : (
                <>
                  <FileUp aria-hidden="true" className="size-4" />
                  <span>إرفاق ملف أو صورة</span>
                </>
              )}
              <input
                type="file"
                multiple
                disabled={uploading || attachments.length >= 5}
                onChange={handleFileUpload}
                accept="image/*,application/pdf,.doc,.docx,.zip,.txt"
                className="sr-only"
              />
            </label>
            <span className="text-xs text-fg-muted">
              {attachments.length} من أصل 5 ملفات
            </span>
          </div>

          {uploadError && (
            <div className="text-xs text-danger font-medium">{uploadError}</div>
          )}

          {/* Uploaded attachments list */}
          {attachments.length > 0 && (
            <ul className="m-0 flex flex-col gap-2 p-0 list-none">
              {attachments.map((att) => (
                <li
                  key={att.attachment_id}
                  className="flex items-center justify-between rounded-lg border border-line bg-surface-alt px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip aria-hidden="true" className="size-3.5 shrink-0 text-fg-muted" />
                    <span className="truncate font-medium">{att.original_filename}</span>
                    <span className="text-[11px] text-fg-muted">
                      ({(att.size_bytes / 1024).toFixed(1)} KB)
                    </span>
                    <CheckCircle2 aria-hidden="true" className="size-3.5 text-success shrink-0" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.attachment_id)}
                    className="cursor-pointer text-fg-muted hover:text-danger p-1 transition-colors"
                    aria-label={`حذف ${att.original_filename}`}
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {createMutation.isError && (
          <div className="ma-alert ma-alert--danger text-xs" role="alert">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "تعذّر إرسال التذكرة حالياً. تأكد من إدخال كافة الحقول المطلوبة وحاول مجدداً."}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <AppLink href={routes.studentSupport} className="ma-btn ma-btn--outline h-11 px-5 text-sm no-underline">
            إلغاء
          </AppLink>
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending || uploading || !categoryId || !subject.trim() || !description.trim()}
            className="h-11 px-6 text-sm gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                <span>جارٍ إرسال التذكرة…</span>
              </>
            ) : (
              <span>إرسال التذكرة</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
