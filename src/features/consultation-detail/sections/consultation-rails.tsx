import { routes } from "@/config/routes";
import { ProductRailSection } from "@/features/landing/components/product-rail-section";
import type { RailCardVM } from "@/features/product-detail/model/types";
import { toCard } from "@/features/product-detail/sections/product-rails";

type RailProps = { cards: readonly RailCardVM[] };

/** Other consultations: the same expert's first, then the ones the recommendation engine scores as similar. */
export function ConsultationsRail({ cards }: RailProps) {
  return (
    <ProductRailSection
      id="related"
      label="استشارات"
      title="استشارات قد تهمّك"
      lead="جلسات فردية أخرى مع خبراء ماستري، في هذا المجال وما يقاربه."
      viewAll={{ label: "كل الاستشارات", href: routes.consultations }}
      cards={cards.map((card, position) => toCard(card, { surface: "consultation", position }))}
    />
  );
}

/** Courses, diplomas and packages: what the expert teaches, then related and recommended programs. */
export function ProgramsRail({ cards, expertName }: RailProps & { expertName: string | null }) {
  return (
    <ProductRailSection
      id="recommended"
      label="مقترحة لك"
      title="دورات ودبلومات مقترحة"
      lead={
        expertName
          ? `برامج يقدّمها ${expertName} وأخرى قريبة من موضوع الاستشارة، لتبني عليها ما تخرج به من الجلسة.`
          : "برامج قريبة من موضوع الاستشارة، لتبني عليها ما تخرج به من الجلسة."
      }
      tone="alt"
      cards={cards.map((card, position) => toCard(card, { surface: "consultation", position }))}
    />
  );
}
