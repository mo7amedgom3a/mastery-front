import type { Route } from "next";

import type { CourseDto, PackageDto } from "@/features/landing/model/mappers";

import type { TextBlock } from "@/lib/format";
import type { Pricing } from "@/lib/pricing";
import type { ShopItemKind } from "@/lib/shop/store";

/** View models for the course/diploma page. Mapped from API DTOs in `mappers.ts`, never used raw. */

export type ProductKind = "course" | "diploma";

export type InfoSectionVM = {
  heading: string;
  blocks: TextBlock[];
  /** `goals` lists render as a check-list, `audience` as person rows, everything else as prose. */
  variant: "goals" | "audience" | "prose";
};

export type LessonVM = {
  id: number;
  title: string;
  /** Clock format, e.g. "3:55". */
  duration: string | null;
  free: boolean;
};

export type UnitVM = {
  id: number;
  title: string;
  summary: string | null;
  duration: string | null;
  lessons: LessonVM[];
};

export type TrainerVM = {
  id: number;
  name: string;
  /** First letter, for the avatar fallback when there is no photo. */
  initial: string;
  avatar: string | null;
  bio: TextBlock[];
  /** Short plain-text bio for the hero and structured data. */
  summary: string | null;
  href: Route;
};

/** The promo video as the API describes it; checked against the Bunny library before it is shown. */
export type IntroVideoSource = {
  /** Bunny Stream video GUID. */
  videoId: string;
  title: string;
  duration: string | null;
};

/** A promo video confirmed to exist in the Bunny library, ready to embed. */
export type IntroVideoVM = {
  /** Bunny player iframe URL. */
  embedUrl: string;
  /** Bunny's thumbnail for the video. */
  poster: string;
  title: string;
  duration: string | null;
};

export type ProductDetailVM = {
  kind: ProductKind;
  id: number;
  title: string;
  summary: string | null;
  /** Longer plain-text description for metadata. */
  description: string | null;
  category: string | null;
  /** Wide artwork (16:10) for cards, the video poster and share previews. */
  image: string | null;
  duration: string | null;
  /** Shown only when it's a rating worth showing (see mappers). */
  rating: number | null;
  price: Pricing;
  priceAmount: number | null;
  lessonCount: number;
  freeLessonCount: number;
  /** Set by `get-product-detail` only once the video is confirmed to exist in the Bunny library. */
  introVideo: IntroVideoVM | null;
  sections: InfoSectionVM[];
  curriculum: UnitVM[];
  trainers: TrainerVM[];
  /** Canonical URL path, e.g. `/courses/4-Instagram_E-Commerce_Strategy`. */
  href: Route;
  indexable: boolean;
};

/** One card in the related/recommended rails; every rail item can be added to the cart or saved. */
export type RailCardVM = {
  key: string;
  kind: ShopItemKind;
  id: number;
  title: string;
  summary: string | null;
  image: string | null;
  href: Route;
  tag: string | null;
  duration: string | null;
  courseCount: number | null;
  /** Lead instructor ("… وآخرون" when several) or the consultant; null for packages and when unknown. */
  instructor: string | null;
  /** The lead instructor's profile photo; null when unknown, and for packages and consultations. */
  instructorAvatar: string | null;
  price: Pricing;
  priceAmount: number | null;
};

/** Legacy records by `${kind}:${id}` (kind: course | diploma | package), for rebuilding recommendation cards. */
export type CatalogIndex = {
  courses: Map<string, CourseDto>;
  packages: Map<string, PackageDto>;
};

export type ProductDetailData = {
  product: ProductDetailVM;
  related: RailCardVM[];
  recommended: RailCardVM[];
};
