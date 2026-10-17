import type { Route } from "next";

import type { InfoSectionVM, RailCardVM, TrainerVM } from "@/features/product-detail/model/types";
import type { Pricing } from "@/lib/pricing";

/** View models for the consultation page. Mapped from API DTOs in `mappers.ts`, never used raw. */

/** The consultant. `href` is null when no instructor profile matches their name. */
export type ExpertVM = Omit<TrainerVM, "href"> & { href: Route | null };

/** One bookable slot from the booking API: a free window in the expert's calendar. */
export type SlotVM = {
  id: string;
  /** ISO instants (UTC). */
  start: string;
  end: string;
};

export type ConsultationDetailVM = {
  id: number;
  title: string;
  summary: string | null;
  /** Longer plain-text description for metadata. */
  description: string | null;
  /** Square consultant artwork, with the expert's name set at its bottom edge. */
  image: string | null;
  price: Pricing;
  priceAmount: number | null;
  sessions: number;
  sessionMinutes: number;
  /** "60 دقيقة" · "ساعة واحدة". */
  sessionLength: string | null;
  sections: InfoSectionVM[];
  /** Product README (markdown); replaces `sections` when set. */
  readme?: string | null;
  expert: ExpertVM | null;
  /** Canonical URL path, e.g. `/consultations/2`. */
  href: Route;
  indexable: boolean;
};

/** What the booking dialog needs: a lean, serialisable slice of the consultation. */
export type BookingVM = Pick<
  ConsultationDetailVM,
  "id" | "title" | "href" | "price" | "priceAmount" | "sessionLength"
> & {
  expertName: string | null;
  /** The B2C catalog product behind this consultation (`consultation-<id>`), for the booking API. */
  productRef: string;
};

export type ConsultationDetailData = {
  consultation: ConsultationDetailVM;
  /** Other consultations: the same expert's first, then recommended ones. */
  relatedConsultations: RailCardVM[];
  /** Courses, diplomas and packages: the expert's own first, then related and recommended ones. */
  programs: RailCardVM[];
};
