import { getSiteUrl } from "@/config/env";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { CertificateVerification } from "@/lib/api/certificates";

/** Escapes `<` so user-controlled strings can never close the script tag. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** A verified certificate as an `EducationalOccupationalCredential` (recognised by search and AI engines). */
export function CertificateJsonLd({ result }: { result: CertificateVerification }) {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    name: result.title ? `Certificate of Completion — ${result.title}` : "Certificate of Completion",
    identifier: result.public_code,
    credentialCategory: "certificate",
    url: `${siteUrl}${routes.verifyCertificate(result.public_code)}`,
    ...(result.issued_at ? { dateCreated: result.issued_at } : {}),
    recognizedBy: { "@type": "EducationalOrganization", name: siteConfig.nameEn, url: siteUrl },
    ...(result.recipient_name ? { about: { "@type": "Person", name: result.recipient_name } } : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}
