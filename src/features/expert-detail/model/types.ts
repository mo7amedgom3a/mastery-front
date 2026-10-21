import type { Route } from "next";

import type { SocialNetwork } from "@/components/icons/social-icons";
import type { ExpertCardVM } from "@/features/experts-directory/model";
import type { StudioBlock, StudioSectionVM } from "@/features/product-detail/model/studio-content";
import type { RailCardVM } from "@/features/product-detail/model/types";

import type { ProgramCardVM } from "./page-document";
import type { TextBlock } from "@/lib/format";
import type { Pricing } from "@/lib/pricing";

/** View models for the expert profile page. Mapped from API DTOs in `mappers.ts`, never used raw. */

export type SocialKind = Extract<SocialNetwork, "facebook" | "instagram" | "youtube">;
export type SocialLinkVM = { kind: SocialKind; href: string };

export type ExpertCountsVM = {
  courses: number;
  diplomas: number;
  packages: number;
  consultations: number;
  bundles: number;
  /** Live (scheduled) diplomas. */
  live: number;
};

/** A field (catalog category) the expert teaches in; links to its listing when the catalog has one. */
export type ExpertFieldVM = { name: string; href: Route | null };

/** A bundle or live diploma: no cart controls on the profile, the card links to its own page. */
export type LinkCardVM = {
  key: string;
  kind: "bundle" | "live";
  title: string;
  summary: string | null;
  image: string | null;
  href: Route;
  tag: string;
  price: Pricing;
};

export type ExpertVM = {
  /** Trainer id, `c{id}` for an expert who only gives consultations, or the uuid of a B2C-only expert. */
  key: string;
  name: string;
  /** First letter, for the avatar fallback when there is no photo. */
  initial: string;
  avatar: string | null;
  /** Picks the brand colour behind the initial when there is no photo; stable per expert. */
  colorIndex: number;
  /** Their title line from the admin (e.g. «خبير التسويق الرقمي»); null when not set. */
  title: string | null;
  /** "مدرّب" and/or "خبير استشارات". */
  roles: string[];
  /** Has an active consultant profile: books one-to-one sessions. */
  isConsultant: boolean;
  /** The page built in the expert Studio, as sections (program cards resolved); empty when not published. */
  page: StudioSectionVM[];
  /** The same page's raw blocks (the Studio preview re-renders its live edits from these). */
  document: StudioBlock[] | null;
  /** Page content written in the admin Studio (markdown), shown when there is no Studio page; empty when none. */
  readme: string;
  /** Legacy bio, shown only when there is no README. */
  bio: TextBlock[];
  /** Short plain-text bio for metadata and structured data. */
  summary: string | null;
  fields: ExpertFieldVM[];
  /** Skills and tags across their items, most common first. */
  topics: string[];
  /** Their own specialty line when filled in, otherwise the categories they work in. */
  specialties: string[];
  socials: SocialLinkVM[];
  /** What is actually shown on the page (published items only). */
  counts: ExpertCountsVM;
  /** Points lifted by the API from the expert's own services. */
  whatTheyDo: string[];
  whoTheyHelp: string[];
  /** Canonical URL path, e.g. `/experts/9-د._مظهر_قنطقجي`. */
  href: Route;
  /** False when the profile has nothing to offer: kept out of search engines. */
  indexable: boolean;
};

export type ExpertDetailData = {
  expert: ExpertVM;
  consultations: RailCardVM[];
  courses: RailCardVM[];
  diplomas: RailCardVM[];
  packages: RailCardVM[];
  bundles: LinkCardVM[];
  liveDiplomas: LinkCardVM[];
  /** The expert's own items as program cards, for `programCards` blocks in the Studio preview. */
  programs: ProgramCardVM[];
  /** Other experts ranked by shared fields, skills and tags. */
  relatedExperts: ExpertCardVM[];
  /** Other experts' courses, diplomas and packages in the same categories. */
  relatedPrograms: RailCardVM[];
  /** Other experts' consultations in the same categories. */
  relatedConsultations: RailCardVM[];
  recommended: RailCardVM[];
};
