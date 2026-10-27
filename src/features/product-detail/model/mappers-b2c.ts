import type { CatalogProductResponse } from "@/lib/api/catalog";
import type { ProductContentResponse } from "@/lib/api/product-content";
import { expertKeyOfRef, routes } from "@/config/routes";
import { cleanText, formatClock, formatDurationFromSeconds, toPlainText, toTextBlocks } from "@/lib/format";
import { toPricing } from "@/lib/pricing";
import { emptySearchState, searchHref } from "@/features/search/model/params";
import { studioSections, type StudioDocument } from "./studio-content";

import type { InfoSectionVM, IntroVideoSource, LessonVM, ProductDetailData, ProductDetailVM, TopicChipVM, TrainerVM, UnitVM } from "./types";

/**
 * Maps the B2C catalog product (`/api/v1/catalog/products/{slug}`) to the course/diploma page view
 * model. B2C is the source of truth: units/lessons, the trainer and the price come from B2C; the page
 * written in the Course Studio comes from the published product content.
 */
export function studioDocument(content: ProductContentResponse | StudioDocument | null): StudioDocument | null {
  if (!content) return null;
  if ("document" in content && content.document) return content.document as StudioDocument;
  if ("schema_version" in content) return content as StudioDocument;
  return null;
}

const VIDEO_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The course/diploma intro video: the Studio page's `meta.intro_video_id` when set, else the product's own
 * (`intro_video_id`, copied from the legacy promo video). Only a Bunny GUID qualifies; the server still
 * checks it exists in the library (`verifyIntroVideo`) before the page shows a player.
 */
export function introVideoSource(
  dto: CatalogProductResponse,
  content: ProductContentResponse | StudioDocument | null,
): IntroVideoSource | null {
  const doc = studioDocument(content);
  const videoId = doc?.meta?.intro_video_id?.trim() || dto.intro_video_id?.trim();
  if (!videoId || !VIDEO_GUID.test(videoId)) return null;
  const name = cleanText(doc?.meta?.title) || cleanText(dto.product.title);
  return { videoId, title: `الفيديو التعريفي: ${name ?? ""}`, duration: null };
}

export function mapB2CProductDetail(
  dto: CatalogProductResponse,
  id: number,
  content: ProductContentResponse | StudioDocument | null,
): ProductDetailData {
  const product = dto.product;
  const kind = product.product_type === "diploma" ? "diploma" : "course";
  const priceAmount = dto.price?.amount ?? null;

  const curriculum: UnitVM[] = (dto.units ?? []).map((unit) => {
    const lessons: LessonVM[] = (unit.lessons ?? []).map((lesson) => ({
      id: lesson.lesson_id,
      title: lesson.title,
      duration: formatClock(lesson.duration_seconds),
      free: lesson.is_free,
    }));
    return {
      id: unit.unit_id,
      title: unit.title,
      summary: null,
      duration: formatDurationFromSeconds(unit.duration_seconds),
      lessons,
    };
  });
  const allLessons = curriculum.flatMap((unit) => unit.lessons);

  const trainers: TrainerVM[] = dto.instructor_name
    ? [
        {
          id: 1,
          name: dto.instructor_name,
          initial: dto.instructor_name.trim().charAt(0),
          avatar: dto.instructor_avatar ?? null,
          bio: [],
          summary: null,
          href: dto.instructor_key ? routes.expert(dto.instructor_key, dto.instructor_name) : null,
        },
      ]
    : [];

  const sections: InfoSectionVM[] = (dto.sections ?? []).map((section) => ({
    heading: section.heading,
    blocks: toTextBlocks(section.body),
    variant: section.variant === "goals" || section.variant === "audience" ? section.variant : "prose",
  }));
  // The page written in the Course Studio: published content carries it as `document` (`meta` + `blocks`);
  // the live preview posts the document itself.
  const doc = studioDocument(content);
  const blocks = doc?.blocks ?? [];
  const studioContent = blocks.length > 0 ? studioSections(blocks) : null;
  const banner = doc?.meta?.banner?.url
    ? { url: doc.meta.banner.url, alt: doc.meta.banner.alt ?? "", headline: doc.meta.banner.headline ?? "" }
    : null;
  const metaTrainers = (doc?.meta?.instructors ?? []).map((inst, index): TrainerVM => {
    const name = cleanText(inst.display_name) || trainers[0]?.name || "";
    const key = expertKeyOfRef(inst.ref);
    return {
      id: index + 1,
      name,
      initial: name.trim().charAt(0) || "م",
      avatar: inst.avatar_url || trainers[0]?.avatar || null,
      bio: [],
      summary: null,
      href: key ? routes.expert(key, name) : (trainers.find((trainer) => trainer.name === name)?.href ?? null),
    };
  });

  const product_: ProductDetailVM = {
    kind,
    id,
    title: (doc?.meta?.title ? cleanText(doc.meta.title) : null) || product.title || product.slug,
    summary: toPlainText(doc?.meta?.summary || product.short_description, 200),
    description: toPlainText(dto.description, 400),
    category: dto.fields?.[0]?.name ?? dto.categories?.[0]?.name ?? null,
    topics: topicChips(dto),
    image: doc?.meta?.cover?.url || dto.image || null,
    duration: formatDurationFromSeconds(dto.duration_seconds),
    rating: null,
    price: toPricing(priceAmount, dto.price?.compare_at_amount ?? null, dto.price?.currency_code),
    priceAmount,
    lessonCount: dto.lesson_count ?? allLessons.length,
    freeLessonCount: allLessons.filter((lesson) => lesson.free).length,
    introVideo: null,
    sections,
    readme: dto.readme?.trim() || null,
    banner,
    content: studioContent,
    curriculum,
    trainers: metaTrainers.length > 0 ? metaTrainers : trainers,
    href: kind === "diploma" ? routes.diploma(id) : routes.course(id),
    indexable: product.status === "published",
  };

  return { product: product_, related: [], recommended: [] };
}

const MAX_TOPIC_TAGS = 6;

/** The page's topic chips: its field(s), then sub-categories, skills and tags, each a search link. */
function topicChips(dto: CatalogProductResponse): TopicChipVM[] {
  const chips: TopicChipVM[] = [];
  const seen = new Set<string>();
  const add = (kind: TopicChipVM["kind"], label: string | null | undefined, href: TopicChipVM["href"]) => {
    const clean = cleanText(label);
    if (!clean || seen.has(`${kind}:${clean}`)) return;
    seen.add(`${kind}:${clean}`);
    chips.push({ kind, label: clean, href });
  };
  const fieldIds = new Set((dto.fields ?? []).map((field) => field.category_id));
  for (const field of dto.fields ?? []) {
    add("field", field.name, searchHref({ ...emptySearchState, categories: [field.slug.toLowerCase()] }));
  }
  for (const category of dto.categories ?? []) {
    if (fieldIds.has(category.category_id)) continue;
    add("category", category.name, searchHref({ ...emptySearchState, categories: [category.slug.toLowerCase()] }));
  }
  for (const skill of dto.skills ?? []) {
    add("skill", skill.name, searchHref({ ...emptySearchState, skills: [skill.slug.toLowerCase()] }));
  }
  for (const tag of (dto.tags ?? []).slice(0, MAX_TOPIC_TAGS)) {
    add("tag", tag, searchHref({ ...emptySearchState, tags: [tag.replace(/\s+/g, " ").toLowerCase()] }));
  }
  return chips;
}
