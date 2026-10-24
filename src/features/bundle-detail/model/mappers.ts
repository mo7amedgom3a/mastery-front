import { routes } from "@/config/routes";
import type { FilterVM } from "@/features/landing/model/types";
import { mapB2CProductDetail, studioDocument } from "@/features/product-detail/model/mappers-b2c";
import { studioSections } from "@/features/product-detail/model/studio-content";
import type { InfoSectionVM, TrainerVM } from "@/features/product-detail/model/types";
import type { CatalogBundleDetail, CatalogProductResponse } from "@/lib/api/catalog";
import type { ProductContentResponse } from "@/lib/api/product-content";
import { cleanText, formatCount, formatMinutes, toPlainText, toTextBlocks } from "@/lib/format";
import { noPricing, toPricing } from "@/lib/pricing";

import { bundlePricing } from "../content/pricing";
import type {
  BundleCardVM,
  BundleCompositionVM,
  BundleDetailVM,
  BundleLandingVM,
  BundleMemberGroupVM,
  BundleMemberKind,
  BundleMemberVM,
} from "./types";

type MemberDto = CatalogBundleDetail["bundle_members"][number];

/** Legacy-backed members carry their legacy id in the slug: `course-180`, `consultation-37`. */
const MEMBER_SLUG = /^(course|diploma|consultation|package)-([1-9]\d{0,9})$/;

const COUNT_FORMS: Record<BundleMemberKind, { one: string; two: string; few: string; many: string }> = {
  diploma: { one: "دبلوم واحد", two: "دبلومان", few: "دبلومات", many: "دبلوماً" },
  course: { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" },
  consultation: { one: "استشارة واحدة", two: "استشارتان", few: "استشارات", many: "استشارة" },
  package: { one: "باقة واحدة", two: "باقتان", few: "باقات", many: "باقة" },
  other: { one: "برنامج واحد", two: "برنامجان", few: "برامج", many: "برنامجاً" },
};

export const memberKindLabel: Record<BundleMemberKind, string> = {
  diploma: "دبلوم",
  course: "دورة",
  consultation: "استشارة",
  package: "باقة",
  other: "برنامج",
};

const GROUP_TITLES: Record<BundleMemberKind, string> = {
  diploma: "الدبلومات",
  course: "الدورات",
  consultation: "الاستشارات",
  package: "الباقات",
  other: "برامج أخرى",
};

const DAY_FORMS = { one: "يوم واحد", two: "يومان", few: "أيام", many: "يوماً" };
const SESSION_FORMS = { one: "جلسة واحدة", two: "جلستان", few: "جلسات", many: "جلسة" };

/** Only published bundles reach the storefront. */
export function isPublishedBundle(product: Pick<CatalogProductResponse["product"], "product_type" | "status">): boolean {
  return product.product_type === "bundle" && product.status === "published";
}

/** The member's kind and legacy id, from its catalog type and slug. */
export function parseMember(member: Pick<MemberDto, "slug" | "product_type">): { kind: BundleMemberKind; id: number | null } {
  const match = member.slug.match(MEMBER_SLUG);
  const type = member.product_type;
  const kind: BundleMemberKind =
    type === "course" || type === "diploma" || type === "consultation" || type === "package" ? type : "other";
  return { kind, id: match && match[1] === kind ? Number(match[2]) : null };
}

/** Member counts by kind, kinds in order of first appearance. */
export function compositionOf(members: readonly Pick<MemberDto, "slug" | "product_type">[]): BundleCompositionVM[] {
  const counts = new Map<BundleMemberKind, number>();
  for (const member of members) {
    const { kind } = parseMember(member);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return [...counts].map(([kind, count]) => ({ kind, count, label: formatCount(count, COUNT_FORMS[kind]) }));
}

/** "دبلوم واحد · 3 دورات · استشارة واحدة". */
export function compositionLabel(composition: readonly BundleCompositionVM[]): string | null {
  return composition.length > 0 ? composition.map((part) => part.label).join(" · ") : null;
}

function accessLabel(days: number | null | undefined): string | null {
  if (!days || days <= 0) return null;
  if (days === 365 || days === 366) return "وصول لمدة عام";
  return `وصول لمدة ${formatCount(days, DAY_FORMS)}`;
}

function memberHref(kind: BundleMemberKind, id: number | null) {
  if (id === null) return null;
  if (kind === "course") return routes.course(id);
  if (kind === "diploma") return routes.diploma(id);
  if (kind === "consultation") return routes.consultation(id);
  if (kind === "package") return routes.package(id);
  return null;
}

/** The landing card for one bundle. Its category names double as filter chips. */
export function mapBundleCard(
  detail: CatalogBundleDetail,
  content: ProductContentResponse | null = null,
): BundleCardVM {
  const { product } = detail;
  const meta = studioDocument(content)?.meta;
  const pricing = bundlePricing(detail.price);
  return {
    id: product.slug,
    // The page authored in the Studio wins, so a card always matches the page it opens.
    title: cleanText(meta?.title) || cleanText(product.title) || product.slug,
    summary: toPlainText(meta?.summary || product.short_description || detail.description, 180),
    image: meta?.cover?.url || meta?.banner?.url || detail.image || null,
    href: routes.bundle(product.slug),
    composition: compositionOf(detail.bundle_members),
    price: pricing.price,
    priceAmount: pricing.priceAmount,
    filterKeys: detail.categories.map((category) => cleanText(category.name)).filter((name) => name !== null),
  };
}

/** Published bundles, in the API's order, and filter chips from their categories (most-used first). */
export function mapBundleLanding(
  details: readonly CatalogBundleDetail[],
  contents: readonly (ProductContentResponse | null)[] = [],
): BundleLandingVM {
  const bundles = details.flatMap((detail, index) =>
    isPublishedBundle(detail.product) ? [mapBundleCard(detail, contents[index] ?? null)] : [],
  );
  const counts = new Map<string, number>();
  for (const bundle of bundles) {
    for (const key of bundle.filterKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const filters: FilterVM[] = [...counts]
    .toSorted(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, "ar"))
    .map(([key]) => ({ key, label: key }));
  return { bundles, filters };
}

/** What is known about one member beyond its catalog summary. */
export type MemberSource =
  | { type: "course"; id: number; detail: CatalogProductResponse }
  | { type: "consultation"; detail: CatalogProductResponse }
  | null;

type MappedMember = { member: BundleMemberVM; trainers: TrainerVM[] };

function mapMember(dto: MemberDto, source: MemberSource, position: number): MappedMember {
  const { kind, id } = parseMember(dto);
  const base: BundleMemberVM = {
    key: `${kind}:${id ?? dto.slug}`,
    kind,
    position,
    title: cleanText(dto.title) ?? dto.slug,
    summary: toPlainText(dto.short_description, 200),
    image: null,
    href: memberHref(kind, id),
    category: null,
    people: [],
    duration: null,
    lessonCount: 0,
    units: [],
    price: noPricing,
  };

  if (source?.type === "course") {
    const vm = mapB2CProductDetail(source.detail, source.id, null).product;
    return {
      member: {
        ...base,
        title: vm.title || base.title,
        summary: base.summary ?? vm.summary,
        image: vm.image,
        // Only published members have a page.
        href: source.detail.product.status === "published" ? vm.href : null,
        category: vm.category,
        people: vm.trainers.map((trainer) => trainer.name),
        duration: vm.duration,
        lessonCount: vm.lessonCount,
        units: vm.curriculum.map((unit) => ({
          id: unit.id,
          title: unit.title,
          lessonCount: unit.lessons.length,
          duration: unit.duration,
        })),
        price: vm.price,
      },
      trainers: vm.trainers,
    };
  }

  if (source?.type === "consultation") {
    const { product, consultation, price, image } = source.detail;
    const length = consultation?.duration_minutes ? formatMinutes(consultation.duration_minutes) : null;
    return {
      member: {
        ...base,
        title: cleanText(product.title) || base.title,
        image: image ?? consultation?.consultant_avatar ?? null,
        href: product.status === "published" ? memberHref("consultation", id) : null,
        people: consultation?.consultant_name ? [consultation.consultant_name] : [],
        duration: [formatCount(1, SESSION_FORMS), length].filter(Boolean).join(" · ") || null,
        price: toPricing(price?.amount ?? null, price?.compare_at_amount ?? null),
      },
      trainers: [],
    };
  }

  return { member: base, trainers: [] };
}

function aboutSections(detail: CatalogBundleDetail): InfoSectionVM[] {
  const sections: InfoSectionVM[] = [];
  const blocks = toTextBlocks(detail.description ?? detail.product.short_description);
  if (blocks.length > 0) {
    sections.push({ heading: "عن الحزمة", blocks, variant: "prose" });
  }
  const outcomes = (detail.learning_outcomes ?? []).map((text) => cleanText(text)).filter((text) => text !== null);
  if (outcomes.length > 0) {
    sections.push({
      heading: "ماذا ستتعلم في هذه الحزمة؟",
      blocks: [{ type: "list", ordered: false, items: outcomes }],
      variant: "goals",
    });
  }
  return sections;
}

export function mapBundleDetail(
  detail: CatalogBundleDetail,
  sources: readonly MemberSource[],
  content: ProductContentResponse | null = null,
): BundleDetailVM {
  const { product } = detail;
  const title = cleanText(product.title) ?? product.slug;
  const mapped = detail.bundle_members.map((member, index) => mapMember(member, sources[index] ?? null, index + 1));
  const members = mapped.map((entry) => entry.member);

  const groups: BundleMemberGroupVM[] = [];
  for (const member of members) {
    const group = groups.find((entry) => entry.kind === member.kind);
    if (group) group.members.push(member);
    else groups.push({ kind: member.kind, title: GROUP_TITLES[member.kind], members: [member] });
  }

  const trainers = new Map<number, TrainerVM>();
  for (const trainer of mapped.flatMap((entry) => entry.trainers)) {
    if (!trainers.has(trainer.id)) trainers.set(trainer.id, trainer);
  }

  // The page published from the admin Studio: `meta` (cover, banner, title, summary) + BlockNote blocks.
  const doc = studioDocument(content);
  const meta = doc?.meta;
  const blocks = doc?.blocks ?? [];
  const studioContent = blocks.length > 0 ? studioSections(blocks) : null;
  const banner = meta?.banner?.url
    ? { url: meta.banner.url, alt: meta.banner.alt ?? "", headline: meta.banner.headline ?? "" }
    : null;

  const summary = toPlainText(meta?.summary || product.short_description || detail.description, 240);
  return {
    slug: product.slug,
    productId: product.product_id,
    title: (meta?.title ? cleanText(meta.title) : null) || title,
    summary,
    image: meta?.cover?.url || detail.image || null,
    description: toPlainText(detail.description ?? product.short_description, 160),
    sections: aboutSections(detail),
    readme: detail.readme?.trim() || null,
    content: studioContent,
    banner,
    skills: (detail.skills ?? []).map((skill) => cleanText(skill.name)).filter((name) => name !== null),
    categories: detail.categories.map((category) => cleanText(category.name)).filter((name) => name !== null),
    members,
    groups,
    composition: compositionOf(detail.bundle_members),
    trainers: [...trainers.values()],
    access: accessLabel(product.access_duration_days),
    ...bundlePricing(detail.price),
    href: routes.bundle(product.slug),
  };
}
