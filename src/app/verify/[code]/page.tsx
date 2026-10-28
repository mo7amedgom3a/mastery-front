import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";
import { loadVerification } from "@/features/verify/api/load-verification";
import { CertificateJsonLd } from "@/features/verify/seo/json-ld";
import { VerifyPage } from "@/features/verify/verify-page";

// ISR, short: a revoked certificate must stop reading as valid quickly. Keep in sync with
// VERIFY_REVALIDATE_SECONDS.
export const revalidate = 60;

export function generateStaticParams(): { code: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/verify/[code]">): Promise<Metadata> {
  const { code } = await params;
  const result = await loadVerification(code);
  const valid = result?.status === "valid";
  const title = valid
    ? `شهادة ${result.recipient_name ?? ""} — ${result.title ?? siteConfig.name}`
    : "التحقق من الشهادة";
  const description = valid
    ? `شهادة إتمام صحيحة صادرة عن ماستري أكاديمي (${result.public_code}).`
    : "تحقّق من صحة شهادات ماستري أكاديمي برقم الشهادة.";
  const url = routes.verifyCertificate(decodeURIComponent(code).toUpperCase());
  return {
    title,
    description,
    alternates: { canonical: url },
    // Only valid certificates are worth indexing, and only if the holder shares them.
    robots: { index: false, follow: true },
    openGraph: { ...baseOpenGraph, url, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({ params }: PageProps<"/verify/[code]">) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  const result = await loadVerification(code);
  return (
    <>
      {result?.status === "valid" ? <CertificateJsonLd result={result} /> : null}
      <VerifyPage result={result} code={decoded} />
    </>
  );
}
