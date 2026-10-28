/** Share targets for a certificate: its public verification page is what gets shared. */

const ORGANIZATION_NAME = "Mastery Academy";

export type ShareCertificate = {
  title: string;
  publicCode: string;
  verifyUrl: string;
  issuedAt: string | null;
};

/** LinkedIn's "Add licence or certification" form, pre-filled. */
export function linkedInAddToProfileUrl(cert: ShareCertificate): string {
  const issued = cert.issuedAt ? new Date(cert.issuedAt) : null;
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.title,
    organizationName: ORGANIZATION_NAME,
    certUrl: cert.verifyUrl,
    certId: cert.publicCode,
  });
  if (issued && !Number.isNaN(issued.getTime())) {
    params.set("issueYear", String(issued.getUTCFullYear()));
    params.set("issueMonth", String(issued.getUTCMonth() + 1));
  }
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export function shareText(cert: ShareCertificate): string {
  return `أتممت «${cert.title}» في ماستري أكاديمي وحصلت على شهادة إتمام 🎓`;
}

export function shareLinks(cert: ShareCertificate): { id: string; label: string; href: string }[] {
  const url = encodeURIComponent(cert.verifyUrl);
  const text = encodeURIComponent(shareText(cert));
  return [
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${text}&url=${url}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${text}%20${url}` },
  ];
}
