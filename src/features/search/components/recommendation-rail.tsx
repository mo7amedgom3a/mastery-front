"use client";

import { useEffect, useState } from "react";

import { CardCarousel } from "@/components/motion/card-carousel";
import { ProductCard } from "@/components/ui/product-card";
import { toCard } from "@/features/product-detail/sections/product-rails";
import { cn } from "@/lib/cn";
import { getClientFingerprint } from "@/lib/customer-tracking";

import type { RecommendationsData } from "../api/get-recommendations";

const copy: Record<RecommendationsData["source"], { title: string; lead: string }> = {
  personal: { title: "مقترحة لك", lead: "اقتراحات مبنية على ما تصفّحته وبحثت عنه." },
  starter: { title: "ابدأ من هنا", lead: "برامج مختارة من مجالات متعددة، نقطة بداية جيدة." },
};

const TITLE_ID = "recommendations-title";

/**
 * Programs picked for this visitor, or a starter set across categories when there is no history
 * to go on. Loaded in the browser (the fingerprint lives there); the space is held by a skeleton
 * meanwhile, and the section leaves the page if nothing comes back.
 */
export function RecommendationRail({ className }: { className?: string }) {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fingerprint = getClientFingerprint();
    fetch("/api/search/recommendations", {
      headers: fingerprint ? { "X-Client-Fingerprint": fingerprint } : undefined,
      signal: controller.signal,
    })
      .then((response) => (response.ok ? (response.json() as Promise<RecommendationsData>) : Promise.reject(response)))
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  if (failed || (data && data.cards.length === 0)) {
    return null;
  }

  if (!data) {
    return (
      <div role="status" className={cn("min-w-0", className)}>
        <span className="sr-only">جارٍ تحميل الاقتراحات…</span>
        <div aria-hidden="true" className="h-8 w-40 animate-pulse bg-line" />
        <ul aria-hidden="true" className="m-0 mt-6 grid list-none gap-6 p-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <li key={index} className={cn("border border-line", index > 0 && "max-sm:hidden", index > 1 && "max-md:hidden", index > 2 && "max-lg:hidden")}>
              <div className="aspect-[16/10] animate-pulse bg-line" />
              <div className="flex flex-col gap-3 p-4">
                <div className="h-5 w-3/4 animate-pulse bg-line" />
                <div className="h-4 w-1/2 animate-pulse bg-line" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const { title, lead } = copy[data.source];
  return (
    <section aria-labelledby={TITLE_ID} className={cn("min-w-0", className)}>
      <h2 id={TITLE_ID} className="m-0 text-2xl leading-10 font-bold">
        {title}
      </h2>
      <p className="m-0 mt-1 text-fg-muted">{lead}</p>
      <CardCarousel label={title} className="mt-6">
        {data.cards.map((card) => {
          const { key, ...props } = toCard(card);
          return <ProductCard key={key} {...props} />;
        })}
      </CardCarousel>
    </section>
  );
}
