import { CalendarClock, MessagesSquare, UserRound } from "lucide-react";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { buttonClass } from "@/components/ui/button";
import type { EntitlementResponse } from "@/lib/api/commerce";
import { cn } from "@/lib/cn";
import { studentConsultationHref } from "@/lib/shop/product-links";

import { entitlementStatus } from "../model/status";
import { StatusTag } from "./status-tag";

const CARD_SIZES = "(min-width: 1200px) 320px, (min-width: 600px) 50vw, 100vw";

type ConsultationAccessCardProps = {
  entitlement: EntitlementResponse;
  /** The product's name when the caller knows it (the catalog's, or the order line's). */
  title?: string;
  /** Catalog artwork and consultant, when the shop knows the product (see `useCatalogArtwork`). */
  image?: string | null;
  instructor?: string | null;
  duration?: string | null;
  index?: number;
};

/**
 * A consultation the customer owns, in the landing page's consultation-card shape: full-width
 * uncropped artwork, the consultant and session length, and one way in — its details page.
 */
export function ConsultationAccessCard({
  entitlement,
  title: knownTitle,
  image,
  instructor,
  duration,
}: ConsultationAccessCardProps) {
  const active = entitlement.status === "active";
  const apiTitle = entitlement.product_title !== entitlement.product_slug ? entitlement.product_title : null;
  const title = knownTitle ?? apiTitle ?? "استشارة";
  const detailsHref = studentConsultationHref(entitlement.product_slug);
  const meta = [
    instructor ? { icon: UserRound, label: instructor } : null,
    duration ? { icon: CalendarClock, label: duration } : null,
  ].filter((entry) => entry !== null);

  return (
    <article className="ma-card relative h-full">
      <div
        className={cn(
          "ma-card__media relative overflow-hidden p-0",
          image ? "block aspect-auto" : "grid place-items-center",
          brandBg.lilac,
        )}
      >
        {image ? (
          // Consultant artwork sets the expert's name at its bottom edge: full width, uncropped.
          <Image src={image} alt="" width={640} height={640} sizes={CARD_SIZES} className="block h-auto w-full" />
        ) : (
          <MessagesSquare aria-hidden="true" className="size-12 fill-none text-ink" strokeWidth={1.5} />
        )}
      </div>

      <div className="ma-card__body">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ma-tag ma-tag--soft">استشارة</span>
          {active ? null : <StatusTag status={entitlementStatus(entitlement.status)} />}
        </div>
        <h3 className="ma-card__title line-clamp-2">{title}</h3>
        {meta.length > 0 ? (
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-fg-muted">
            {meta.map(({ icon: Icon, label }) => (
              <li key={label} className="flex min-w-0 items-center gap-1.5">
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <bdi className="truncate">{label}</bdi>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {detailsHref ? (
        <div className="ma-card__foot">
          <AppLink
            href={detailsHref}
            aria-label={`عرض تفاصيل الاستشارة: ${title}`}
            className={cn(buttonClass({ variant: active ? "primary" : "soft", block: true }), "gap-2")}
          >
            <CalendarClock aria-hidden="true" className="size-5 fill-none" />
            عرض تفاصيل الاستشارة
          </AppLink>
        </div>
      ) : null}
    </article>
  );
}
