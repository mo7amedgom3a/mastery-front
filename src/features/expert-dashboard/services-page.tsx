"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  consultationKeys,
  consultationQueries,
  createExpertService,
  deleteExpertService,
  updateExpertService,
  type ExpertService,
} from "@/lib/api/consultations";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

function priceLabel(service: ExpertService): string {
  if (service.price_amount === null) return "بلا سعر";
  const amount = Number(service.price_amount);
  // Prices are USD for now; the formatter already shows the $ sign.
  return amount === 0 ? "مجانية" : formatMoney(amount);
}

/** The consultations the expert sells: each one is booked against the expert's calendar slots. */
export function ExpertServicesPage() {
  const services = useQuery(consultationQueries.expertServices());
  const profile = useQuery(consultationQueries.expert());
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 max-w-[60ch] text-sm leading-6 text-fg-muted">
          مدة كل جلسة {profile.data?.session_minutes ?? "—"} دقيقة لكل الاستشارات (تُغيَّر من الإعدادات). يحجز العميل
          جلسة أو عدة جلسات متتالية من مواعيدك في التقويم، ويُحتسب السعر لكل جلسة.
        </p>
        {creating ? null : (
          <button type="button" onClick={() => setCreating(true)} className="ma-btn ma-btn--primary ma-btn--sm gap-2">
            <Plus aria-hidden="true" className="size-4" />
            إضافة استشارة
          </button>
        )}
      </div>

      {creating ? <ServiceForm onDone={() => setCreating(false)} /> : null}

      {services.isPending ? <Skeleton className="h-32" /> : null}
      {services.isError ? <p className="m-0 text-sm text-fg-muted">تعذّر تحميل الاستشارات.</p> : null}
      {services.isSuccess && services.data.length === 0 && !creating ? (
        <p className="m-0 text-sm text-fg-muted">لم تضف أي استشارة بعد.</p>
      ) : null}
      {services.isSuccess && services.data.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {services.data.map((service) => (
            <li key={service.service_id}>
              <ServiceRow service={service} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ServiceRow({ service }: { service: ExpertService }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const refresh = () => queryClient.invalidateQueries({ queryKey: consultationKeys.all });
  const toggle = useMutation({
    mutationFn: () => updateExpertService(service.service_id, { is_active: !service.is_active }),
    onSettled: () => void refresh(),
  });
  const remove = useMutation({
    mutationFn: () => deleteExpertService(service.service_id),
    onSettled: () => void refresh(),
  });

  if (mode === "edit") return <ServiceForm service={service} onDone={() => setMode("view")} />;

  return (
    <article className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={service.is_active ? "ma-tag ma-tag--green" : "ma-tag ma-tag--soft"}>
              {service.is_active ? "معروضة للحجز" : "متوقفة"}
            </span>
            <span className="text-sm text-fg-muted">
              {priceLabel(service)} · {service.duration_minutes} دقيقة للجلسة
            </span>
          </div>
          <h3 className="m-0 text-base font-bold">{service.title ?? service.slug}</h3>
          {service.short_description ? <p className="m-0 text-sm text-fg-muted">{service.short_description}</p> : null}
          <p className="m-0 text-xs text-fg-muted">
            {formatNumber(service.bookings_count)} حجز
            {service.created_at ? ` · أُضيفت ${formatDate(service.created_at)}` : null}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
            className="ma-btn ma-btn--soft ma-btn--sm disabled:opacity-50"
          >
            {service.is_active ? "إيقاف" : "تفعيل"}
          </button>
          <button
            type="button"
            onClick={() => setMode("edit")}
            aria-label={`تعديل ${service.title ?? "الاستشارة"}`}
            className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9"
          >
            <Pencil aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setMode("delete")}
            aria-label={`حذف ${service.title ?? "الاستشارة"}`}
            className="ma-btn ma-btn--bare ma-btn--icon size-9 min-h-9"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      {mode === "delete" ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
          <span>
            {service.bookings_count > 0
              ? "لهذه الاستشارة حجوزات، لذا ستُوقف وتُخفى بدلاً من حذفها. متابعة؟"
              : "حذف هذه الاستشارة نهائياً؟"}
          </span>
          <button
            type="button"
            onClick={() => {
              setMode("view");
              remove.mutate();
            }}
            className="ma-btn ma-btn--secondary ma-btn--sm"
          >
            {service.bookings_count > 0 ? "إيقاف" : "حذف"}
          </button>
          <button type="button" onClick={() => setMode("view")} className="ma-btn ma-btn--ghost ma-btn--sm">
            تراجع
          </button>
        </div>
      ) : null}
      {remove.data?.outcome === "archived" ? (
        <p role="status" className="m-0 text-sm text-fg-muted">
          أُوقفت الاستشارة لأنها مرتبطة بحجوزات أو طلبات سابقة.
        </p>
      ) : null}
      {toggle.isError || remove.isError ? (
        <p role="alert" className="m-0 text-sm text-fg-muted">
          تعذّر الحفظ. حدّث الصفحة وحاول مجدداً.
        </p>
      ) : null}
    </article>
  );
}

function ServiceForm({ service, onDone }: { service?: ExpertService; onDone: () => void }) {
  const queryClient = useQueryClient();
  const ids = { title: useId(), short: useId(), description: useId(), price: useId() };
  const [title, setTitle] = useState(service?.title ?? "");
  const [short, setShort] = useState(service?.short_description ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service?.price_amount ?? "");
  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: title.trim(),
        short_description: short.trim(),
        description: description.trim(),
        price_amount: price.trim(),
      };
      return service ? updateExpertService(service.service_id, body) : createExpertService({ ...body, currency_code: "USD", is_active: true });
    },
    onSuccess: onDone,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: consultationKeys.all }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-panel border border-accent bg-surface p-5">
      <h3 className="m-0 text-base font-bold">{service ? "تعديل الاستشارة" : "استشارة جديدة"}</h3>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.title} className="text-sm font-bold">
          العنوان
        </label>
        <input
          id={ids.title}
          required
          minLength={3}
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-panel border border-line bg-surface p-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.short} className="text-sm font-bold">
          وصف مختصر
        </label>
        <input
          id={ids.short}
          maxLength={500}
          value={short}
          onChange={(event) => setShort(event.target.value)}
          className="rounded-panel border border-line bg-surface p-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.description} className="text-sm font-bold">
          التفاصيل
        </label>
        <textarea
          id={ids.description}
          maxLength={8000}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-panel border border-line bg-surface p-3"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.price} className="text-sm font-bold">
          سعر الجلسة (USD)
        </label>
        <input
          id={ids.price}
          required
          type="number"
          inputMode="decimal"
          min={0}
          max={100000}
          step="0.01"
          dir="ltr"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="w-40 rounded-panel border border-line bg-surface p-2 tabular-nums"
        />
        {service ? (
          <p className="m-0 text-xs text-fg-muted">السعر الجديد يسري على الحجوزات الجديدة فقط.</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={save.isPending} className="ma-btn ma-btn--primary ma-btn--sm disabled:opacity-50">
          {service ? "حفظ" : "إضافة"}
        </button>
        <button type="button" onClick={onDone} className="ma-btn ma-btn--ghost ma-btn--sm">
          تراجع
        </button>
      </div>
      {save.isError ? (
        <p role="alert" className="m-0 text-sm text-fg-muted">
          {save.error instanceof ApiError && save.error.status === 422
            ? "تحقّق من الحقول: العنوان من 3 أحرف على الأقل، والسعر بين 0 و100000."
            : "تعذّر الحفظ. حاول مجدداً."}
        </p>
      ) : null}
    </form>
  );
}
