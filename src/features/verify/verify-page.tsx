import { BadgeCheck, Ban, SearchX, ShieldAlert } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/config/site";
import { publicCertificateImageUrl, type CertificateVerification } from "@/lib/api/certificates";
import { formatDate } from "@/lib/format";

import { VerifyForm } from "./components/verify-form";

/** Shell of the public verification pages: title band, the result (when a code was given), the lookup form. */
export function VerifyPage({ result, code }: { result?: CertificateVerification | null; code?: string }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <header className="border-b border-line bg-surface-alt">
          <div className="ma-container flex flex-col items-start gap-3 py-12 md:py-16">
            <p className="m-0 text-sm font-bold text-accent">{siteConfig.name}</p>
            <h1 className="m-0 text-3xl leading-[1.4] font-bold md:text-4xl">التحقق من الشهادات</h1>
            <p className="m-0 max-w-[60ch] leading-7 text-fg-muted">
              تأكّد من صحة أي شهادة صادرة عن ماستري أكاديمي برقمها المطبوع (ID No) أو بمسح رمز QR الموجود عليها.
            </p>
          </div>
        </header>
        <div className="ma-container flex max-w-3xl flex-col gap-10 py-10 md:py-14">
          {code !== undefined ? <VerificationResult result={result ?? null} code={code} /> : null}
          <section aria-labelledby="verify-lookup" className="flex flex-col gap-4">
            <h2 id="verify-lookup" className="m-0 text-xl font-bold">
              {code !== undefined ? "تحقّق من شهادة أخرى" : "أدخل رقم الشهادة"}
            </h2>
            <VerifyForm />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function VerificationResult({ result, code }: { result: CertificateVerification | null; code: string }) {
  if (result === null) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <ShieldAlert aria-hidden="true" className="size-6 shrink-0" />
        <div>
          <p className="ma-alert__title">تعذّر التحقق الآن</p>
          <p className="ma-alert__text">حاول مجدداً بعد قليل.</p>
        </div>
      </div>
    );
  }
  if (result.status === "not_found") {
    return (
      <div className="ma-alert ma-alert--danger" role="status">
        <SearchX aria-hidden="true" className="size-6 shrink-0" />
        <div>
          <p className="ma-alert__title">لا توجد شهادة بهذا الرقم</p>
          <p className="ma-alert__text">
            تأكّد من كتابة الرقم <span dir="ltr" className="font-mono">{code}</span> كما هو مطبوع على الشهادة.
          </p>
        </div>
      </div>
    );
  }
  if (result.status === "revoked") {
    return (
      <div className="ma-alert ma-alert--danger" role="status">
        <Ban aria-hidden="true" className="size-6 shrink-0" />
        <div>
          <p className="ma-alert__title">هذه الشهادة ملغاة</p>
          <p className="ma-alert__text">
            الشهادة رقم <span dir="ltr" className="font-mono">{result.public_code}</span> لم تعد سارية
            {result.revoked_at ? ` منذ ${formatDate(result.revoked_at)}` : ""}.
          </p>
        </div>
      </div>
    );
  }
  if (result.status !== "valid") {
    return (
      <div className="ma-alert ma-alert--danger" role="status">
        <ShieldAlert aria-hidden="true" className="size-6 shrink-0" />
        <div>
          <p className="ma-alert__title">تعذّر تأكيد هذه الشهادة</p>
          <p className="ma-alert__text">بيانات الشهادة لا تطابق سجلاتنا. تواصل مع الدعم الفني للتأكد.</p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="verify-result"
      className="flex flex-col gap-6 rounded-panel border-2 border-green-600/40 bg-surface p-6 md:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-green-600/10 text-green-700">
          <BadgeCheck aria-hidden="true" className="size-7" />
        </span>
        <div>
          <h2 id="verify-result" className="m-0 text-xl font-bold">
            شهادة صحيحة وسارية
          </h2>
          <p className="m-0 text-sm text-fg-muted">صادرة عن {result.issuer}</p>
        </div>
      </div>
      <dl className="m-0 grid gap-4 sm:grid-cols-2">
        <Item label="الاسم">
          <bdi dir="ltr">{result.recipient_name ?? "—"}</bdi>
        </Item>
        {result.title ? (
          <Item label="البرنامج">
            <bdi dir="ltr">{result.title}</bdi>
          </Item>
        ) : null}
        <Item label="رقم الشهادة">
          <span dir="ltr" className="font-mono">
            {result.public_code}
          </span>
        </Item>
        <Item label="تاريخ الإصدار">{result.issued_at ? formatDate(result.issued_at) : "—"}</Item>
        {result.training_hours ? <Item label="ساعات التدريب">{result.training_hours} ساعة</Item> : null}
        {result.cpd ? <Item label="اعتماد CPD">{result.cpd_hours ? `${result.cpd_hours} ساعة CPD` : "معتمدة"}</Item> : null}
      </dl>
      {result.legacy ? (
        <p className="m-0 text-sm text-fg-muted">شهادة صادرة من منصة ماستري السابقة.</p>
      ) : (
        <figure className="m-0 overflow-hidden rounded-control border border-line bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic PNG from the verification API */}
          <img
            src={publicCertificateImageUrl(result.public_code)}
            alt={`شهادة ${result.title ?? ""} باسم ${result.recipient_name ?? ""}`}
            width={1600}
            height={1131}
            loading="lazy"
            className="block h-auto w-full"
          />
        </figure>
      )}
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="m-0 text-lg font-bold">{children}</dd>
    </div>
  );
}
