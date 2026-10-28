"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, BadgeCheck, ChevronLeft, Clock3 } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { certificateQueries, type MyCertificate } from "@/lib/api/certificates";
import { formatDate } from "@/lib/format";

import { CertificateNameForm } from "./components/certificate-name-form";

const KIND_LABELS: Record<string, string> = { course: "دورة", diploma: "دبلوم", live_diploma: "دبلوم مباشر" };

/** Every certificate the student earned, newest first, plus the English name they're printed with. */
export function CertificatesPage() {
  const query = useQuery(certificateQueries.mine());

  if (query.isPending) {
    return (
      <div role="status" className="grid gap-4 sm:grid-cols-2">
        <span className="sr-only">جارٍ تحميل الشهادات…</span>
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">تعذّر تحميل الشهادات</p>
          <p className="ma-alert__text">تحقّق من اتصالك ثم حدّث الصفحة.</p>
        </div>
      </div>
    );
  }

  const { items, certificate_name: name, needs_name: needsName } = query.data;

  return (
    <div className="flex flex-col gap-8">
      {needsName ? <CertificateNameForm current={name ?? null} pending /> : null}

      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6 md:p-10">
          <Award aria-hidden="true" className="size-8 text-accent" />
          <h2 className="m-0 text-2xl leading-10 font-bold">لا توجد شهادات بعد</h2>
          <p className="m-0 max-w-[52ch] text-fg-muted">
            أكمل أي دورة أو دبلوم لتحصل على شهادة إتمام رقمية يمكنك تحميلها ومشاركتها على LinkedIn، ويستطيع أي شخص
            التحقق من صحتها.
          </p>
          <ButtonLink href={routes.studentAccess} variant="primary">
            تابع تعلّمك
          </ButtonLink>
        </div>
      ) : (
        <ul aria-label="شهاداتي" className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          {items.map((cert) => (
            <li key={cert.certificate_id}>
              <CertificateCard cert={cert} />
            </li>
          ))}
        </ul>
      )}

      {!needsName && items.length > 0 ? (
        <details className="rounded-panel border border-line p-5">
          <summary className="cursor-pointer font-bold">الاسم المطبوع على شهاداتك</summary>
          <div className="mt-4">
            <p className="m-0 mb-4 text-sm text-fg-muted">
              تغيير الاسم هنا يُطبّق على الشهادات القادمة. لتصحيح اسم على شهادة صادرة تواصل مع الدعم الفني.
            </p>
            <CertificateNameForm current={name ?? null} pending={false} />
          </div>
        </details>
      ) : null}
    </div>
  );
}

function CertificateCard({ cert }: { cert: MyCertificate }) {
  const issued = cert.status === "issued";
  return (
    <AppLink
      href={routes.studentCertificate(cert.certificate_id)}
      className="group flex h-full flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5 no-underline transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <Award aria-hidden="true" className="size-6" />
        </span>
        <span className="flex flex-wrap justify-end gap-2">
          {cert.cpd ? <span className="ma-tag ma-tag--sky">CPD</span> : null}
          {issued ? (
            <span className="ma-tag ma-tag--green">
              <BadgeCheck aria-hidden="true" className="size-3.5" /> صادرة
            </span>
          ) : (
            <span className="ma-tag ma-tag--yellow">
              <Clock3 aria-hidden="true" className="size-3.5" /> بانتظار الاسم
            </span>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-fg-muted">{KIND_LABELS[cert.product_type ?? ""] ?? "برنامج"}</span>
        <h2 className="m-0 text-lg leading-8 font-bold" dir="ltr" style={{ textAlign: "start" }}>
          {cert.title}
        </h2>
      </div>
      <dl className="m-0 mt-auto grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-fg-muted">تاريخ الإصدار</dt>
          <dd className="m-0">{cert.issued_at ? formatDate(cert.issued_at) : "—"}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">رقم الشهادة</dt>
          <dd className="m-0 font-mono" dir="ltr">
            {cert.public_code}
          </dd>
        </div>
      </dl>
      <span className="inline-flex items-center gap-1 text-sm font-bold text-accent">
        عرض الشهادة ومشاركتها <ChevronLeft aria-hidden="true" className="size-4" />
      </span>
    </AppLink>
  );
}
