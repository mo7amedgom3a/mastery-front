"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Check, Copy, Download, ExternalLink, FileText, ImageDown, Share2 } from "lucide-react";
import { useState } from "react";

import { SocialIcon, type SocialNetwork } from "@/components/icons/social-icons";
import { AppLink } from "@/components/ui/app-link";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import {
  certificateImageUrl,
  certificatePdfUrl,
  certificateQueries,
  type MyCertificate,
} from "@/lib/api/certificates";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

import { CertificateNameForm } from "./components/certificate-name-form";
import { linkedInAddToProfileUrl, shareLinks, shareText, type ShareCertificate } from "./model/share";

/** One certificate: the PDF itself, its details, download, LinkedIn and social sharing, verification link. */
export function CertificateDetailPage({ certificateId }: { certificateId: string }) {
  const query = useQuery(certificateQueries.one(certificateId));

  if (query.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">جارٍ تحميل الشهادة…</span>
        <Skeleton className="aspect-[297/210] w-full" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="ma-alert ma-alert--warning" role="alert">
        <div>
          <p className="ma-alert__title">{notFound ? "لم نجد هذه الشهادة" : "تعذّر تحميل الشهادة"}</p>
          <p className="ma-alert__text">
            {notFound ? "قد يكون الرابط غير صحيح أو أُلغيت الشهادة." : "تحقّق من اتصالك ثم حدّث الصفحة."}
          </p>
          <AppLink href={routes.studentCertificates} className="ma-alert__text font-bold">
            العودة إلى شهاداتي
          </AppLink>
        </div>
      </div>
    );
  }

  const cert = query.data;
  if (cert.status !== "issued") {
    return (
      <div className="flex flex-col gap-6">
        <CertificateNameForm
          current={cert.recipient_name ?? null}
          pending
          certificateTitle={cert.title}
          onSaved={() => void query.refetch()}
        />
      </div>
    );
  }
  return <IssuedCertificate cert={cert} />;
}

function IssuedCertificate({ cert }: { cert: MyCertificate }) {
  const share: ShareCertificate = {
    title: cert.title,
    publicCode: cert.public_code,
    verifyUrl: cert.verify_url,
    issuedAt: cert.issued_at ?? null,
  };
  const pdfUrl = certificatePdfUrl(cert.certificate_id);
  const imageUrl = certificateImageUrl(cert.certificate_id);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-4">
        {/* The issued certificate as an image: renders on every device, unlike an embedded PDF. */}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener"
          className="group relative block overflow-hidden rounded-panel border border-line-strong bg-white"
        >
          <CertificateImage src={imageUrl} alt={`شهادة ${cert.title} باسم ${cert.recipient_name ?? ""}`} />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent p-3 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ExternalLink aria-hidden="true" className="me-1 size-4" /> فتح ملف PDF
          </span>
        </a>
        <div className="flex flex-wrap gap-3">
          <a href={certificatePdfUrl(cert.certificate_id, true)} className={buttonClass({ variant: "primary" })}>
            <Download aria-hidden="true" className="size-4" /> تحميل PDF
          </a>
          <a href={certificateImageUrl(cert.certificate_id, true)} className={buttonClass({ variant: "soft" })}>
            <ImageDown aria-hidden="true" className="size-4" /> تحميل كصورة
          </a>
          <a href={pdfUrl} target="_blank" rel="noopener" className={buttonClass({ variant: "ghost" })}>
            <FileText aria-hidden="true" className="size-4" /> فتح PDF في نافذة جديدة
          </a>
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <section aria-labelledby="cert-details-title" className="rounded-panel border border-line-strong bg-surface p-5">
          <h2 id="cert-details-title" className="m-0 mb-4 flex items-center gap-2 text-lg font-bold">
            <BadgeCheck aria-hidden="true" className="size-5 text-accent" /> تفاصيل الشهادة
          </h2>
          <dl className="m-0 flex flex-col gap-3 text-sm">
            <Row label="البرنامج">
              <bdi dir="ltr">{cert.title}</bdi>
            </Row>
            <Row label="الاسم">
              <bdi dir="ltr">{cert.recipient_name}</bdi>
            </Row>
            <Row label="رقم الشهادة">
              <span className="font-mono" dir="ltr">
                {cert.public_code}
              </span>
            </Row>
            <Row label="تاريخ الإصدار">{cert.issued_at ? formatDate(cert.issued_at) : "—"}</Row>
            {cert.training_hours ? <Row label="ساعات التدريب">{cert.training_hours} ساعة</Row> : null}
            {cert.cpd ? (
              <Row label="اعتماد CPD">
                {cert.cpd_hours ? `${cert.cpd_hours} ساعة CPD` : "معتمدة"}
                {cert.cpd_ref ? (
                  <>
                    {" · "}
                    <span dir="ltr">{cert.cpd_ref}</span>
                  </>
                ) : null}
              </Row>
            ) : null}
          </dl>
        </section>

        <section aria-labelledby="cert-share-title" className="rounded-panel border border-line-strong bg-surface p-5">
          <h2 id="cert-share-title" className="m-0 mb-4 flex items-center gap-2 text-lg font-bold">
            <Share2 aria-hidden="true" className="size-5 text-accent" /> شارك إنجازك
          </h2>
          <div className="flex flex-col gap-3">
            <a
              href={linkedInAddToProfileUrl(share)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: "primary", block: true })}
            >
              <SocialIcon network="linkedin" className="size-4" /> أضفها إلى ملفك على LinkedIn
            </a>
            <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
              {shareLinks(share).map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass({ variant: "soft", size: "sm", block: true })}
                  >
                    {link.id !== "whatsapp" ? <SocialIcon network={link.id as SocialNetwork} className="size-4" /> : null}
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <NativeShare share={share} imageUrl={imageUrl} />
            <CopyLink url={cert.verify_url} />
          </div>
        </section>

        <p className="m-0 text-sm leading-6 text-fg-muted">
          يستطيع أي شخص — كجهة توظيف — التحقق من صحة شهادتك عبر رمز QR المطبوع عليها أو من{" "}
          <AppLink href={routes.verifyCertificate(cert.public_code)} className="font-bold text-accent">
            صفحة التحقق
          </AppLink>
          .
        </p>
        <ButtonLink href={routes.studentCertificates} variant="ghost">
          كل شهاداتي
        </ButtonLink>
      </aside>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-fg-muted">{label}</dt>
      <dd className="m-0 text-end font-bold">{children}</dd>
    </div>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass({ variant: "ghost", size: "sm", block: true })}
      onClick={() => {
        void navigator.clipboard?.writeText(url).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
      <span role="status">{copied ? "تم نسخ رابط التحقق" : "نسخ رابط التحقق"}</span>
    </button>
  );
}

/** The certificate image while it loads (the PNG is rendered on first view). */
function CertificateImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  return (
    <div className="relative aspect-[297/210] w-full">
      {state === "loading" ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
      {state === "failed" ? (
        <p className="absolute inset-0 m-0 grid place-items-center p-6 text-center text-sm text-ink">
          تعذّر عرض الصورة. افتح ملف PDF بدلاً منها.
        </p>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- private, per-user PNG behind the session */}
      <img
        src={src}
        alt={alt}
        className={cn("block size-full object-contain", state !== "ready" && "opacity-0")}
        onLoad={() => setState("ready")}
        onError={() => setState("failed")}
      />
    </div>
  );
}

/**
 * The device's share sheet (phones): shares the certificate image itself with the verification link,
 * so WhatsApp, Instagram or LinkedIn receive the picture. Falls back to the link when files can't be shared.
 */
function NativeShare({ share, imageUrl }: { share: ShareCertificate; imageUrl: string }) {
  const [supported] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");
  const [busy, setBusy] = useState(false);
  if (!supported) return null;

  const run = async () => {
    setBusy(true);
    try {
      const data: ShareData = { title: share.title, text: shareText(share), url: share.verifyUrl };
      try {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], `mastery-certificate-${share.publicCode}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) data.files = [file];
      } catch {
        // No image: share the link alone.
      }
      await navigator.share(data);
    } catch {
      // Dismissed by the user.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      className={buttonClass({ variant: "soft", size: "sm", block: true })}
      onClick={() => void run()}
    >
      <Share2 aria-hidden="true" className="size-4" /> {busy ? "جارٍ التجهيز…" : "مشاركة الصورة…"}
    </button>
  );
}
