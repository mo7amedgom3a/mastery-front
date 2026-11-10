import { routes } from "@/config/routes";
import { sanitizeFaqs } from "@/lib/seo/faq";

import { authorProfileByKey } from "../data/author-profiles";
import { documentText, plainText, propString } from "./blocks";
import { blogCategoryHref } from "./links";
import type {
  BlogAuthor,
  BlogAuthorVM,
  BlogBlock,
  BlogCardVM,
  BlogCategory,
  BlogCategoryVM,
  BlogDocument,
  BlogListData,
  BlogListItemLike,
  BlogPostDetail,
  BlogPostList,
  BlogPostVM,
} from "./types";

const ARABIC_DATE = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "٢٩ أكتوبر ٢٠٢٦"; null for a missing or malformed timestamp. */
export function formatBlogDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : ARABIC_DATE.format(date);
}

const ARABIC_NUMBER = new Intl.NumberFormat("ar-EG");

/** ٦, ١٢ … Arabic-Indic digits for counts in prose. */
export function formatArabicNumber(value: number): string {
  return ARABIC_NUMBER.format(value);
}

export function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "م";
}

/** ~180 Arabic words a minute, the same speed the backend uses when it can compute one. */
export function estimateReadingMinutes(document: BlogDocument | null | undefined): number {
  const words = documentText(document?.blocks ?? []).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function authorVM(author: BlogAuthor | null | undefined): BlogAuthorVM | null {
  if (!author?.key || !author.name?.trim()) return null;
  const name = author.name.trim();
  const profile = authorProfileByKey(author.key);
  const expertHref = routes.expert(author.key, name);
  return {
    key: author.key,
    name,
    initial: initialOf(name),
    avatar: author.avatar_url?.trim() || null,
    bio: author.bio?.trim() || null,
    href: profile ? routes.blogAuthor(profile.slug) : expertHref,
    expertHref,
  };
}

function coverOf(item: BlogListItemLike): { url: string | null; alt: string } {
  const url = item.cover_image_url?.trim() || item.document?.meta.cover?.url?.trim() || null;
  const alt = item.cover_image_alt?.trim() || item.document?.meta.cover?.alt?.trim() || item.title;
  return { url, alt };
}

function categoryVMs(categories: BlogCategory[] | null | undefined): BlogCategoryVM[] {
  return (categories ?? []).map((category) => ({ ...category, href: blogCategoryHref(category.slug) }));
}

export function cardVM(item: BlogListItemLike): BlogCardVM {
  const cover = coverOf(item);
  const title = item.title?.trim() || item.document?.meta.title?.trim() || "بدون عنوان";
  return {
    slug: item.slug,
    href: routes.blogPost(item.slug),
    title,
    summary: item.summary?.trim() || item.document?.meta.summary?.trim() || "",
    cover: cover.url,
    coverAlt: cover.alt,
    date: formatBlogDate(item.published_at),
    publishedAt: item.published_at ?? null,
    readingMinutes: item.reading_minutes ? Math.max(1, item.reading_minutes) : estimateReadingMinutes(item.document),
    author: authorVM(item.author),
    categories: categoryVMs(item.categories),
    tags: item.tags ?? [],
  };
}

export function postVM(post: BlogPostDetail): BlogPostVM {
  const card = cardVM(post);
  const bodyTags = post.document.meta.tags.filter((tag) => tag.trim() !== "");
  return {
    ...card,
    summary: card.summary || post.document.meta.summary,
    views: post.views_count ?? 0,
    document: post.document,
    bodyTags: bodyTags.length > 0 ? bodyTags : card.tags,
    related: (post.related ?? []).map(cardVM),
    updatedAt: textOf(post.updated_at),
    faqs: faqsOf(post.document),
  };
}

/** Q&A blocks (possibly nested) as sanitized FAQ entries for `FAQPage` markup. */
export function faqsOf(document: BlogDocument): { question: string; answer: string }[] {
  const found: { question: string; answer: string }[] = [];
  const walk = (blocks: readonly BlogBlock[]) => {
    for (const block of blocks) {
      if (block.type === "faq") {
        const question = propString(block.props, "question").trim();
        const answer = plainText(block.content).trim();
        if (question && answer) found.push({ question, answer });
      }
      if (block.children && block.children.length > 0) walk(block.children);
    }
  };
  walk(document.blocks);
  return sanitizeFaqs(found);
}

export function listData(list: BlogPostList | null, categories: BlogCategory[] | null, state: { page: number; category: string | null; pageSize: number }): BlogListData {
  return {
    posts: (list?.items ?? []).map(cardVM),
    total: list?.total ?? 0,
    page: list?.page ?? state.page,
    pageSize: list?.page_size ?? state.pageSize,
    category: state.category,
    categories: categoryVMs(categories),
  };
}

// --- Studio preview ---------------------------------------------------------

type UnknownRecord = Record<string, unknown>;

function recordOf(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
}

function textOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
}

function authorOf(value: unknown): BlogAuthor | null {
  const record = recordOf(value);
  if (!record) return null;
  const key = textOf(record.key);
  const name = textOf(record.name);
  if (!key || !name) return null;
  return {
    instructor_id: textOf(record.instructor_id) ?? "",
    key,
    name,
    avatar_url: textOf(record.avatar_url),
    bio: textOf(record.bio),
  };
}

function categoryOf(value: unknown): BlogCategory | null {
  const record = recordOf(value);
  const slug = record ? textOf(record.slug) : null;
  const name = record ? textOf(record.name) : null;
  if (!record || !slug || !name) return null;
  return {
    category_id: textOf(record.category_id) ?? slug,
    slug,
    name,
    sort_order: typeof record.sort_order === "number" ? record.sort_order : 0,
    post_count: typeof record.post_count === "number" ? record.post_count : 0,
  };
}

/** The base of a Studio render message, in any of the shapes the admin may send. */
function previewBase(base: unknown): BlogListItemLike & { related?: unknown[] } {
  const record = recordOf(base) ?? {};
  const post = recordOf(record.post);
  const source = post ?? record;
  const cover = recordOf(source.cover);
  return {
    post_id: textOf(source.post_id) ?? "preview",
    slug: textOf(source.slug) ?? "preview",
    title: textOf(source.title) ?? "",
    summary: textOf(source.summary) ?? "",
    cover_image_url: textOf(source.cover_image_url) ?? textOf(cover?.url),
    cover_image_alt: textOf(source.cover_image_alt) ?? textOf(cover?.alt),
    published_at: textOf(source.published_at),
    reading_minutes: typeof source.reading_minutes === "number" ? source.reading_minutes : null,
    views_count: typeof source.views_count === "number" ? source.views_count : 0,
    author: authorOf(source.author),
    categories: Array.isArray(source.categories)
      ? source.categories.map(categoryOf).filter((item): item is BlogCategory => item !== null)
      : [],
    tags: stringList(source.tags),
    related: Array.isArray(source.related) ? source.related : [],
  };
}

/**
 * A post from a live Studio render: the saved page fields (`base`) plus the document being edited.
 * Missing fields fall back to the document's own meta, so an unsaved draft still renders fully.
 */
export function previewPostVM(base: unknown, document: BlogDocument): BlogPostVM {
  const item = previewBase(base);
  const card = cardVM({ ...item, document });
  const related = (item.related ?? [])
    .map((relatedItem) => {
      const record = recordOf(relatedItem);
      const slug = record ? textOf(record.slug) : null;
      if (!record || !slug) return null;
      return cardVM(previewBase(record));
    })
    .filter((relatedCard): relatedCard is BlogCardVM => relatedCard !== null);

  return {
    ...card,
    views: item.views_count ?? 0,
    document,
    bodyTags: document.meta.tags.filter((tag) => tag.trim() !== "").length > 0 ? document.meta.tags : card.tags,
    related,
    updatedAt: null,
    faqs: faqsOf(document),
  };
}
