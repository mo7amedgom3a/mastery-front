import { consultationCard } from "@/features/consultation-detail/model/mappers";
import { isPublishable } from "@/features/landing/model/mappers";
import { courseCard, packageCard } from "@/features/product-detail/model/mappers";
import type { RailCardVM } from "@/features/product-detail/model/types";
import type { InstructorNames } from "@/lib/api/instructor-names";
import type { SearchOptionsResponse, SearchResponse } from "@/lib/api/search";
import { cleanText } from "@/lib/format";

import { skillName, tagName, typeLabel } from "../content/copy";
import {
  PAGE_SIZE,
  PRODUCT_TYPES,
  emptySearchState,
  isIndexableState,
  searchHref,
  toggled,
  withFilters,
  type ProductType,
  type SearchState,
} from "./params";
import type {
  ActiveFilterVM,
  CardTagVM,
  FacetGroupVM,
  FacetOptionVM,
  ResultCardVM,
  SearchCatalog,
  SearchResultsVM,
} from "./types";

type SearchItemDto = SearchResponse["items"][number];
type OptionDto = SearchOptionsResponse["categories"][number];

/** Chips shown before "show more" in the long groups. */
const VISIBLE_CHIPS = 8;
const CARD_TAGS = 3;
const SUGGESTED_CATEGORIES = 6;

export const emptyCatalog: SearchCatalog = {
  known: { categories: new Set(), skills: new Set(), tags: new Set(), trainers: new Set() },
  categoryNames: new Map(),
  skillNames: new Map(),
  tagNames: new Map(),
  tagCounts: new Map(),
  productCount: 0,
  trainers: [],
  topCategories: [],
};

export function mapCatalog(options: SearchOptionsResponse): SearchCatalog {
  const names = (items: OptionDto[], name: (item: OptionDto) => string) =>
    new Map(items.map((item) => [item.code.toLowerCase(), name(item)]));
  const categoryNames = names(options.categories, (item) => cleanText(item.name) ?? item.code);
  const trainers = options.instructors
    .filter((trainer) => trainer.product_count > 0)
    .flatMap((trainer) => {
      const name = cleanText(trainer.display_name);
      return name ? [{ id: trainer.legacy_trainer_id, name, count: trainer.product_count }] : [];
    });

  return {
    known: {
      categories: new Set(categoryNames.keys()),
      skills: new Set(options.skills.map((item) => item.code.toLowerCase())),
      tags: new Set(options.tags.map((item) => item.code.toLowerCase())),
      trainers: new Set(trainers.map((trainer) => trainer.id)),
    },
    categoryNames,
    skillNames: names(options.skills, (item) => skillName(item.code, item.name)),
    tagNames: names(options.tags, (item) => tagName(item.code, item.name)),
    tagCounts: new Map(options.tags.map((item) => [item.code.toLowerCase(), item.count])),
    productCount: options.product_types.reduce((total, item) => total + item.count, 0),
    trainers,
    topCategories: options.categories
      .filter((item) => item.count > 0)
      .toSorted((a, b) => b.count - a.count)
      .slice(0, SUGGESTED_CATEGORIES)
      .map((item) => ({ code: item.code.toLowerCase(), label: categoryNames.get(item.code.toLowerCase()) ?? item.code })),
  };
}

/** Selected options first, then the ones that list the most. */
function byUse(a: FacetOptionVM, b: FacetOptionVM): number {
  return Number(b.selected) - Number(a.selected) || b.count - a.count || a.label.localeCompare(b.label, "ar");
}

/** An option that would list nothing is noise, unless it is on (so it can be switched off). */
function usable(option: FacetOptionVM): boolean {
  return option.selected || option.count > 0;
}

/**
 * The four chip rows. Counts come from the facet request for the current filters, where each group
 * is counted without its own selection; with no such response every known option is offered.
 */
export function mapFacets(
  state: SearchState,
  catalog: SearchCatalog,
  options: SearchOptionsResponse | null,
): FacetGroupVM[] {
  const counts = (items: OptionDto[] | undefined) =>
    items ? new Map(items.map((item) => [item.code.toLowerCase(), item.count])) : null;

  const link = (patch: Partial<SearchState>) => {
    const target = withFilters(state, patch);
    return { href: searchHref(target), indexable: isIndexableState(target) };
  };

  const typeCounts = counts(options?.product_types);
  const types: FacetOptionVM[] = PRODUCT_TYPES.map((type) => ({
    code: type,
    label: typeLabel[type].plural,
    count: typeCounts ? (typeCounts.get(type) ?? 0) : 1,
    selected: state.types.includes(type),
    ...link({ types: toggled(state.types, type) }),
  })).filter(usable);

  const group = (
    names: ReadonlyMap<string, string>,
    selected: readonly string[],
    found: Map<string, number> | null,
    patch: (values: string[]) => Partial<SearchState>,
  ): FacetOptionVM[] =>
    [...names]
      .map(([code, label]) => ({
        code,
        label,
        count: found ? (found.get(code) ?? 0) : 1,
        selected: selected.includes(code),
        ...link(patch(toggled(selected, code))),
      }))
      .filter(usable)
      .toSorted(byUse);

  const categories = group(catalog.categoryNames, state.categories, counts(options?.categories), (values) => ({
    categories: values,
  }));
  const skills = group(catalog.skillNames, state.skills, counts(options?.skills), (values) => ({ skills: values }));
  const tags = group(catalog.tagNames, state.tags, counts(options?.tags), (values) => ({ tags: values }));

  // Selected chips sort first, so "show more" never hides one that is on.
  const split = (key: FacetGroupVM["key"], label: string, all: FacetOptionVM[]): FacetGroupVM => {
    const visible = Math.max(VISIBLE_CHIPS, all.filter((option) => option.selected).length);
    return { key, label, options: all.slice(0, visible), more: all.slice(visible) };
  };

  return [
    { key: "type" as const, label: "النوع", options: types, more: [] },
    { key: "category" as const, label: "المجال", options: categories, more: [] },
    split("skill", "المهارة", skills),
    split("tag", "الوسم", tags),
  ].filter((facet) => facet.options.length > 0);
}

/** One removable chip per filter in force (the query text is edited in the search box instead). */
export function mapActiveFilters(state: SearchState, catalog: SearchCatalog): ActiveFilterVM[] {
  const without = (patch: Partial<SearchState>) => searchHref(withFilters(state, patch));
  const trainerNames = new Map(catalog.trainers.map((trainer) => [trainer.id, trainer.name]));
  const filters: ActiveFilterVM[] = [];

  for (const type of state.types) {
    filters.push({
      key: `type:${type}`,
      label: typeLabel[type].plural,
      href: without({ types: state.types.filter((item) => item !== type) }),
    });
  }
  for (const code of state.categories) {
    filters.push({
      key: `category:${code}`,
      label: catalog.categoryNames.get(code) ?? code,
      href: without({ categories: state.categories.filter((item) => item !== code) }),
    });
  }
  for (const code of state.skills) {
    filters.push({
      key: `skill:${code}`,
      label: catalog.skillNames.get(code) ?? skillName(code),
      href: without({ skills: state.skills.filter((item) => item !== code) }),
    });
  }
  for (const code of state.tags) {
    filters.push({
      key: `tag:${code}`,
      label: catalog.tagNames.get(code) ?? tagName(code),
      href: without({ tags: state.tags.filter((item) => item !== code) }),
    });
  }
  for (const id of state.trainers) {
    filters.push({
      key: `trainer:${id}`,
      label: trainerNames.get(id) ?? `مدرّب ${id}`,
      href: without({ trainers: state.trainers.filter((item) => item !== id) }),
    });
  }
  if (state.expert) {
    filters.push({ key: "expert", label: "مدرّبون خبراء فقط", href: without({ expert: false }) });
  }
  if (state.priceMin !== null || state.priceMax !== null) {
    filters.push({
      key: "price",
      label: rangeLabel("السعر", state.priceMin, state.priceMax, "$"),
      href: without({ priceMin: null, priceMax: null }),
    });
  }
  if (state.hoursMin !== null || state.hoursMax !== null) {
    filters.push({
      key: "hours",
      label: rangeLabel("المدة", state.hoursMin, state.hoursMax, " س"),
      href: without({ hoursMin: null, hoursMax: null }),
    });
  }
  return filters;
}

function rangeLabel(name: string, min: number | null, max: number | null, unit: string): string {
  const value = (amount: number) => (unit === "$" ? `$${amount}` : `${amount}${unit}`);
  if (min !== null && max !== null) return `${name}: ${value(min)} – ${value(max)}`;
  return min !== null ? `${name}: من ${value(min)}` : `${name}: حتى ${value(max ?? 0)}`;
}

/**
 * A card's topic chips: the most specific tags first. A tag that more than half the catalog
 * carries says nothing about one product, so it is left off the card (it is still a filter).
 */
function cardTags(item: SearchItemDto, catalog: SearchCatalog): CardTagVM[] {
  const codes = [...new Set(item.tags.map((tag) => tag.toLowerCase()))].filter(
    (code) => catalog.known.tags.has(code) && (catalog.tagCounts.get(code) ?? 0) * 2 <= catalog.productCount,
  );
  return codes
    .toSorted((a, b) => (catalog.tagCounts.get(a) ?? 0) - (catalog.tagCounts.get(b) ?? 0))
    .slice(0, CARD_TAGS)
    .map((code) => ({
      label: catalog.tagNames.get(code) ?? tagName(code),
      href: searchHref({ ...emptySearchState, tags: [code] }),
    }));
}

/**
 * A result as a card, built from the legacy record the API attaches to it, by the same mappers the
 * rails use, so a product looks and links the same everywhere. Results without a record, or whose
 * record isn't publishable (inactive, no artwork), are skipped like everywhere else.
 */
function resultCard(item: SearchItemDto, catalog: SearchCatalog): ResultCardVM | null {
  let card: RailCardVM | null = null;
  if (item.course && isPublishable(item.course)) {
    const kind: ProductType = item.course.is_diploma ? "diploma" : "course";
    const names = item.instructors.map((name) => cleanText(name)).filter((name): name is string => !!name);
    // The index has names only: these cards show the plain instructor icon, no photo.
    const trainers = [...new Set(names)].map((name) => ({ name, avatar: null }));
    const instructors: InstructorNames = new Map([[`${kind}:${item.course.id}`, trainers]]);
    card = courseCard(item.course, instructors);
  } else if (item.package && isPublishable(item.package)) {
    card = packageCard(item.package);
  } else if (item.consultation && isPublishable(item.consultation)) {
    card = consultationCard(item.consultation);
  }
  return card ? { ...card, tags: cardTags(item, catalog) } : null;
}

export function mapResults(response: SearchResponse, catalog: SearchCatalog): SearchResultsVM {
  const seen = new Set<string>();
  const cards: ResultCardVM[] = [];
  for (const item of response.items) {
    const card = resultCard(item, catalog);
    if (!card || seen.has(card.key)) continue;
    seen.add(card.key);
    cards.push(card);
  }
  return { cards, total: response.total, pageCount: Math.ceil(response.total / PAGE_SIZE) };
}

/** Page heading: what this list is, in the words a learner would search for. */
export function searchHeading(state: SearchState, catalog: SearchCatalog): string {
  if (state.q) return `نتائج البحث عن «${state.q}»`;
  const type = state.types.length === 1 ? state.types[0] : null;
  const category = state.categories.length === 1 ? (catalog.categoryNames.get(state.categories[0]) ?? null) : null;
  if (type && category) return `${typeLabel[type].plural} ${category}`;
  if (type) return typeLabel[type].definite;
  if (category) return `برامج ${category}`;
  return "كل البرامج التدريبية";
}
