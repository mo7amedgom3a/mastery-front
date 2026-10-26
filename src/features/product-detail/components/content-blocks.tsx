import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Info,
  MessageCircleQuestion,
  Plus,
  UserRound,
} from "lucide-react";
import React, { type ReactNode } from "react";

import { ProductCard } from "@/components/ui/product-card";
import { programCardsOf } from "@/features/expert-detail/model/page-document";
import { cn } from "@/lib/cn";
import {
  galleryItems,
  safeUrl,
  type StudioBlock,
  type StudioInline,
  type StudioSectionVM,
  type StudioTableContent,
  type StudioText,
  tagItems,
} from "../model/studio-content";

/** The palette the studio's text-colour picker offers; anything else is ignored. */
const TEXT_COLORS: Record<string, string> = {
  default: "",
  gray: "text-fg-muted",
  brown: "text-amber-800",
  orange: "text-orange-600",
  yellow: "text-yellow-600",
  green: "text-green",
  blue: "text-blue-600",
  purple: "text-purple-600",
  red: "text-coral",
  pink: "text-pink-600",
};

const BACKGROUND_COLORS: Record<string, string> = {
  default: "",
  gray: "bg-surface-alt",
  brown: "bg-amber-100",
  orange: "bg-orange-100",
  yellow: "bg-yellow-100",
  green: "bg-green/10",
  blue: "bg-blue-100",
  purple: "bg-purple-100",
  red: "bg-coral/10",
  pink: "bg-pink-100",
};

function colorClass(styles: StudioText["styles"], key: "textColor" | "backgroundColor") {
  const value = styles?.[key];
  if (typeof value !== "string" || value === "default") return "";
  return (key === "textColor" ? TEXT_COLORS : BACKGROUND_COLORS)[value] ?? "";
}

function RenderText({ text, styles }: StudioText) {
  let node: ReactNode = text;
  if (styles?.code) {
    node = <code className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-sm">{node}</code>;
  }
  if (styles?.bold) {
    node = <strong>{node}</strong>;
  }
  if (styles?.italic) {
    node = <em>{node}</em>;
  }
  if (styles?.underline) {
    node = <u>{node}</u>;
  }
  if (styles?.strike) {
    node = <s>{node}</s>;
  }
  const textColor = colorClass(styles, "textColor");
  const backgroundColor = colorClass(styles, "backgroundColor");
  if (textColor || backgroundColor) {
    node = <span className={cn(textColor, backgroundColor)}>{node}</span>;
  }
  return <>{node}</>;
}

export function InlineContent({ content }: { content?: StudioInline[] | StudioTableContent }) {
  if (!content || !Array.isArray(content) || content.length === 0) {
    return null;
  }
  return (
    <>
      {content.map((item, index) => {
        if (item.type === "link") {
          const href = safeUrl(item.href);
          const linkBody = item.content.map((child, childIdx) => (
            <RenderText key={childIdx} {...child} />
          ));
          if (!href) {
            return <span key={index}>{linkBody}</span>;
          }
          const isExternal = href.startsWith("http");
          return (
            <a
              key={index}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            >
              {linkBody}
            </a>
          );
        }
        return <RenderText key={index} {...item} />;
      })}
    </>
  );
}

function CalloutBlock({ block }: { block: StudioBlock }) {
  const tone = (block.props?.tone as string) || "info";
  const icon =
    tone === "success" ? (
      <CheckCircle2 className="size-5 shrink-0 text-green" />
    ) : tone === "warning" ? (
      <AlertTriangle className="size-5 shrink-0 text-coral" />
    ) : (
      <Info className="size-5 shrink-0 text-accent" />
    );

  const toneClass =
    tone === "success"
      ? "border-green/20 bg-green/5 text-fg"
      : tone === "warning"
        ? "border-coral/20 bg-coral/5 text-fg"
        : "border-accent/20 bg-accent/5 text-fg";

  return (
    <div
      data-block-id={block.id}
      className={cn("flex items-start gap-3 rounded-panel border p-4 leading-7", toneClass)}
    >
      <span className="mt-0.5">{icon}</span>
      <div className="text-pretty">
        <InlineContent content={block.content} />
      </div>
    </div>
  );
}

function FaqBlock({ block }: { block: StudioBlock }) {
  const question = String(block.props?.question ?? "").trim();
  return (
    <details
      data-block-id={block.id}
      className="group rounded-panel border border-line bg-surface p-4 transition-colors"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-fg marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5 text-base md:text-lg">
          <MessageCircleQuestion className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <span>{question || "سؤال شائع"}</span>
        </span>
        <Plus
          aria-hidden="true"
          className="size-5 shrink-0 text-accent transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
        />
      </summary>
      <div className="mt-3 border-t border-line/60 pt-3 leading-7 text-fg-muted">
        <InlineContent content={block.content} />
      </div>
    </details>
  );
}

function InstructorCardBlock({ block }: { block: StudioBlock }) {
  const name = String(block.props?.name ?? "").trim();
  const avatarUrl = safeUrl(block.props?.avatarUrl);
  const bio = String(block.props?.bio ?? "").trim();

  return (
    <div
      data-block-id={block.id}
      className="flex items-start gap-4 rounded-panel border border-line bg-surface p-4"
    >
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-alt border border-line">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="size-full object-cover" />
        ) : (
          <UserRound className="size-6 text-fg-muted" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        {name && <span className="font-bold text-fg text-base">{name}</span>}
        {bio && <p className="m-0 text-sm leading-6 text-fg-muted">{bio}</p>}
      </div>
    </div>
  );
}

function BannerBlock({ block }: { block: StudioBlock }) {
  const url = safeUrl(block.props?.url);
  const alt = String(block.props?.alt ?? "");
  const headline = String(block.props?.headline ?? "").trim();
  const subheadline = String(block.props?.subheadline ?? "").trim();

  return (
    <div
      data-block-id={block.id}
      className="relative overflow-hidden rounded-panel border border-line bg-surface p-6 md:p-8 min-h-36 flex flex-col justify-end"
    >
      {url && (
        <img
          src={url}
          alt={alt}
          className="absolute inset-0 size-full object-cover brightness-[0.4] -z-10"
        />
      )}
      <div className={cn("flex flex-col gap-1", url ? "text-white" : "text-fg")}>
        {headline && <h3 className="m-0 text-2xl font-bold">{headline}</h3>}
        {subheadline && <p className={cn("m-0 text-base", url ? "text-gray-200" : "text-fg-muted")}>{subheadline}</p>}
      </div>
    </div>
  );
}

function AssetGalleryBlock({ block }: { block: StudioBlock }) {
  const items = galleryItems(block.props?.items);
  if (items.length === 0) return null;

  return (
    <div
      data-block-id={block.id}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4"
    >
      {items.map((item, index) => (
        <div
          key={`${item.url}-${index}`}
          className="group overflow-hidden rounded-panel border border-line bg-surface aspect-video"
        >
          <img
            src={item.url}
            alt={item.alt || ""}
            loading="lazy"
            className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}

/** Featured programs (expert Studio pages): cards resolved from the expert's own items before rendering. */
function ProgramCardsBlock({ block }: { block: StudioBlock }) {
  const cards = programCardsOf(block.props?.cards);
  if (cards.length === 0) return null;
  return (
    <ul data-block-id={block.id} className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, position) => (
        <li key={card.slug} className="min-w-0">
          <ProductCard
            href={card.href}
            title={card.title}
            image={card.image}
            color={card.color}
            tag={card.tag}
            summary={card.summary}
            price={card.price}
            ctaLabel="التفاصيل"
            sizes="(min-width: 1200px) 390px, (min-width: 600px) 50vw, 100vw"
            tracking={{ surface: "expert-page", position }}
          />
        </li>
      ))}
    </ul>
  );
}

/** A row of chips (an expert's fields or skills), styled like the default expert page's. */
function TagsBlock({ block }: { block: StudioBlock }) {
  const items = tagItems(block.props?.items);
  if (items.length === 0) return null;
  const tone = block.props?.tone === "yellow" ? "ma-tag--yellow" : "ma-tag--soft";
  const label = String(block.props?.label ?? "").trim();
  return (
    <ul data-block-id={block.id} aria-label={label || undefined} className="ma-cluster m-0 list-none gap-2 p-0">
      {items.map((item) => (
        <li key={item} className={cn("ma-tag", tone)}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** A Bunny Stream GUID plays inline; any other URL is a direct video file. */
const BUNNY_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function VideoBlock({ block }: { block: StudioBlock }) {
  const raw = String(block.props?.url ?? block.props?.previewUrl ?? "").trim();
  if (!raw) return null;
  const caption = String(block.props?.caption ?? "").trim();

  // `url` is the video itself; `previewUrl` is its poster in BlockNote's video block.
  const source = safeUrl(raw);
  const poster = safeUrl(block.props?.previewUrl);

  let player: ReactNode = null;
  if (source && BUNNY_GUID.test(source)) {
    player = (
      <iframe
        src={`https://iframe.mediadelivery.net/embed/${source}?autoplay=false`}
        title={caption || "فيديو"}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video size-full border-0"
      />
    );
  } else if (source) {
    player = (
      <video
        src={source}
        poster={poster ?? undefined}
        controls
        preload="metadata"
        className="aspect-video size-full bg-black"
      />
    );
  } else if (poster) {
    player = <img src={poster} alt={caption} loading="lazy" className="aspect-video size-full object-cover" />;
  }
  if (!player) return null;

  return (
    <figure data-block-id={block.id} className="m-0 flex flex-col gap-2">
      <div className="overflow-hidden rounded-panel border border-line bg-black">{player}</div>
      {caption ? <figcaption className="text-center text-sm text-fg-muted">{caption}</figcaption> : null}
    </figure>
  );
}

function FileBlock({ block }: { block: StudioBlock }) {
  const url = safeUrl(block.props?.url);
  if (!url) return null;
  const name = String(block.props?.name ?? block.props?.filename ?? "").trim() || "تحميل الملف";
  const caption = String(block.props?.caption ?? "").trim();

  return (
    <a
      data-block-id={block.id}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-panel border border-line bg-surface p-4 no-underline transition-colors hover:border-accent/50"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
        <FileText className="size-5" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-fg">{name}</span>
        {caption ? <span className="truncate text-sm text-fg-muted">{caption}</span> : null}
      </span>
      <Download className="ms-auto size-5 shrink-0 text-fg-muted" aria-hidden="true" />
    </a>
  );
}

/** Blocks nested under a list item (BlockNote allows children); indented one level. */
function NestedBlocks({ blocks }: { blocks?: StudioBlock[] }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-3 border-s-2 border-line ps-4">
      {renderBlockGroup(blocks)}
    </div>
  );
}

function SingleBlock({ block }: { block: StudioBlock }) {
  switch (block.type) {
    case "banner":
      return <BannerBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "faq":
      return <FaqBlock block={block} />;
    case "instructorCard":
      return <InstructorCardBlock block={block} />;
    case "assetGallery":
      return <AssetGalleryBlock block={block} />;
    case "programCards":
      return <ProgramCardsBlock block={block} />;
    case "tags":
      return <TagsBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "file":
      return <FileBlock block={block} />;

    case "heading": {
      const level = Number(block.props?.level ?? 2);
      if (level === 1) {
        return (
          <h2 data-block-id={block.id} className="m-0 text-3xl font-bold text-fg">
            <InlineContent content={block.content} />
          </h2>
        );
      }
      if (level === 3) {
        return (
          <h4 data-block-id={block.id} className="m-0 text-xl font-bold text-fg">
            <InlineContent content={block.content} />
          </h4>
        );
      }
      return (
        <h3 data-block-id={block.id} className="m-0 text-2xl font-bold text-fg">
          <InlineContent content={block.content} />
        </h3>
      );
    }

    case "paragraph":
      return (
        <div data-block-id={block.id} className="flex flex-col gap-0">
          <p className="m-0 text-pretty leading-8 text-fg">
            <InlineContent content={block.content} />
          </p>
          <NestedBlocks blocks={block.children} />
        </div>
      );

    case "bulletListItem":
      return (
        <li data-block-id={block.id} className="flex flex-col gap-0">
          <span className="flex items-start gap-3 leading-8">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-pretty">
              <InlineContent content={block.content} />
            </span>
          </span>
          <NestedBlocks blocks={block.children} />
        </li>
      );

    case "numberedListItem":
      return (
        <li data-block-id={block.id} className="ps-1 leading-8 text-pretty">
          <InlineContent content={block.content} />
          <NestedBlocks blocks={block.children} />
        </li>
      );

    case "checkListItem":
    case "goals":
      return (
        <li data-block-id={block.id} className="flex flex-col gap-0">
          <span className="flex items-start gap-3 leading-8">
            <span
              className="mt-1 grid size-5 shrink-0 place-items-center rounded bg-accent/10 text-accent"
              aria-hidden="true"
            >
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            <span className="text-pretty">
              <InlineContent content={block.content} />
            </span>
          </span>
          <NestedBlocks blocks={block.children} />
        </li>
      );

    case "quote":
      return (
        <blockquote
          data-block-id={block.id}
          className="m-0 border-s-4 border-accent ps-4 py-1 italic leading-8 text-fg-muted"
        >
          <InlineContent content={block.content} />
        </blockquote>
      );

    case "image": {
      const url = safeUrl(block.props?.url);
      if (!url) return null;
      const alt = String(block.props?.alt ?? "");
      const caption = String(block.props?.caption ?? "");
      return (
        <figure data-block-id={block.id} className="m-0 flex flex-col gap-2">
          <img
            src={url}
            alt={alt}
            loading="lazy"
            className="rounded-panel border border-line object-cover max-h-[500px] w-full"
          />
          {caption ? <figcaption className="text-center text-sm text-fg-muted">{caption}</figcaption> : null}
        </figure>
      );
    }

    case "divider":
      return <hr data-block-id={block.id} className="my-2 border-t border-line" />;

    case "table": {
      const table = block.content as StudioTableContent | undefined;
      if (!table || table.type !== "tableContent" || !Array.isArray(table.rows)) {
        return null;
      }
      return (
        <div data-block-id={block.id} className="overflow-x-auto rounded-panel border border-line">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {table.rows.map((row, rIdx) => (
                <tr key={rIdx} className={cn("border-b border-line last:border-b-0", rIdx === 0 && "bg-surface-alt font-bold")}>
                  {row.cells.map((cell, cIdx) => {
                    const inline = Array.isArray(cell) ? cell : cell?.content;
                    return (
                      <td key={cIdx} className="p-3 text-start align-top">
                        <InlineContent content={inline} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      // Unknown or unsupported block: render inline text safely if available
      if (block.content && Array.isArray(block.content) && block.content.length > 0) {
        return (
          <p data-block-id={block.id} className="m-0 leading-8 text-pretty">
            <InlineContent content={block.content} />
          </p>
        );
      }
      return null;
  }
}

/**
 * Group adjacent list items (bullets, numbered, checklist) into proper semantic HTML list tags.
 */
function renderBlockGroup(blocks: readonly StudioBlock[]): ReactNode[] {
  const rendered: ReactNode[] = [];
  let currentList: { type: "bullet" | "numbered" | "check"; items: StudioBlock[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const { type, items } = currentList;
    if (type === "bullet") {
      rendered.push(
        <ul key={`list-${items[0].id}`} className="m-0 grid list-none gap-2 p-0">
          {items.map((b) => (
            <SingleBlock key={b.id} block={b} />
          ))}
        </ul>,
      );
    } else if (type === "numbered") {
      rendered.push(
        <ol key={`list-${items[0].id}`} className="m-0 grid list-decimal gap-2 ps-6 marker:text-accent">
          {items.map((b) => (
            <SingleBlock key={b.id} block={b} />
          ))}
        </ol>,
      );
    } else if (type === "check") {
      rendered.push(
        <ul key={`list-${items[0].id}`} className="m-0 grid list-none gap-3 p-0">
          {items.map((b) => (
            <SingleBlock key={b.id} block={b} />
          ))}
        </ul>,
      );
    }
    currentList = null;
  };

  for (const block of blocks) {
    if (block.type === "bulletListItem") {
      if (currentList && currentList.type !== "bullet") flushList();
      if (!currentList) currentList = { type: "bullet", items: [] };
      currentList.items.push(block);
    } else if (block.type === "numberedListItem") {
      if (currentList && currentList.type !== "numbered") flushList();
      if (!currentList) currentList = { type: "numbered", items: [] };
      currentList.items.push(block);
    } else if (block.type === "checkListItem" || block.type === "goals") {
      if (currentList && currentList.type !== "check") flushList();
      if (!currentList) currentList = { type: "check", items: [] };
      currentList.items.push(block);
    } else {
      flushList();
      rendered.push(<SingleBlock key={block.id} block={block} />);
    }
  }
  flushList();
  return rendered;
}

/**
 * Renders the Studio sections created in the admin's Course Studio (and the expert Studio). `wide` lets the text
 * use the full container width, for pages where the Studio content is the whole body (expert pages).
 */
export function ContentBlocks({ sections, wide = false }: { sections: readonly StudioSectionVM[]; wide?: boolean }) {
  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-12">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          data-block-id={section.id.replace(/^s-/, "")}
          className="scroll-mt-[calc(var(--header-h)+4.5rem)] flex flex-col gap-5"
        >
          {section.heading ? (
            <h3 className="m-0 text-2xl font-bold text-fg">{section.heading}</h3>
          ) : null}
          <div className={cn("flex flex-col gap-4 text-base leading-8 text-fg", !wide && "max-w-[68ch]")}>
            {renderBlockGroup(section.blocks)}
          </div>
        </section>
      ))}
    </div>
  );
}
