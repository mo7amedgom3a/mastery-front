import type { Metadata } from "next";
import { connection } from "next/server";

import { routes } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";
import { loadVerification } from "@/features/verify/api/load-verification";
import { CertificateJsonLd } from "@/features/verify/seo/json-ld";
import { VerifyPage } from "@/features/verify/verify-page";

// Rendered per request (`connection()` below), never prerendered: Amplify does not finish ISR
// background regeneration, so a prerendered copy (empty if the API was down) would be served forever.
// `revalidate` still sets how long this page's backend reads stay in the data cache, and
// POST /api/revalidate still refreshes them.
export const revalidate = 60;

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
  await connection();
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
