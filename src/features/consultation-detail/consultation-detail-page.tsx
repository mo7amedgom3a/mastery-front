import { getSiteUrl } from "@/config/env";
import { toQrMatrix } from "@/features/product-detail/api/share-qr";

import { ConsultationDetailView } from "./consultation-detail-view";
import { consultationFacts } from "./model/facts";
import type { ConsultationDetailData } from "./model/types";

/** The public consultation page: the view plus its share dialog (QR built on the server). */
export function ConsultationDetailPage({ data }: { data: ConsultationDetailData }) {
  const { consultation } = data;
  const { expert } = consultation;
  const shareUrl = `${getSiteUrl()}${consultation.href}`;
  const shareProps = {
    url: shareUrl,
    title: consultation.title,
    kindLabel: "استشارة",
    tagClassName: "ma-tag--lilac",
    facts: consultationFacts(consultation).map((fact) => fact.label),
    trainers: expert ? [{ name: expert.name, avatar: expert.avatar, initial: expert.initial }] : [],
    personLabels: ["الخبير", "الخبراء"] as const,
    // Scans are tagged so they can be told apart from other visits in analytics.
    qr: toQrMatrix(`${shareUrl}?utm_source=qr&utm_medium=share`),
    fileName: `consultation-${consultation.id}`,
  };
  return <ConsultationDetailView data={data} shareProps={shareProps} />;
}
