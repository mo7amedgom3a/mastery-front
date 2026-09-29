import { Clock, Layers, UserRound } from "lucide-react";

import { actionsFor } from "@/components/shop/card-actions-for";
import type { BrandColor } from "@/components/ui/brand-colors";
import type { ProductCardMeta } from "@/components/ui/product-card";
import { ProductRailSection } from "@/features/landing/components/product-rail-section";
import { formatCount } from "@/lib/format";

import type { RailCardVM } from "../model/types";

const COURSE_FORMS = { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" };
const kindColor: Record<RailCardVM["kind"], BrandColor> = { course: "coral", diploma: "yellow", package: "green" };

function toCard(card: RailCardVM) {
  const meta: ProductCardMeta[] = [];
  if (card.instructor) meta.push({ icon: UserRound, label: card.instructor });
  if (card.duration) meta.push({ icon: Clock, label: card.duration });
  if (card.courseCount) meta.push({ icon: Layers, label: formatCount(card.courseCount, COURSE_FORMS) });
  return {
    key: card.key,
    href: card.href,
    title: card.title,
    image: card.image,
    color: kindColor[card.kind],
    tag: card.tag,
    summary: card.summary,
    meta,
    price: card.price,
    actions: actionsFor(card.kind, card),
  };
}

type RailProps = { cards: readonly RailCardVM[] };

/** Items the catalog links to this one: same category, same trainer, packages that include it. */
export function RelatedRail({ cards }: RailProps) {
  return (
    <ProductRailSection
      id="related"
      label="ذات صلة"
      title="برامج ذات صلة"
      lead="دورات ودبلومات وباقات قريبة من هذا الموضوع، لتكمل بها مسارك."
      cards={cards.map(toCard)}
    />
  );
}

/** Items the recommendation engine scores as similar (shared skills, tags and categories). */
export function RecommendedRail({ cards }: RailProps) {
  return (
    <ProductRailSection
      id="recommended"
      label="مقترحة لك"
      title="قد يعجبك أيضاً"
      lead="اقتراحات مبنية على المهارات والمجالات التي يغطيها هذا البرنامج."
      tone="alt"
      cards={cards.map(toCard)}
    />
  );
}
