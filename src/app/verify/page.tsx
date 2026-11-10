import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getSiteUrl } from "@/config/env";
import { JsonLd, breadcrumbList, webPage } from "@/lib/seo/json-ld";
import { VerifyPage } from "@/features/verify/verify-page";

const title = "التحقق من الشهادات";
const description = "تحقّق من صحة شهادات ماستري أكاديمي برقم الشهادة المطبوع عليها.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: routes.verify },
  openGraph: { ...baseOpenGraph, url: routes.verify, title, description },
};

export default function Page() {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${routes.verify}`;
  return (
    <>
      <VerifyPage />
      <JsonLd
        graph={[
          webPage({ url, name: title, description }),
          breadcrumbList([
            { name: "الرئيسية", item: `${siteUrl}/` },
            { name: title, item: url },
          ]),
        ]}
      />
    </>
  );
}
