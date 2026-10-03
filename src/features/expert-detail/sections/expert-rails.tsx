import { routes } from "@/config/routes";
import { ProductRailSection } from "@/features/landing/components/product-rail-section";
import type { RailCardVM } from "@/features/product-detail/model/types";
import { toCard } from "@/features/product-detail/sections/product-rails";

type RailProps = { cards: readonly RailCardVM[] };

/** Other experts' courses, diplomas and packages in the categories this expert works in. */
export function RelatedProgramsRail({ cards, fields }: RailProps & { fields: string | null }) {
  return (
    <ProductRailSection
      id="related"
      label="ذات صلة"
      title="برامج من خبراء آخرين"
      lead={
        fields
          ? `دورات ودبلومات وباقات في ${fields}، يقدّمها خبراء آخرون على ماستري.`
          : "دورات ودبلومات وباقات في المجالات نفسها، يقدّمها خبراء آخرون على ماستري."
      }
      tone="alt"
      cards={cards.map((card, position) => toCard(card, { surface: "expert-related", position }))}
    />
  );
}

/** Other experts' consultations in the same categories. */
export function RelatedConsultationsRail({ cards }: RailProps) {
  return (
    <ProductRailSection
      id="related-consultations"
      label="استشارات"
      title="استشارات من خبراء آخرين"
      lead="جلسات فردية في المجالات نفسها، مع خبراء آخرين على ماستري."
      viewAll={{ label: "كل الاستشارات", href: routes.consultations }}
      cards={cards.map((card, position) => toCard(card, { surface: "expert-consultations", position }))}
    />
  );
}

/** Items the recommendation engine scores as similar to what this expert offers. */
export function ExpertRecommendedRail({ cards }: RailProps) {
  return (
    <ProductRailSection
      id="recommended"
      label="مقترحة لك"
      title="قد يعجبك أيضاً"
      lead="اقتراحات مبنية على المهارات والمجالات التي يغطيها ما يقدّمه هذا الخبير."
      tone="alt"
      cards={cards.map((card, position) => toCard(card, { surface: "expert-recommended", position }))}
    />
  );
}
