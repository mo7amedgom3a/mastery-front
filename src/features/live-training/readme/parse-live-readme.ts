/**
 * A live training's page README: markdown whose `## heading`s are the page sections and whose fenced
 * containers `:::name [title]` … `:::` are card elements drawn with the live page's own layouts.
 * The backend writes the same grammar (`newwebsitebackend/app/modules/catalog/domain/live_readme.py`) and
 * the admin studio edits it (`admin-dashboard/src/features/learning/studio/readme/live-elements.ts`).
 *
 * - `outcomes`, `certificates`, `features`, `faq`: `### title` items, each followed by its text;
 * - `levels`: `### title | EN LABEL` items, each followed by its text;
 * - `training`: `### group` items, each followed by `- point` lines;
 * - `checklist`: `- item` lines;
 * - `method`: `- **label**: text` lines;
 * - `trainer`: a `> roles` line, `- credential` lines and paragraphs.
 *
 * An unknown `:::name` stays plain markdown, and an unclosed container ends with its section, so no text
 * is ever lost. `## Heading {#id}` sets the section's anchor.
 */

export type TitledItem = { title: string; text: string };

export type LiveElement =
  | { kind: "outcomes" | "certificates" | "features" | "faq"; title: string; items: TitledItem[] }
  | { kind: "levels"; title: string; items: { title: string; label: string; text: string }[] }
  | { kind: "training"; title: string; groups: { title: string; items: string[] }[] }
  | { kind: "checklist"; title: string; items: string[] }
  | { kind: "method"; title: string; items: { label: string; text: string }[] }
  | { kind: "trainer"; title: string; roles: string; credentials: string[]; paragraphs: string[] };

export type LiveElementKind = LiveElement["kind"];

export type LiveSegment = { kind: "markdown"; text: string } | { kind: "element"; element: LiveElement };

export type LiveSection = { id: string; title: string; segments: LiveSegment[] };

export const LIVE_ELEMENT_KINDS: readonly LiveElementKind[] = [
  "outcomes",
  "checklist",
  "levels",
  "training",
  "method",
  "trainer",
  "certificates",
  "features",
  "faq",
];

/** Anchor of a section by its first card element: the ids the JSON-driven page already uses. */
const ELEMENT_SECTION_ID: Record<LiveElementKind, string> = {
  outcomes: "objectives",
  checklist: "audience",
  levels: "curriculum",
  training: "activities",
  method: "method",
  trainer: "instructor",
  certificates: "certificate",
  features: "certificate",
  faq: "faq",
};

const HEADING = /^##\s+(.+?)(?:\s*\{#([a-z0-9-]+)\})?\s*$/;
const OPENER = /^:::([a-z]+)(?:\s+(.*))?$/;
const ITEM = /^###\s+(.+)$/;
const BULLET = /^[-*+]\s+(.+)$/;

const isKind = (name: string): name is LiveElementKind => (LIVE_ELEMENT_KINDS as readonly string[]).includes(name);

/** Text lines of an item joined into one paragraph. */
const joinText = (lines: string[]) => lines.join(" ").replace(/\s+/g, " ").trim();

function titledItems(lines: string[]): TitledItem[] {
  const items: { title: string; lines: string[] }[] = [];
  for (const line of lines) {
    const heading = line.match(ITEM);
    if (heading) items.push({ title: heading[1].trim(), lines: [] });
    else if (line.trim()) {
      if (items.length === 0) items.push({ title: "", lines: [] });
      items[items.length - 1].lines.push(line.trim());
    }
  }
  return items.map((item) => ({ title: item.title, text: joinText(item.lines) })).filter((item) => item.title || item.text);
}

/** Splits "المستوى الأول | LEVEL 1" into its title and the label after the last `|`. */
function splitLabel(title: string): { title: string; label: string } {
  const index = title.lastIndexOf("|");
  return index < 0 ? { title, label: "" } : { title: title.slice(0, index).trim(), label: title.slice(index + 1).trim() };
}

const bulletText = (line: string) => line.trim().match(BULLET)?.[1].trim() ?? line.trim();

export function parseElement(kind: LiveElementKind, title: string, lines: string[]): LiveElement {
  switch (kind) {
    case "levels":
      return { kind, title, items: titledItems(lines).map((item) => ({ ...splitLabel(item.title), text: item.text })) };
    case "training": {
      const groups: { title: string; items: string[] }[] = [];
      for (const line of lines) {
        const heading = line.match(ITEM);
        if (heading) groups.push({ title: heading[1].trim(), items: [] });
        else if (line.trim()) {
          if (groups.length === 0) groups.push({ title: "", items: [] });
          groups[groups.length - 1].items.push(bulletText(line));
        }
      }
      return { kind, title, groups };
    }
    case "checklist":
      return { kind, title, items: lines.filter((line) => line.trim()).map(bulletText) };
    case "method":
      return {
        kind,
        title,
        items: lines
          .filter((line) => line.trim())
          .map((line) => {
            const text = bulletText(line);
            const bold = text.match(/^\*\*(.+?)\*\*\s*[:：]?\s*(.*)$/);
            if (bold) return { label: bold[1].trim(), text: bold[2].trim() };
            const colon = text.indexOf(":");
            return colon < 0 ? { label: text, text: "" } : { label: text.slice(0, colon).trim(), text: text.slice(colon + 1).trim() };
          }),
      };
    case "trainer": {
      const element: LiveElement = { kind, title, roles: "", credentials: [], paragraphs: [] };
      for (const line of lines) {
        const value = line.trim();
        if (!value) continue;
        if (value.startsWith(">")) element.roles = joinText([element.roles, value.replace(/^>\s*/, "")]);
        else if (BULLET.test(value)) element.credentials.push(bulletText(value));
        else element.paragraphs.push(value);
      }
      return element;
    }
    default:
      return { kind, title, items: titledItems(lines) };
  }
}

function pushMarkdown(segments: LiveSegment[], lines: string[]) {
  const text = lines.join("\n").trim();
  if (text) segments.push({ kind: "markdown", text });
}

function parseSegments(lines: string[]): LiveSegment[] {
  const segments: LiveSegment[] = [];
  let prose: string[] = [];
  let fenced = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith("```")) fenced = !fenced;
    const opener = fenced ? null : line.trim().match(OPENER);
    if (!opener || !isKind(opener[1])) {
      prose.push(line);
      continue;
    }
    const body: string[] = [];
    index += 1;
    while (index < lines.length && lines[index].trim() !== ":::") body.push(lines[index++]);
    pushMarkdown(segments, prose);
    prose = [];
    segments.push({ kind: "element", element: parseElement(opener[1], (opener[2] ?? "").trim(), body) });
  }
  pushMarkdown(segments, prose);
  return segments;
}

/** The README's sections in order; text before the first `##` is a section with an empty title. */
export function parseLiveReadme(markdown: string): LiveSection[] {
  const raw: { title: string; id: string | null; lines: string[] }[] = [];
  let current: (typeof raw)[number] = { title: "", id: null, lines: [] };
  let fenced = false;
  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    if (line.trim().startsWith("```")) fenced = !fenced;
    const heading = fenced ? null : line.match(HEADING);
    if (heading) {
      raw.push(current);
      current = { title: heading[1].trim(), id: heading[2] ?? null, lines: [] };
    } else current.lines.push(line);
  }
  raw.push(current);

  const used = new Set<string>();
  const unique = (id: string) => {
    let candidate = id;
    for (let n = 2; used.has(candidate); n += 1) candidate = `${id}-${n}`;
    used.add(candidate);
    return candidate;
  };

  const sections: LiveSection[] = [];
  for (const section of raw) {
    const segments = parseSegments(section.lines);
    if (!section.title && segments.length === 0) continue;
    const element = segments.find((segment) => segment.kind === "element");
    const base =
      section.id ??
      (element?.kind === "element"
        ? ELEMENT_SECTION_ID[element.element.kind]
        : used.has("about")
          ? `section-${sections.length + 1}`
          : "about");
    sections.push({ id: unique(base), title: section.title, segments });
  }
  return sections;
}

/** The card elements of a section, in order. */
export function sectionElements(section: LiveSection): LiveElement[] {
  return section.segments.flatMap((segment) => (segment.kind === "element" ? [segment.element] : []));
}
