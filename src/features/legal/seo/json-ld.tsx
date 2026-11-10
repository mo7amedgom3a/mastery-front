import { getSiteUrl } from "@/config/env";
import { JsonLd, breadcrumbList, webPage } from "@/lib/seo/json-ld";

/** WebPage + breadcrumb trail for a legal document, with its visible "last updated" date. */
export function LegalJsonLd({
  path,
  title,
  description,
  updated,
}: {
  path: string;
  title: string;
  description: string;
  updated: string;
}) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;

  return (
    <JsonLd
      graph={[
        webPage({ url, name: title, description, dateModified: updated }),
        breadcrumbList([
          { name: "الرئيسية", item: `${siteUrl}/` },
          { name: title, item: url },
        ]),
      ]}
    />
  );
}
