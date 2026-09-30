import type { Route } from "next";

import type { InfoSectionVM, RailCardVM, TrainerVM } from "@/features/product-detail/model/types";
import type { Pricing } from "@/lib/pricing";

/** View models for the consultation page. Mapped from API DTOs in `mappers.ts`, never used raw. */

/** The consultant. `href` is null when no instructor profile matches their name. */
export type ExpertVM = Omit<TrainerVM, "href"> & { href: Route | null };

/** A weekly window the expert takes sessions in, in the availability's own UTC offset. */
export type AvailabilityWindowVM = {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** Minutes from midnight. */
  startMinute: number;
  endMinute: number;
};

export type AvailabilityVM = {
  /** Offset of the wall-clock times in `windows` from UTC, in minutes. */
  utcOffsetMinutes: number;
  /** Length of one bookable slot. */
  slotMinutes: number;
  /** Slots starting sooner than this can't be booked. */
  minNoticeHours: number;
  /** How far ahead the calendar offers slots. */
  horizonDays: number;
  windows: AvailabilityWindowVM[];
};

/** One bookable start time, built in the browser from `AvailabilityVM` (see `availability.ts`). */
export type SlotVM = {
  /** ISO instant the session starts at. */
  start: string;
  taken: boolean;
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
  expert: ExpertVM | null;
  availability: AvailabilityVM;
  /** Canonical URL path, e.g. `/consultations/2`. */
  href: Route;
  indexable: boolean;
};

/** What the booking dialog needs: a lean, serialisable slice of the consultation. */
export type BookingVM = Pick<
  ConsultationDetailVM,
  "id" | "title" | "href" | "price" | "sessions" | "sessionLength" | "availability"
> & {
  expertName: string | null;
};

export type ConsultationDetailData = {
  consultation: ConsultationDetailVM;
  /** Other consultations: the same expert's first, then recommended ones. */
  relatedConsultations: RailCardVM[];
  /** Courses, diplomas and packages: the expert's own first, then related and recommended ones. */
  programs: RailCardVM[];
};
