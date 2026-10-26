import { z } from "zod";

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

const image = z.object({ url: z.string(), alt: z.string().optional().default("") });

export const studioDocumentSchema = z.object({
  schema_version: z.literal(1),
  meta: z
    .object({
      title: z.string().default(""),
      summary: z.string().default(""),
      cover: image.nullish(),
      banner: image.extend({ headline: z.string().optional().default("") }).nullish(),
      intro_video_id: z.string().nullish(),
      instructors: z
        .array(z.object({ ref: z.string(), display_name: z.string(), avatar_url: z.string().nullish() }))
        .default([]),
    })
    .default({ title: "", summary: "", instructors: [] }),
  blocks: z.array(z.custom<StudioBlock>((value) => typeof value === "object" && value !== null)).default([]),
});

export type StudioDocument = z.infer<typeof studioDocumentSchema>;

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
