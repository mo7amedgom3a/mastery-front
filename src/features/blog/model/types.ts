import type { Route } from "next";

/** DTOs the blog API returns, and the view models the pages render. Nothing raw reaches a component. */

export type BlogCategory = {
  category_id: string;
  slug: string;
  name: string;
  sort_order: number;
  post_count: number;
};

export type BlogAuthor = {
  instructor_id: string;
  /** The expert-page key: a trainer id, `c{id}` for a consultant, or a B2C instructor uuid. */
  key: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
};

export type BlogPostStatus = "draft" | "published" | (string & {});

export type BlogPostListItem = {
  post_id: string;
  slug: string;
  title: string;
  summary: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  reading_minutes: number | null;
  views_count: number;
  author: BlogAuthor | null;
  categories: BlogCategory[];
  tags: string[];
};

export type BlogPostList = {
  items: BlogPostListItem[];
  total: number;
  page: number;
  page_size: number;
};

/** What a card mapper needs; preview bases may omit fields the API always sends. */
export type BlogListItemLike = {
  post_id?: string;
  slug: string;
  title: string;
  summary: string;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  published_at?: string | null;
  reading_minutes?: number | null;
  views_count?: number;
  author?: BlogAuthor | null;
  categories?: BlogCategory[] | null;
  tags?: string[];
  document?: BlogDocument;
};

// --- BlockNote document -----------------------------------------------------

export type TextInline = {
  type: "text";
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    code?: boolean;
    textColor?: string;
    backgroundColor?: string;
  } | null;
};

export type LinkInline = {
  type: "link";
  href: string;
  content: InlineContent[];
};

export type InlineContent = TextInline | LinkInline;

export type TableCell = InlineContent[] | { content?: InlineContent[] };

export type TableContent = {
  type: "tableContent";
  rows: { cells: TableCell[] }[];
};

export type BlogBlockType =
  | "heading"
  | "paragraph"
  | "bulletListItem"
  | "numberedListItem"
  | "quote"
  | "image"
  | "video"
  | "divider"
  | "table"
  | "lead"
  | "banner"
  | "callout"
  | "faq"
  | "tags"
  | "takeaways"
  | "stats"
  | "toc";

export type BlogBlock = {
  id?: string;
  type: BlogBlockType;
  props?: Record<string, unknown> | null;
  /** Inline content, a table, or nothing (contentless custom blocks keep their data in props). */
  content?: InlineContent[] | TableContent | null;
  children?: BlogBlock[];
};

export type BlogDocument = {
  schema_version: number;
  meta: {
    title: string;
    summary: string;
    cover: { url: string; alt: string } | null;
    tags: string[];
  };
  blocks: BlogBlock[];
};

export type BlogPostDetail = BlogPostListItem & {
  document: BlogDocument;
  readme_source: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  related: BlogPostListItem[];
};

// --- view models ------------------------------------------------------------

export type BlogAuthorVM = {
  key: string;
  name: string;
  initial: string;
  avatar: string | null;
  bio: string | null;
  /** The author's page: the curated blog profile when one exists, else the expert page. */
  href: Route;
  /** The catalog expert page (training programs and bookings). */
  expertHref: Route;
};

export type BlogCardVM = {
  slug: string;
  href: Route;
  title: string;
  summary: string;
  cover: string | null;
  coverAlt: string;
  date: string | null;
  publishedAt: string | null;
  readingMinutes: number;
  author: BlogAuthorVM | null;
  categories: { slug: string; name: string; href: Route }[];
  tags: string[];
};

export type BlogPostVM = BlogCardVM & {
  views: number;
  document: BlogDocument;
  bodyTags: string[];
  related: BlogCardVM[];
};

export type BlogCategoryVM = BlogCategory & { href: Route };

export type BlogListData = {
  posts: BlogCardVM[];
  total: number;
  page: number;
  pageSize: number;
  category: string | null;
  categories: BlogCategoryVM[];
};

export type TocEntry = { id: string; text: string; level: number };

export type PreviewMessage = {
  source: "mastery-studio";
  type: "render";
  kind: "blog-post";
  base: unknown;
  document: BlogDocument;
};
