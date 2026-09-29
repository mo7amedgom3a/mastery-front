import { routes } from "@/config/routes";
import { isPublishable, mapCourse, packagePricing, type CourseDto } from "@/features/landing/model/mappers";
import {
  byOrder,
  courseCard,
  dedupe,
  mapInfo,
  mapProductDetail,
  packageCard,
  recommendationCard,
} from "@/features/product-detail/model/mappers";
import type { CatalogIndex, InfoSectionVM, RailCardVM, TrainerVM } from "@/features/product-detail/model/types";
import type { InstructorNames } from "@/lib/api/instructor-names";
import type {
  LegacyCourseResponse,
  LegacyPackageResponse,
  LegacyRecommendationsResponse,
  LegacyRelatedResponse,
} from "@/lib/api/legacy";
import { cleanText, formatCount, formatDurationFromSeconds, formatPrice, toPlainText } from "@/lib/format";

import type { PackageDetailData, PackageDetailVM, PackageItemVM } from "./types";

type PackageDto = LegacyPackageResponse;

/** What is known about one included course/diploma: its full detail, or only its catalog card. */
export type IncludedSource = { detail: LegacyCourseResponse } | { card: CourseDto };

const COURSE_FORMS = { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" };
/** Titles named in the generated summary when the package has no description of its own. */
const SUMMARY_TITLES = 3;

type MappedItem = { item: PackageItemVM; seconds: number; trainers: TrainerVM[]; sections: InfoSectionVM[] };

/** Goals taken from each included course when the package has no content of its own. */
const GOALS_PER_ITEM = 2;
const MAX_FALLBACK_GOALS = 10;
const MAX_FALLBACK_AUDIENCE = 8;

function fromDetail(detail: LegacyCourseResponse, position: number): MappedItem {
  const vm = mapProductDetail(detail);
  return {
    item: {
      key: `${vm.kind}:${vm.id}`,
      kind: vm.kind,
      id: vm.id,
      position,
      title: vm.title,
      summary: vm.summary,
      image: vm.image,
      href: vm.href,
      category: vm.category,
      duration: vm.duration,
      lessonCount: vm.lessonCount,
      trainers: vm.trainers.map(({ id, name, href }) => ({ id, name, href })),
      units: vm.curriculum.map((unit) => ({
        id: unit.id,
        title: unit.title,
        lessonCount: unit.lessons.length,
        duration: unit.duration,
      })),
      price: vm.price,
      priceAmount: vm.priceAmount,
    },
    seconds: detail.course.duration ?? 0,
    trainers: vm.trainers,
    sections: vm.sections,
  };
}

function fromCard(dto: CourseDto, position: number): MappedItem {
  const card = mapCourse(dto);
  const kind = dto.is_diploma ? "diploma" : "course";
  return {
    item: {
      key: `${kind}:${card.id}`,
      kind,
      id: card.id,
      position,
      title: card.title,
      summary: card.summary,
      image: card.image,
      href: card.href,
      category: card.category,
      duration: card.duration,
      lessonCount: 0,
      trainers: [],
      units: [],
      price: card.price,
      priceAmount: card.priceAmount,
    },
    seconds: dto.duration ?? 0,
    trainers: [],
    sections: [],
  };
}

function savingsOf(items: readonly PackageItemVM[], priceAmount: number | null): PackageDetailVM["savings"] {
  if (!priceAmount || items.length === 0 || items.some((item) => item.priceAmount === null)) {
    return null;
  }
  const total = items.reduce((sum, item) => sum + (item.priceAmount ?? 0), 0);
  const percent = Math.round(((total - priceAmount) / total) * 100);
  const separateTotal = formatPrice(total);
  const amount = formatPrice(total - priceAmount);
  // Below 5% the claim isn't worth the space.
  return percent >= 5 && separateTotal && amount ? { separateTotal, amount, percent } : null;
}

function listItems(section: InfoSectionVM | undefined): string[] {
  return (section?.blocks ?? []).flatMap((block) => (block.type === "list" ? block.items : []));
}

/** Unique by normalised text (spacing and trailing punctuation differ between courses). */
function uniqueTexts(texts: readonly string[], max: number): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const text of texts) {
    const key = text.replace(/[\s.،,:؛-]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(text);
    if (kept.length === max) break;
  }
  return kept;
}

/**
 * About sections for a package the CMS left empty (or filled with placeholders): what you learn and
 * who it's for, gathered from its own courses' goals and audience lists. Real course copy, not made up.
 */
function fallbackSections(mapped: readonly MappedItem[]): InfoSectionVM[] {
  const goals = uniqueTexts(
    mapped.flatMap((entry) =>
      listItems(entry.sections.find((section) => section.variant === "goals")).slice(0, GOALS_PER_ITEM),
    ),
    MAX_FALLBACK_GOALS,
  );
  const audience = uniqueTexts(
    mapped.flatMap((entry) => listItems(entry.sections.find((section) => section.variant === "audience"))),
    MAX_FALLBACK_AUDIENCE,
  );
  const sections: InfoSectionVM[] = [];
  if (goals.length > 0) {
    sections.push({
      heading: "ماذا ستتعلم في هذه الباقة؟",
      blocks: [{ type: "list", ordered: false, items: goals }],
      variant: "goals",
    });
  }
  if (audience.length > 0) {
    sections.push({
      heading: "لمن هذه الباقة؟",
      blocks: [{ type: "list", ordered: false, items: audience }],
      variant: "audience",
    });
  }
  return sections;
}

/** The intro paragraph of the package's own copy, trimmed for metadata. */
function firstParagraph(sections: readonly InfoSectionVM[]): string | null {
  const block = sections.flatMap((section) => section.blocks).find((entry) => entry.type === "p");
  return block?.type === "p" ? toPlainText(block.text, 160) : null;
}

/** "تجمع هذه الباقة 8 دورات: أ، ب، ج وغيرها." for packages the CMS left without a description. */
function generatedSummary(items: readonly PackageItemVM[]): string | null {
  if (items.length === 0) return null;
  const named = items.slice(0, SUMMARY_TITLES).map((item) => item.title);
  const rest = items.length > SUMMARY_TITLES ? " وغيرها" : "";
  return `تجمع هذه الباقة ${formatCount(items.length, COURSE_FORMS)}: ${named.join("، ")}${rest}.`;
}

export function mapPackageDetail(dto: PackageDto, included: readonly (IncludedSource | null)[]): PackageDetailVM {
  const { collection } = dto;
  const title = cleanText(collection.name) ?? "";

  const mapped: MappedItem[] = [];
  for (const source of included) {
    if (!source) continue;
    const position = mapped.length + 1;
    const next = "detail" in source ? fromDetail(source.detail, position) : fromCard(source.card, position);
    if (next.item.title) mapped.push(next);
  }
  const items = mapped.map((entry) => entry.item);

  const trainers = new Map<number, TrainerVM>();
  for (const trainer of mapped.flatMap((entry) => entry.trainers)) {
    if (!trainers.has(trainer.id)) trainers.set(trainer.id, trainer);
  }

  const own = dto.info
    .toSorted(byOrder)
    .map(mapInfo)
    .filter((section): section is InfoSectionVM => section !== null);
  const sections = own.length > 0 ? own : fallbackSections(mapped);
  const pricing = packagePricing(collection, dto.prices);
  const summary = toPlainText(collection.description, 240) ?? generatedSummary(items);

  return {
    id: collection.id,
    title,
    summary,
    description: toPlainText(collection.description, 160) ?? firstParagraph(own) ?? summary,
    image: collection.image || null,
    ...pricing,
    savings: savingsOf(items, pricing.priceAmount),
    courseCount: items.filter((item) => item.kind === "course").length,
    diplomaCount: items.filter((item) => item.kind === "diploma").length,
    duration: formatDurationFromSeconds(mapped.reduce((sum, entry) => sum + entry.seconds, 0)),
    lessonCount: items.reduce((sum, item) => sum + item.lessonCount, 0),
    sections,
    items,
    trainers: [...trainers.values()],
    href: routes.package(collection.id),
    indexable: collection.active,
  };
}

export type PackageDetailSources = {
  detail: PackageDto;
  included: readonly (IncludedSource | null)[];
  related: LegacyRelatedResponse | null;
  recommendations: LegacyRecommendationsResponse | null;
  catalog: CatalogIndex | null;
  instructors: InstructorNames | null;
};

export function mapPackageDetailData({
  detail,
  included,
  related,
  recommendations,
  catalog,
  instructors,
}: PackageDetailSources): PackageDetailData {
  const product = mapPackageDetail(detail, included);
  // The rails never repeat the package itself or anything already inside it.
  const seen = new Set([`package:${product.id}`, ...product.items.map((item) => item.key)]);

  // A package page leads with other packages, then the courses and diplomas around the same topics.
  const toCourseCard = (dto: CourseDto) => courseCard(dto, instructors ?? undefined);
  const relatedCards = dedupe(
    [
      ...(related?.packages ?? []).filter(isPublishable).map(packageCard),
      ...(related?.courses ?? []).filter(isPublishable).map(toCourseCard),
      ...(related?.diplomas ?? []).filter(isPublishable).map(toCourseCard),
    ],
    seen,
  );

  const recommended = dedupe(
    (recommendations?.items ?? [])
      .map((item) => recommendationCard(item, catalog, instructors ?? undefined))
      .filter((card): card is RailCardVM => card !== null),
    seen,
  );

  return { product, related: relatedCards, recommended };
}
