"use client";

import { useId, useState } from "react";
import { AlertCircle, Send, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PhoneInputField } from "@/components/ui/phone-input-field";
import { QueryProvider } from "@/components/providers/query-provider";
import { describedBy, Field, FormError } from "@/features/auth/components/field";
import { ChoiceChip } from "@/features/onboarding/components/choice-chip";
import { TrainerCountryCityFields } from "@/features/trainers/components/trainer-country-city-fields";

type YesNo = "yes" | "no";

type FormErrors = {
  full_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  marketing_plan?: string;
  accept_terms?: string;
  general?: string;
};

export function MarketerApplicationForm({ applicationsOpen }: { applicationsOpen: boolean }) {
  const baseId = useId();

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [poBox, setPoBox] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");

  // Questions
  const [isBlogger, setIsBlogger] = useState<YesNo>("no");
  const [hasEmailList, setHasEmailList] = useState<YesNo>("no");
  const [hasSocialFollowers, setHasSocialFollowers] = useState<YesNo>("no");
  const [isInfluencer, setIsInfluencer] = useState<YesNo>("no");
  const [hasWhatsappList, setHasWhatsappList] = useState<YesNo>("no");

  const [channels, setChannels] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [marketingPlan, setMarketingPlan] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  if (!applicationsOpen) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-panel border border-line bg-surface p-8 text-center">
        <AlertCircle className="size-12 text-accent" />
        <h3 className="m-0 text-xl font-bold">باب التقديم مغلق حالياً</h3>
        <p className="m-0 max-w-md text-fg-muted">
          نعتذر منك، استقبال طلبات المسوقين الجدد مغلق مؤقتاً. تابع قنواتنا وحساباتنا لمعرفة موعد إعادة فتح باب التقديم.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-panel border border-green/30 bg-surface p-8 text-center sm:p-12" role="status">
        <div className="grid size-16 place-items-center rounded-full bg-green/10 text-green">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="m-0 text-2xl font-bold text-fg">تم استلام طلبك بنجاح!</h3>
        <p className="m-0 max-w-lg text-fg-muted leading-relaxed">
          شكرًا لاهتمامك بالانضمام إلى برنامج المسوقين بالعمولة مع ماستري أكاديمي. يقوم فريقنا حاليًا بمراجعة طلبك وبياناتك وسنقوم بالتواصل معك عبر البريد الإلكتروني خلال <strong>48 ساعة</strong> لتزويدك برابط الإحالة ولوحة التحكم.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: FormErrors = {};
    if (!fullName.trim() || fullName.trim().length < 5) {
      newErrors.full_name = "يرجى إدخال الاسم الثلاثي بالكامل (5 أحرف على الأقل)";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    }
    if (!phone.trim() || phone.trim().length < 7) {
      newErrors.phone = "يرجى إدخال رقم هاتف صحيح";
    }
    if (!country.trim()) {
      newErrors.country = "يرجى اختيار الدولة";
    }
    if (!city.trim()) {
      newErrors.city = "يرجى إدخال أو اختيار المدينة";
    }
    if (!address.trim() || address.trim().length < 3) {
      newErrors.address = "يرجى إدخال العنوان بالتفصيل";
    }
    if (!marketingPlan.trim() || marketingPlan.trim().length < 20) {
      newErrors.marketing_plan = "يرجى كتابة خطتك التسويقية المقترحة (20 حرفاً على الأقل)";
    }
    if (!acceptTerms) {
      newErrors.accept_terms = "يجب الموافقة على الشروط والأحكام للمتابعة";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/b2c/affiliates/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/[\s-]/g, ""),
          country: country.trim(),
          country_code: countryCode ? countryCode.toUpperCase() : null,
          city: city.trim(),
          po_box: poBox.trim() || null,
          postal_code: postalCode.trim() || null,
          address: address.trim(),
          is_blogger: isBlogger,
          has_email_list: hasEmailList,
          has_social_followers: hasSocialFollowers,
          is_influencer: isInfluencer,
          has_whatsapp_list: hasWhatsappList,
          channels: channels.trim() || null,
          audience_size: audienceSize.trim() || null,
          marketing_plan: marketingPlan.trim(),
          accept_terms: true,
          website: honeypot.trim() || null,
        }),
      });

      if (res.status === 202 || res.ok) {
        setSubmitted(true);
      } else if (res.status === 409) {
        setErrors({ general: "هذا البريد الإلكتروني مسجل بالفعل كمسوّق أو قدّم طلباً سابقاً." });
      } else if (res.status === 403) {
        setErrors({ general: "نعتذر، تم إغلاق باب التقديم حالياً." });
      } else {
        const data = await res.json().catch(() => null);
        setErrors({ general: data?.detail || "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى." });
      }
    } catch {
      setErrors({ general: "تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <QueryProvider>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <FormError message={errors.general ?? null} />

      {/* Honeypot field for anti-spam */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {/* Personal / Contact Details */}
      <fieldset className="m-0 flex flex-col gap-5 border-0 border-t border-line p-0 pt-6">
        <legend className="float-start mb-5 w-full p-0 text-lg font-bold">1. البيانات الشخصية ومعلومات الاتصال</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={`${baseId}-full-name`}
            label="الاسم الثلاثي بالكامل"
            error={errors.full_name}
            required
          >
            <input
              id={`${baseId}-full-name`}
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: محمد أحمد العتيبي"
              {...describedBy(`${baseId}-full-name`, errors.full_name)}
              className="ma-input"
            />
          </Field>

          <Field
            id={`${baseId}-email`}
            label="البريد الإلكتروني"
            error={errors.email}
            hint="سيُستخدم لإرسال إشعارات الاعتماد والعمولات"
            required
          >
            <input
              id={`${baseId}-email`}
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              {...describedBy(`${baseId}-email`, errors.email, "سيُستخدم لإرسال إشعارات الاعتماد والعمولات")}
              className="ma-input"
            />
          </Field>
        </div>

        <PhoneInputField
          id={`${baseId}-phone`}
          label="رقم الجوال (مع مفتاح الدولة)"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TrainerCountryCityFields
            baseId={`${baseId}-loc`}
            defaultCountry={country}
            defaultCity={city}
            countryError={errors.country}
            cityError={errors.city}
            onCountryChange={(countryName, cCode) => {
              setCountry(countryName);
              setCountryCode(cCode);
            }}
            onCityChange={setCity}
          />
        </div>

        <Field
          id={`${baseId}-address`}
          label="العنوان التفصيلي (الشارع والحي)"
          error={errors.address}
          required
        >
          <input
            id={`${baseId}-address`}
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="مثال: حي العليا، طريق الملك فهد"
            {...describedBy(`${baseId}-address`, errors.address)}
            className="ma-input"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${baseId}-po-box`} label="صندوق البريد (اختياري)">
            <input
              id={`${baseId}-po-box`}
              type="text"
              value={poBox}
              onChange={(e) => setPoBox(e.target.value)}
              placeholder="مثال: 12345"
              className="ma-input"
            />
          </Field>
          <Field id={`${baseId}-postal-code`} label="الرمز البريدي (اختياري)">
            <input
              id={`${baseId}-postal-code`}
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="مثال: 11564"
              className="ma-input"
            />
          </Field>
        </div>
      </fieldset>

      {/* Marketing Presence & Channels */}
      <fieldset className="m-0 flex flex-col gap-5 border-0 border-t border-line p-0 pt-6">
        <legend className="float-start mb-5 w-full p-0 text-lg font-bold">2. القنوات التسويقية وتواجدك الرقمي</legend>

        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm font-bold text-fg">اختر كل ما ينطبق على نشاطك الحالي:</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: "is_blogger", label: "هل تدير مدونة أو موقعاً إلكترونياً؟", val: isBlogger, set: setIsBlogger },
              { id: "has_email_list", label: "هل تملك نشرة أو قائمة بريدية؟", val: hasEmailList, set: setHasEmailList },
              { id: "has_social_followers", label: "هل لديك متابعون على وسائل التواصل؟", val: hasSocialFollowers, set: setHasSocialFollowers },
              { id: "is_influencer", label: "هل أنت صانع محتوى / مؤثر؟", val: isInfluencer, set: setIsInfluencer },
              { id: "has_whatsapp_list", label: "هل تدير مجموعات واتساب أو تيليجرام؟", val: hasWhatsappList, set: setHasWhatsappList },
            ].map((q) => (
              <div
                key={q.id}
                className="flex flex-col gap-3 rounded-ctl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-fg">{q.label}</span>
                <div className="flex shrink-0 flex-wrap items-center gap-2" role="group" aria-label={q.label}>
                  <ChoiceChip selected={q.val === "yes"} onToggle={() => q.set("yes")}>
                    نعم
                  </ChoiceChip>
                  <ChoiceChip selected={q.val === "no"} onToggle={() => q.set("no")}>
                    لا
                  </ChoiceChip>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Field
          id={`${baseId}-channels`}
          label="روابط قنواتك ومواقعك وحساباتك"
          hint="ضع روابط حساباتك النشطة (X، يوتيوب، إنستغرام، لينكدإن، أو رابط موقعك/مدونتك)"
        >
          <textarea
            id={`${baseId}-channels`}
            rows={3}
            dir="ltr"
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            placeholder="https://x.com/username&#10;https://youtube.com/@channel&#10;https://myblog.com"
            className="ma-input text-start"
          />
        </Field>

        <Field
          id={`${baseId}-audience-size`}
          label="حجم الجمهور أو المتابعين التقريبي"
          hint="مثال: 15,000 متابع على X، أو 5,000 مشترك في النشرة البريدية"
        >
          <input
            id={`${baseId}-audience-size`}
            type="text"
            value={audienceSize}
            onChange={(e) => setAudienceSize(e.target.value)}
            placeholder="مثال: 20 ألف متابع، 3 آلاف مشترك"
            className="ma-input"
          />
        </Field>
      </fieldset>

      {/* Marketing Plan */}
      <fieldset className="m-0 flex flex-col gap-5 border-0 border-t border-line p-0 pt-6">
        <legend className="float-start mb-5 w-full p-0 text-lg font-bold">3. الخطة التسويقية</legend>

        <Field
          id={`${baseId}-marketing-plan`}
          label="كيف تخطط للترويج لدورات وبرامج ماستري؟"
          error={errors.marketing_plan}
          hint="اذكر الطرق والأساليب التي ستعتمد عليها (مثال: مراجعة البرامج التدريبية، الترويج عبر المقالات، حملات تسويقية للجمهور المستهدف...)"
          required
        >
          <textarea
            id={`${baseId}-marketing-plan`}
            rows={4}
            required
            value={marketingPlan}
            onChange={(e) => setMarketingPlan(e.target.value)}
            placeholder="اكتب هنا نبذة موجزة عن خطتك لترويج البرامج التدريبية والجمهور المستهدف..."
            {...describedBy(
              `${baseId}-marketing-plan`,
              errors.marketing_plan,
              "اذكر الطرق والأساليب التي ستعتمد عليها"
            )}
            className="ma-input"
          />
        </Field>
      </fieldset>

      {/* Terms & Submit */}
      <div className="flex flex-col gap-5 border-0 border-t border-line pt-6">
        <label className="ma-check items-start">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          <span className="text-sm leading-relaxed text-fg-muted">
            أوافق على{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline">
              شروط وأحكام برنامج التسويق بالعمولة
            </a>{" "}
            وأتعهد بالالتزام بأخلاقيات التسويق الرقمي وعدم استخدام وسائل تضليلية أو غير مصرح بها.
          </span>
        </label>
        {errors.accept_terms ? <FormError message={errors.accept_terms} /> : null}

        <Button type="submit" variant="primary" size="lg" block disabled={submitting}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">جاري إرسال الطلب...</span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Send className="size-4 rotate-180" />
              إرسال طلب الانضمام
            </span>
          )}
        </Button>
      </div>
    </form>
    </QueryProvider>
  );
}
