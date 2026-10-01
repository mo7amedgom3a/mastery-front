import type { TextBlock } from "@/lib/format";

/** Paragraphs and lists, plus a small heading for a group inside a section (e.g. refunds per product). */
export type LegalBlock = TextBlock | { type: "h"; text: string };

/** One collapsible section of a legal page; `id` is its in-page anchor. */
export type LegalSection = {
  id: string;
  title: string;
  blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  title: string;
  /** Meta description and the line under the page title. */
  description: string;
  /** When the text last changed (ISO date). */
  updated: string;
  sections: readonly LegalSection[];
};
