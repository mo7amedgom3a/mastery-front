import { BidiText } from "@/components/content/bidi";

import type { AdvisorProduct, NeedsAnalysis } from "../model/types";

/** The structured result stays readable even when there are no training products. */
export function AdvisorNeedsAnalysis({ analysis, products }: { analysis: NeedsAnalysis; products: AdvisorProduct[] }) {
  if (analysis.status === "discovering") {
    return <p className="m-0 text-xs leading-6 text-fg-muted" role="status">اكتشاف الاحتياجات · السؤال {analysis.question_count} من 5 كحد أقصى</p>;
  }
  const sections: [string, string[]][] = [
    ["التحديات حسب الأولوية", analysis.pain_points],
    ["فجوات ذكرتها", analysis.reported_gaps],
    ["مهارات تحتاج إلى تقييم", analysis.skills_to_assess],
    ["أسباب محتملة تتجاوز التدريب", analysis.possible_non_training_causes],
    ["الخطوات المقترحة", analysis.recommended_actions],
    ["كيف تقيس التقدم", analysis.success_measures],
    ["ما زال يحتاج إلى توضيح", analysis.uncertainties],
  ];
  const byId = new Map(products.map((product) => [product.product_id, product]));
  return (
    <section aria-label="نتيجة تحليل الاحتياجات" className="rounded-panel border border-line bg-surface p-3 text-sm leading-7">
      <h3 className="m-0 font-bold">{analysis.customer_type === "company" ? "خطة عمل للفريق" : "خطة تطويرك"}{analysis.status === "provisional" ? " · أولية" : ""}</h3>
      {sections.filter(([, items]) => items.length).map(([title, items]) => (
        <div key={title} className="mt-3">
          <h4 className="m-0 font-medium">{title}</h4>
          <ul className="m-0 list-disc ps-5">{items.map((item, index) => <li key={index}><BidiText text={item} /></li>)}</ul>
        </div>
      ))}
      {analysis.product_matches.length ? (
        <div className="mt-3">
          <h4 className="m-0 font-medium">لماذا هذه الخيارات؟</h4>
          <ol className="m-0 list-decimal ps-5">
            {analysis.product_matches.filter((match) => byId.has(match.product_id)).map((match) => (
              <li key={match.product_id}><strong><BidiText text={byId.get(match.product_id)!.title} /></strong>: <BidiText text={match.rationale} /></li>
            ))}
          </ol>
        </div>
      ) : null}
      <p className="mb-0 mt-3 text-xs text-fg-muted">يمكنك تصحيح أي معلومة أو إضافة تفاصيل في المحادثة.</p>
    </section>
  );
}
