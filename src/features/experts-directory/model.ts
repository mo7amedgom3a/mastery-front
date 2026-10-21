import type { Route } from "next";

import { routes } from "@/config/routes";
import { expertFacts, expertRoles } from "@/features/expert-detail/model/facts";
import type { CatalogExpertSummary } from "@/lib/api/browse";
import { cleanText, stripHonorific, toPlainText } from "@/lib/format";

/** One expert as a card: the directory, "related experts" on a profile, and the landing line-up. */
export type ExpertCardVM = {
  key: string;
  name: string;
  /** First letter, for the avatar fallback when there is no photo. */
  initial: string;
  avatar: string | null;
  /** Picks the brand colour behind the initial; stable per expert. */
  colorIndex: number;
  /** Their title line, else their own specialty, else null. */
  title: string | null;
  /** The fields they teach in (category names), most items first. */
  fields: string[];
  /** "مدرّب" and/or "خبير استشارات". */
  roles: string[];
  isConsultant: boolean;
  /** What they offer as counted nouns, e.g. "3 دورات". */
  offers: string[];
  href: Route;
  featured: boolean;
  featuredOrder: number | null;
  /** Published items in total, for ordering. */
  itemCount: number;
};

/** Avatar colour from the key, so an expert keeps the same one on every visit. */
export function expertColorIndex(key: string): number {
  return [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

export function mapExpertCard(dto: CatalogExpertSummary): ExpertCardVM {
  const name = cleanText(dto.name) ?? "";
  const counts = {
    courses: dto.course_count ?? 0,
    diplomas: dto.diploma_count ?? 0,
    packages: dto.package_count ?? 0,
    consultations: dto.consultation_count ?? 0,
    bundles: dto.bundle_count ?? 0,
    live: dto.live_diploma_count ?? 0,
  };
  const isConsultant = Boolean(dto.is_consultant) || counts.consultations > 0;
  return {
    key: dto.key,
    name,
    initial: stripHonorific(name).charAt(0) || name.charAt(0),
    avatar: dto.avatar || null,
    colorIndex: expertColorIndex(dto.key),
    title: cleanText(dto.headline) ?? cleanText(toPlainText(dto.specialized, 80)),
    fields: (dto.categories ?? []).map((field) => field.trim()).filter(Boolean),
    roles: expertRoles(counts, isConsultant),
    isConsultant,
    offers: expertFacts(counts).map((fact) => fact.label),
    href: routes.expert(dto.key, name),
    featured: Boolean(dto.is_featured),
    featuredOrder: dto.featured_order ?? null,
    itemCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
  };
}

export type ExpertKindFilter = "all" | "consultants" | "trainers";

export type ExpertsDirectoryState = {
  query: string;
  field: string;
  kind: ExpertKindFilter;
  page: number;
};

export const EXPERTS_PAGE_SIZE = 24;

/** The directory filters from the URL (`?q=&field=&kind=&page=`); unknown values fall back to "all". */
export function parseDirectoryState(params: Record<string, string | string[] | undefined>): ExpertsDirectoryState {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const kind = one(params.kind);
  const page = Number(one(params.page));
  return {
    query: one(params.q).slice(0, 100),
    field: one(params.field).slice(0, 200),
    kind: kind === "consultants" || kind === "trainers" ? kind : "all",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function directoryHref(state: ExpertsDirectoryState): Route {
  const query = new URLSearchParams();
  if (state.query) query.set("q", state.query);
  if (state.field) query.set("field", state.field);
  if (state.kind !== "all") query.set("kind", state.kind);
  if (state.page > 1) query.set("page", String(state.page));
  const search = query.toString();
  return (search ? `${routes.experts}?${search}` : routes.experts) as Route;
}

/** Arabic-insensitive-enough matching: case, tatweel and the alef/ya/ta-marbuta variants. */
function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ـً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

/** A name without honorifics, folded: "د. مظهر قنطقجي" and "مظهر قنطقجي" compare equal. */
export function nameKey(name: string): string {
  return fold(stripHonorific(name)).replace(/\s+/g, " ").trim();
}

export function filterExperts(experts: readonly ExpertCardVM[], state: ExpertsDirectoryState): ExpertCardVM[] {
  const needle = fold(state.query);
  return experts.filter((expert) => {
    if (state.kind === "consultants" && !expert.isConsultant) return false;
    if (state.kind === "trainers" && !expert.roles.includes("مدرّب")) return false;
    if (state.field && !expert.fields.includes(state.field)) return false;
    if (!needle) return true;
    return [expert.name, expert.title ?? "", ...expert.fields].some((text) => fold(text).includes(needle));
  });
}

/** Every field any expert teaches in, by how many experts teach it. */
export function directoryFields(experts: readonly ExpertCardVM[]): string[] {
  const counts = new Map<string, number>();
  for (const expert of experts) for (const field of expert.fields) counts.set(field, (counts.get(field) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ar")).map(([field]) => field);
}
