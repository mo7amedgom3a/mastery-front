import type { Route } from "next";

import type { Pricing } from "@/lib/pricing";

/** View models: what sections render. Mapped from API DTOs in `mappers.ts`, never used raw. */

/** One chip in a section's filter row. Items match it through their `filterKeys`. */
export type FilterVM = {
  key: string;
  label: string;
  /** Where "view all" points while this filter is on (e.g. the category listing). */
  href?: Route;
};

export type CourseCardVM = {
  id: number;
  title: string;
  summary: string | null;
  image: string | null;
  href: Route;
  category: string | null;
  duration: string | null;
  /** Lead instructor ("… وآخرون" when several); null when unknown. */
  instructor: string | null;
  price: Pricing;
  /** Raw numeric price the learner pays now, for the cart and structured data. Null when unknown or free. */
  priceAmount: number | null;
  /** Filter chips this card appears under. */
  filterKeys: string[];
};

export type PackageCardVM = {
  id: number;
  title: string;
  summary: string | null;
  image: string | null;
  href: Route;
  courseCount: number;
  price: Pricing;
  priceAmount: number | null;
  filterKeys: string[];
};

export type ConsultationCardVM = {
  id: number;
  title: string;
  summary: string | null;
  image: string | null;
  href: Route;
  consultant: string | null;
  sessions: number;
  sessionLength: string | null;
  price: Pricing;
  priceAmount: number | null;
};

export type CategoryVM = {
  id: number;
  name: string;
  href: Route;
};

export type StatVM = {
  key: string;
  value: number;
  label: string;
};

export type FaqVM = {
  question: string;
  answer: string;
};

export type BannerVM = {
  id: number;
  text: string;
  href: string | null;
};

export type LandingData = {
  banner: BannerVM | null;
  categories: CategoryVM[];
  /** The featured rail first, then each category's rail; one entry per course. */
  courses: CourseCardVM[];
  courseFilters: FilterVM[];
  coursesTotal: number;
  diplomas: CourseCardVM[];
  diplomaFilters: FilterVM[];
  packages: PackageCardVM[];
  packageFilters: FilterVM[];
  consultations: ConsultationCardVM[];
  faqs: FaqVM[];
  stats: StatVM[];
};
