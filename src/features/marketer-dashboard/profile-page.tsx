"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { describedBy, Field, FormError } from "@/features/auth/components/field";
import { TrainerCountryCityFields } from "@/features/trainers/components/trainer-country-city-fields";
import { ApiError } from "@/lib/api/client";
import { marketerKeys, marketerQueries, saveMarketerProfile, type MarketerProfile } from "@/lib/api/marketer";
import { formatDate } from "@/lib/format";

import { LoadError } from "./components/shared";

function ProfileForm({ profile }: { profile: MarketerProfile }) {
  const baseId = useId();
  const queryClient = useQueryClient();
  const p = profile.partner;
  const [fullName, setFullName] = useState(p.full_name ?? "");
  const [phone, setPhone] = useState(p.phone ?? "");
  const [countryCode, setCountryCode] = useState(p.country_code ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [channels, setChannels] = useState(profile.channels ?? "");
  const [audience, setAudience] = useState(profile.audience_size ?? "");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      saveMarketerProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        country_code: countryCode || null,
        city: city.trim() || null,
        channels: channels.trim() || null,
        audience_size: audience.trim() || null,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(marketerKeys.profile(), data);
      void queryClient.invalidateQueries({ queryKey: marketerKeys.all });
      setSaved(true);
    },
  });
  const error = save.error
    ? save.error instanceof ApiError && save.error.status === 422
      ? "تحقّق من البيانات المدخلة."
      : "تعذّر حفظ البيانات. حاول مجدداً."
    : null;
  const id = (name: string) => `${baseId}-${name}`;

  return (
    <form
      className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        save.mutate();
      }}
    >
      <h2 className="m-0 text-lg font-bold">بيانات التواصل</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("name")} label="الاسم الكامل" required>
          <input id={id("name")} required minLength={2} maxLength={300} value={fullName} onChange={(e) => setFullName(e.target.value)} className="ma-input" />
        </Field>
        <Field id={id("phone")} label="رقم الجوال" hint="مع مفتاح الدولة، مثل +966">
          <input id={id("phone")} type="tel" dir="ltr" maxLength={50} value={phone} onChange={(e) => setPhone(e.target.value)} {...describedBy(id("phone"), undefined, "مع مفتاح الدولة، مثل +966")} className="ma-input" />
        </Field>
        <TrainerCountryCityFields
          baseId={baseId}
          defaultCountry={p.country_code ?? ""}
          defaultCity={profile.city ?? ""}
          onCountryChange={(_name, code) => setCountryCode(code)}
          onCityChange={setCity}
        />
      </div>
      <Field id={id("channels")} label="قنواتك التسويقية" hint="روابط حساباتك ومنصاتك، سطر لكل رابط">
        <textarea id={id("channels")} dir="ltr" rows={3} maxLength={2000} value={channels} onChange={(e) => setChannels(e.target.value)} className="ma-input" />
      </Field>
      <Field id={id("audience")} label="حجم الجمهور التقريبي">
        <input id={id("audience")} maxLength={50} value={audience} onChange={(e) => setAudience(e.target.value)} className="ma-input" />
      </Field>
      <FormError message={error} />
      {saved ? <p role="status" className="ma-alert ma-alert--success m-0 text-sm">تم حفظ بياناتك.</p> : null}
      <button type="submit" className="ma-btn ma-btn--primary self-start" disabled={save.isPending}>
        {save.isPending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
      </button>
    </form>
  );
}

/** The marketer's own details: fixed identity (email, code) and editable contact info. */
export function MarketerProfilePage() {
  const profile = useQuery(marketerQueries.profile());
  if (profile.isPending) return <Skeleton className="h-80" />;
  if (profile.isError) return <LoadError />;
  const p = profile.data.partner;
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="identity-title" className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
        <h2 id="identity-title" className="m-0 text-lg font-bold">حسابك كمسوّق</h2>
        <dl className="m-0 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-fg-muted">البريد الإلكتروني</dt><dd className="m-0 font-medium"><bdi dir="ltr">{p.email}</bdi></dd></div>
          <div><dt className="text-xs text-fg-muted">كود الإحالة</dt><dd className="m-0 font-mono font-bold"><bdi dir="ltr">{p.referral_code}</bdi></dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-fg-muted">رابط الإحالة</dt><dd className="m-0 break-all font-mono text-xs"><bdi dir="ltr">{p.link}</bdi></dd></div>
          <div><dt className="text-xs text-fg-muted">عضو منذ</dt><dd className="m-0">{p.joined_at ? formatDate(p.joined_at) : "—"}</dd></div>
        </dl>
        <p className="m-0 text-xs text-fg-muted">لتغيير البريد أو كود الإحالة تواصل مع فريق ماستري — فهما مرتبطان بروابطك وتتبّعك في Tolt.</p>
      </section>
      <ProfileForm key={p.partner_id} profile={profile.data} />
    </div>
  );
}
