import { AlertTriangle, Check, CheckCircle2, Info, MessageCircleQuestion, Plus, UserRound } from "lucide-react";
import React, { type ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  galleryItems,
  safeUrl,
  type StudioBlock,
  type StudioInline,
  type StudioSectionVM,
  type StudioTableContent,
  type StudioText,
} from "../model/studio-content";

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
        <p data-block-id={block.id} className="m-0 text-pretty leading-8 text-fg">
          <InlineContent content={block.content} />
        </p>
      );

    case "bulletListItem":
      return (
        <li data-block-id={block.id} className="flex items-start gap-3 leading-8">
          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-pretty">
            <InlineContent content={block.content} />
          </span>
        </li>
      );

    case "numberedListItem":
      return (
        <li data-block-id={block.id} className="ps-1 leading-8 text-pretty">
          <InlineContent content={block.content} />
        </li>
      );

    case "checkListItem":
    case "goals":
      return (
        <li data-block-id={block.id} className="flex items-start gap-3 leading-8">
          <span
            className="mt-1 grid size-5 shrink-0 place-items-center rounded bg-accent/10 text-accent"
            aria-hidden="true"
          >
            <Check className="size-3.5" strokeWidth={2.5} />
          </span>
          <span className="text-pretty">
            <InlineContent content={block.content} />
          </span>
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
 * Renders the Studio sections created in the admin's Course Studio.
 */
export function ContentBlocks({ sections }: { sections: readonly StudioSectionVM[] }) {
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
          <div className="flex flex-col gap-4 text-base leading-8 text-fg max-w-[68ch]">
            {renderBlockGroup(section.blocks)}
          </div>
        </section>
      ))}
    </div>
  );
}
