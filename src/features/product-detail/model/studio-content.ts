/*
 * A product page written in the admin's Course Studio: `meta` (title, summary, cover, banner, intro video,
 * instructors) and BlockNote `blocks`. The backend validates the block whitelist and URLs; the page still
 * renders it defensively (unknown blocks are skipped, unsafe URLs dropped) and never as raw HTML.
 */

export type StudioText = { type: "text"; text: string; styles?: Record<string, boolean | string> };
export type StudioLink = { type: "link"; href: string; content: StudioText[] };
export type StudioInline = StudioText | StudioLink;
export type StudioTableContent = {
  type: "tableContent";
  rows: { cells: (StudioInline[] | { content?: StudioInline[] })[] }[];
};

export type StudioBlock = {
  id: string;
  type: string;
  props?: Record<string, string | number | boolean | null>;
  content?: StudioInline[] | StudioTableContent;
  children?: StudioBlock[];
};

/**
 * The validated shape of a Course Studio page. This used to be a `zod` schema that was never
 * parsed: it only produced the type below, while pulling ~91 KB of `zod` into every client bundle
 * that imported this module (including the landing page's client sections). The API remains the
 * gatekeeper; the renderers below still check every URL and skip unknown blocks.
 */
export type StudioImage = { url: string; alt?: string | null };
export type StudioBannerImage = StudioImage & { headline?: string | null };
export type StudioInstructor = { ref: string; display_name: string; avatar_url?: string | null };
export type StudioDocument = {
  schema_version: 1;
  meta: {
    title: string;
    summary: string;
    cover?: StudioImage | null;
    banner?: StudioBannerImage | null;
    intro_video_id?: string | null;
    instructors?: StudioInstructor[];
  };
  blocks: StudioBlock[];
};

/** One page section: the blocks under a level-2 heading (`heading` is null for the blocks before the first). */
export type StudioSectionVM = { id: string; heading: string | null; blocks: StudioBlock[] };

export type StudioBannerVM = { url: string; alt: string; headline: string };

/** `https:` or a site-relative path; anything else (javascript:, data:, http:) is dropped. */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  return url.startsWith("https://") || url.startsWith("http://") || (url.startsWith("/") && !url.startsWith("//")) ? url : null;
}

export function inlineText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return (content as StudioInline[])
    .map((item) => (item.type === "link" ? inlineText(item.content) : (item.text ?? "")))
    .join("");
}

export function studioSections(blocks: readonly StudioBlock[]): StudioSectionVM[] {
  const sections: StudioSectionVM[] = [];
  let current: StudioSectionVM = { id: "intro", heading: null, blocks: [] };
  for (const [index, block] of blocks.entries()) {
    if (block.type === "heading" && block.props?.level === 2) {
      if (current.heading !== null || current.blocks.length) sections.push(current);
      current = { id: `s-${block.id || index}`, heading: inlineText(block.content).trim() || null, blocks: [] };
    } else {
      current.blocks.push(block);
    }
  }
  if (current.heading !== null || current.blocks.length) sections.push(current);
  return sections;
}

export type GalleryItem = { url: string; alt: string };

export function galleryItems(value: unknown): GalleryItem[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const items = JSON.parse(value) as unknown;
    if (!Array.isArray(items)) return [];
    return items.flatMap((item) => {
      const url = safeUrl((item as GalleryItem)?.url);
      return url ? [{ url, alt: String((item as GalleryItem).alt ?? "") }] : [];
    });
  } catch {
    return [];
  }
}

/** `legacy:trainer:12` → 12. */
export function legacyTrainerId(ref: string): number | null {
  const match = /^legacy:trainer:(\d+)$/.exec(ref);
  return match ? Number(match[1]) : null;
}

/** `tags.items`: a JSON array of chip labels (blank ones dropped). */
export function tagItems(value: unknown): string[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const items = JSON.parse(value) as unknown;
    return Array.isArray(items) ? items.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
  } catch {
    return [];
  }
}
