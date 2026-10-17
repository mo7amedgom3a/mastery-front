import type { CatalogProductResponse } from "@/lib/api/catalog";
import { routes } from "@/config/routes";
import { cleanText, formatDurationFromSeconds, formatPrice, toPlainText, toTextBlocks } from "@/lib/format";
import type { ProductContentResponse } from "@/lib/api/product-content";
import { studioDocument } from "@/features/product-detail/model/mappers-b2c";
import { studioSections, type StudioDocument } from "@/features/product-detail/model/studio-content";
import { toPricing } from "@/lib/pricing";

import type { PackageDetailData, PackageDetailVM, PackageItemVM, PackageUnitVM } from "./types";
import type { InfoSectionVM, TrainerVM } from "@/features/product-detail/model/types";

/**
 * Maps the B2C catalog product (`/api/v1/catalog/products/{slug}`) to the package page view model.
 * B2C is the source of truth: the package's own details plus `package_members` (the bundled B2C
 * products). Legacy rails/pricing are not read here.
 */
export function mapB2CPackageDetail(
  dto: CatalogProductResponse,
  id: number,
  content: ProductContentResponse | StudioDocument | null = null,
): PackageDetailData {
  const product = dto.product;
  // The page written in the Course Studio: published content carries it as `document`; the live preview
  // posts the document itself.
  const doc = studioDocument(content);
  const blocks = doc?.blocks ?? [];
  const banner = doc?.meta?.banner?.url
    ? { url: doc.meta.banner.url, alt: doc.meta.banner.alt ?? "", headline: doc.meta.banner.headline ?? "" }
    : null;
  const members = dto.package_members ?? [];
  const priceAmount = dto.price?.amount ?? null;

  const items: PackageItemVM[] = members.map((member, index) => {
    const kind = member.product_type === "diploma" ? "diploma" : "course";
    const memberId = memberCourseId(member.slug);
    const units: PackageUnitVM[] = (member.units ?? []).map((unit, unitIndex) => ({
      id: unitIndex + 1,
      title: unit.title,
      lessonCount: unit.lesson_count,
      duration: formatDurationFromSeconds(unit.duration_seconds),
    }));
    return {
      key: member.slug,
      kind,
      id: memberId ?? index + 1,
      position: index + 1,
      title: member.title ?? member.slug,
      summary: toPlainText(member.description, 160),
      image: member.image ?? null,
      // The member's own B2C course/diploma page.
      href: memberId ? (kind === "diploma" ? routes.diploma(memberId) : routes.course(memberId)) : null,
      category: member.category ?? null,
      duration: formatDurationFromSeconds(member.duration_seconds),
      lessonCount: member.lesson_count ?? 0,
      trainers: member.instructor_name
        ? [{ id: index + 1, name: member.instructor_name, href: routes.trainers }]
        : [],
      units,
      price: toPricing(member.price_amount),
      priceAmount: member.price_amount ?? null,
    };
  });

  const totalDuration = members.reduce((sum, member) => sum + (member.duration_seconds ?? 0), 0);
  const totalLessons = members.reduce((sum, member) => sum + (member.lesson_count ?? 0), 0);

  // The package's trainers: every bundled course's instructor once each, in order of appearance.
  const trainerMap = new Map<string, TrainerVM>();
  for (const member of members) {
    const name = member.instructor_name;
    if (!name || trainerMap.has(name)) {
      continue;
    }
    trainerMap.set(name, {
      id: trainerMap.size + 1,
      name,
      initial: name.trim().charAt(0),
      avatar: member.instructor_avatar ?? null,
      bio: [],
      summary: null,
      href: routes.trainers,
    });
  }
  const trainers = Array.from(trainerMap.values());
  const sections: InfoSectionVM[] = (dto.sections ?? []).map((section) => ({
    heading: section.heading,
    blocks: toTextBlocks(section.body),
    variant: section.variant === "goals" || section.variant === "audience" ? section.variant : "prose",
  }));

  const product_: PackageDetailVM = {
    id,
    title: (doc?.meta?.title ? cleanText(doc.meta.title) : null) || product.title || product.slug,
    summary: toPlainText(doc?.meta?.summary || product.short_description, 200),
    description: toPlainText(dto.description, 400),
    image: doc?.meta?.cover?.url || dto.image || null,
    price: toPricing(priceAmount, dto.price?.compare_at_amount ?? null),
    priceAmount,
    savings: savingsOf(items, priceAmount),
    courseCount: items.filter((item) => item.kind === "course").length,
    diplomaCount: items.filter((item) => item.kind === "diploma").length,
    duration: formatDurationFromSeconds(totalDuration),
    lessonCount: totalLessons,
    sections,
    readme: dto.readme?.trim() || null,
    banner,
    content: blocks.length > 0 ? studioSections(blocks) : null,
    items,
    trainers,
    href: routes.package(id),
    indexable: product.status === "published",
  };

  return { product: product_, related: [], recommended: [] };
}

/** The numeric catalog id encoded in a B2C product slug ("course-50" → 50); null when absent. */
function memberCourseId(slug: string): number | null {
  const match = slug.match(/(\d+)\s*$/);
  const id = match ? Number(match[1]) : Number.NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function savingsOf(items: readonly PackageItemVM[], priceAmount: number | null): PackageDetailVM["savings"] {
  if (!priceAmount || items.length === 0 || items.some((item) => item.priceAmount === null)) {
    return null;
  }
  const total = items.reduce((sum, item) => sum + (item.priceAmount ?? 0), 0);
  if (total <= priceAmount) {
    return null;
  }
  return {
    separateTotal: formatPrice(total) ?? "",
    amount: formatPrice(total - priceAmount) ?? "",
    percent: Math.round(((total - priceAmount) / total) * 100),
  };
}
