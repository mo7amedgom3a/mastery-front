import type { BlogBlock, InlineContent, TableContent, TocEntry } from "./types";

/** Text of inline content (links included), styles dropped. */
export function plainText(content: InlineContent[] | TableContent | null | undefined): string {
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((item) => {
      if (item.type === "text") return item.text;
      return plainText(item.content);
    })
    .join("");
}

/** Every textual block of a document, for the reading-time fallback. */
export function documentText(blocks: BlogBlock[]): string {
  const parts: string[] = [];
  const visit = (block: BlogBlock) => {
    if (block.type === "table") {
      const table = block.content as TableContent | null;
      for (const row of table?.rows ?? []) {
        for (const cell of row.cells) {
          parts.push(plainText(Array.isArray(cell) ? cell : cell.content));
        }
      }
    } else {
      parts.push(plainText(block.content as InlineContent[] | null));
    }
    for (const child of block.children ?? []) visit(child);
  };
  for (const block of blocks) visit(block);
  return parts.join(" ");
}

export function propString(props: BlogBlock["props"], key: string): string {
  const value = props?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function propNumber(props: BlogBlock["props"], key: string, fallback: number): number {
  const value = props?.[key];
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : fallback;
}

/** Custom blocks keep their list props as a JSON string; accept an array too (Studio previews). */
export function parseJsonList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** `toc.items`: `[{label, href}]`; anchors (`#…`) and external links only. */
export function parseTocItems(value: unknown): { label: string; href: string }[] {
  return parseJsonList(value).flatMap((item) => {
    const entry = item as { label?: unknown; href?: unknown };
    if (typeof entry?.label !== "string" || !entry.label.trim() || typeof entry?.href !== "string") return [];
    const href = entry.href.trim();
    if (!href || (!href.startsWith("#") && !/^(?:https?:\/\/|\/(?!\/))/i.test(href))) return [];
    return [{ label: entry.label.trim(), href }];
  });
}

export function parseStringList(value: unknown): string[] {
  return parseJsonList(value).filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim());
}

export function parseStats(value: unknown): { value: string; label: string }[] {
  return parseJsonList(value).flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    const statValue = typeof record.value === "string" ? record.value.trim() : typeof record.value === "number" ? String(record.value) : "";
    const label = typeof record.label === "string" ? record.label.trim() : "";
    return statValue && label ? [{ value: statValue, label }] : [];
  });
}

/**
 * A stable anchor for a heading. Studio ids are uuids, which are safe as html ids; older documents
 * without ids fall back to their position in the tree.
 */
export function headingAnchor(block: BlogBlock, path: number[]): string {
  const id = typeof block.id === "string" ? block.id.trim() : "";
  return /^[A-Za-z0-9_-]{1,80}$/.test(id) ? `h-${id}` : `h-${path.join("-")}`;
}

/** The table of contents: level 1-2 headings, in document order. */
export function collectToc(blocks: BlogBlock[]): TocEntry[] {
  const entries: TocEntry[] = [];
  const visit = (block: BlogBlock, path: number[]) => {
    if (block.type === "heading") {
      const level = propNumber(block.props, "level", 1);
      const text = plainText(block.content as InlineContent[] | null).trim();
      if (level <= 2 && text) {
        entries.push({ id: headingAnchor(block, path), text, level });
      }
    }
    (block.children ?? []).forEach((child, index) => visit(child, [...path, index]));
  };
  blocks.forEach((block, index) => visit(block, [index]));
  return entries;
}
