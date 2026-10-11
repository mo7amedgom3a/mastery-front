"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, UserRound } from "lucide-react";
import { motion } from "motion/react";
import type { Route } from "next";

import { brandColorAt } from "@/components/ui/brand-colors";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard, type ProductCardMeta } from "@/components/ui/product-card";
import { routes } from "@/config/routes";
import { recommendationQueries, type RecommendationCard } from "@/lib/api/recommendations";
import type { ResolvedItem } from "@/lib/shop/contract";
import { formatMinutes, toPlainText } from "@/lib/format";
import { toPricing } from "@/lib/pricing";
import { catalogProductHref } from "@/lib/shop/product-links";

import { parseAmount, productTypeLabel, safeImage } from "../model/products";
import { useCatalogArtwork } from "../model/use-artwork";
import { RecommendationLoader } from "./recommendation-loader";

type RecommendedCardProps = { item: RecommendationCard; index: number; artwork?: ResolvedItem };

function RecommendedCard({ item, index, artwork }: RecommendedCardProps) {
  const duration = formatMinutes(item.duration_minutes) ?? artwork?.duration ?? null;
  const meta: ProductCardMeta[] = [
    artwork?.instructor ? { icon: UserRound, label: artwork.instructor } : null,
    duration ? { icon: Clock, label: duration } : null,
  ].filter((entry) => entry !== null);
  // The B2C catalog has no media for most products yet: fall back to the shop's artwork.
  const image = safeImage(item.image) ?? artwork?.image ?? null;
  return (
    <ProductCard
      href={catalogProductHref(item.slug, item.product_type) as Route}
      title={item.title ?? item.slug}
      image={image}
      // Consultant artwork puts the expert's name at the bottom edge: full width, uncropped
      // (as on the landing page's consultation cards).
      media={item.product_type === "consultation" && image ? "natural" : "wide"}
      color={brandColorAt(index)}
      tag={productTypeLabel(item.product_type)}
      summary={toPlainText(item.description, 140)}
      meta={meta}
      price={toPricing(parseAmount(item.price_amount))}
      ctaLabel="اعرف المزيد"
      tracking={{ surface: "student-recommendations", position: index }}
    />
  );
}

/**
 * Recommendations for the signed-in customer (from their onboarding answers, wishlist and history).
 * Falls back to a link to the catalog when there is nothing to suggest yet.
 */
export function RecommendationGrid({ limit = 6, compactLoader = false }: { limit?: number; compactLoader?: boolean }) {
  const recommendations = useQuery(recommendationQueries.me({ limit }));
  const items = recommendations.data?.items ?? [];
  const artwork = useCatalogArtwork(items.map((item) => item.slug));

  if (recommendations.isPending) return <RecommendationLoader compact={compactLoader} />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-line p-6">
        <p className="m-0 text-fg-muted">
          {recommendations.isError ? "تعذّر تحميل الاقتراحات الآن." : "لا توجد اقتراحات بعد."} تصفّح البرامج واختر ما يناسبك.
        </p>
        <ButtonLink href={routes.search} variant="soft">
          تصفّح البرامج
        </ButtonLink>
      </div>
    );
  }

  return (
    // Columns follow the space the grid gets (dashboard column, profile, onboarding), not the window.
    <div className="@container">
      <ul className="m-0 grid list-none gap-5 p-0 @xl:grid-cols-2 @4xl:grid-cols-3">
        {items.map((item, index) => (
          <motion.li
            key={item.product_id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24, delay: index * 0.07 }}
          >
            <RecommendedCard item={item} index={index} artwork={artwork.get(item.slug)} />
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
