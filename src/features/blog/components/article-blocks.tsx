import { Fragment, type CSSProperties, type ReactNode } from "react";

import {
  headingAnchor,
  parseStats,
  parseStringList,
  parseTocItems,
  propNumber,
  propString,
} from "../model/blocks";
import type { BlogBlock, InlineContent, TableContent } from "../model/types";

/** Only colours we understand reach the style attribute; the API allows free-form strings. */
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9.,%\s/]+\)|[a-z]{3,20})$/i;
const EXTERNAL_URL = /^https?:\/\//i;

function inlineContent(items: InlineContent[] | null | undefined): ReactNode {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items.map((item, index) => {
    if (item.type === "link") {
      const href = item.href.trim();
      // The backend whitelists these schemes; the Studio preview can bypass that check, so re-check.
      if (!/^(?:https?:\/\/|\/(?!\/))/i.test(href)) {
        return <Fragment key={`link-${index}`}>{inlineContent(item.content)}</Fragment>;
      }
      const external = EXTERNAL_URL.test(href);
      return (
        <a
          key={`link-${index}`}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {inlineContent(item.content)}
        </a>
      );
    }

    const styles = item.styles ?? {};
    let node: ReactNode = item.text;
    if (styles.code) node = <code>{node}</code>;
    if (styles.strike) node = <s>{node}</s>;
    if (styles.underline) node = <u>{node}</u>;
    if (styles.italic) node = <em>{node}</em>;
    if (styles.bold) node = <strong>{node}</strong>;

    const style: CSSProperties = {};
    if (styles.textColor && SAFE_COLOR.test(styles.textColor)) style.color = styles.textColor;
    if (styles.backgroundColor && SAFE_COLOR.test(styles.backgroundColor)) {
      style.backgroundColor = styles.backgroundColor;
      style.padding = "0 3px";
      style.borderRadius = "3px";
    }

    return (
      <Fragment key={`text-${index}`}>
        {Object.keys(style).length > 0 ? <span style={style}>{node}</span> : node}
      </Fragment>
    );
  });
}

function cellContent(cell: TableContent["rows"][number]["cells"][number]): ReactNode {
  return inlineContent(Array.isArray(cell) ? cell : cell.content);
}

function blockKey(block: BlogBlock, path: number[]): string {
  return block.id ?? path.join("-");
}

function blockChildren(block: BlogBlock, path: number[]): ReactNode {
  return block.children && block.children.length > 0 ? <>{renderBlocks(block.children, path)}</> : null;
}

function renderBlock(block: BlogBlock, path: number[]): ReactNode {
  const key = blockKey(block, path);
  const props = block.props;
  const content = block.content as InlineContent[] | null;

  switch (block.type) {
    case "heading": {
      const level = propNumber(props, "level", 1);
      const Tag = level >= 3 ? "h3" : "h2";
      return (
        <Tag
          key={key}
          id={headingAnchor(block, path)}
          className={level <= 1 ? "prose-h1" : undefined}
        >
          {inlineContent(content)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <Fragment key={key}>
          <p>{inlineContent(content)}</p>
          {blockChildren(block, path)}
        </Fragment>
      );
    case "lead":
      return (
        <Fragment key={key}>
          <p className="prose-lead">{inlineContent(content)}</p>
          {blockChildren(block, path)}
        </Fragment>
      );
    case "quote":
      return (
        <Fragment key={key}>
          <blockquote>{inlineContent(content)}</blockquote>
          {blockChildren(block, path)}
        </Fragment>
      );
    case "image": {
      const url = propString(props, "url");
      if (!url) return null;
      const caption = propString(props, "caption");
      return (
        <figure key={key}>
          {/* eslint-disable-next-line @next/next/no-img-element -- blog asset URLs are presigned redirects */}
          <img
            src={url}
            alt={propString(props, "alt") || caption}
            loading="lazy"
            decoding="async"
          />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      );
    }
    case "video": {
      const url = propString(props, "url");
      if (!url) return null;
      const caption = propString(props, "caption");
      const poster = propString(props, "poster") || propString(props, "previewUrl");
      return (
        <figure key={key}>
          <video controls playsInline preload="metadata" src={url} poster={poster || undefined} />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      );
    }
    case "divider":
      return <hr key={key} />;
    case "table": {
      const table = block.content as TableContent | null;
      const rows = table?.rows ?? [];
      if (rows.length === 0) return null;
      const [head, ...body] = rows;
      return (
        <div key={key} className="table-wrap">
          <table>
            <thead>
              <tr>
                {head.cells.map((cell, index) => (
                  <th key={index} scope="col">
                    {cellContent(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.cells.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cellContent(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "banner": {
      const url = propString(props, "url");
      if (!url) return null;
      const headline = propString(props, "headline");
      const subheadline = propString(props, "subheadline");
      return (
        <figure key={key} className="banner">
          {/* eslint-disable-next-line @next/next/no-img-element -- blog asset URLs are presigned redirects */}
          <img
            src={url}
            alt={propString(props, "alt") || headline}
            loading="lazy"
            decoding="async"
          />
          {headline || subheadline ? (
            <figcaption className="banner-caption">
              {headline ? <h2>{headline}</h2> : null}
              {subheadline ? <p>{subheadline}</p> : null}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "callout": {
      const tone = propString(props, "tone") || "info";
      const toneClass = tone === "warning" ? " note-warn" : tone === "success" ? " note-success" : "";
      return (
        <aside key={key} className={`note${toneClass}`}>
          <span className="note-dot" aria-hidden="true" />
          <div>{inlineContent(content)}</div>
        </aside>
      );
    }
    case "faq": {
      const question = propString(props, "question");
      return (
        <details key={key} className="faq">
          <summary>
            <span>{question || "سؤال"}</span>
            <span className="fx" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="fa">{inlineContent(content)}</div>
        </details>
      );
    }
    case "tags": {
      const items = parseStringList(props?.items);
      if (items.length === 0) return null;
      const label = propString(props, "label");
      const accent = propString(props, "tone") === "yellow";
      return (
        <div key={key} className="my-6">
          {label ? <p className="tk-title mb-3">{label}</p> : null}
          <ul className="tags-row" aria-label={label || "وسوم"}>
            {items.map((item) => (
              <li key={item}>
                <span className={`pill${accent ? " pill-accent" : ""}`}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "takeaways": {
      const items = parseStringList(props?.items);
      if (items.length === 0) return null;
      return (
        <aside key={key} className="takeaways" aria-label="أهم النقاط">
          <p className="tk-title">أهم النقاط</p>
          <ul>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      );
    }
    case "toc": {
      const items = parseTocItems(props?.items);
      if (items.length === 0) return null;
      const title = propString(props, "title") || "المحتويات";
      return (
        <nav key={key} className="toc toc--block" aria-label={title}>
          <p className="tk-title">{title}</p>
          <ol>
            {items.map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <a
                  href={item.href}
                  {...(/^https?:\/\//i.test(item.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      );
    }
    case "stats": {
      const items = parseStats(props?.items);
      if (items.length === 0) return null;
      return (
        <div key={key} className="stats-row" role="list">
          {items.map((stat) => (
            <div key={`${stat.value}:${stat.label}`} className="stat" role="listitem">
              <div className="v" aria-hidden="true">
                {stat.value}
              </div>
              <div className="l">{stat.label}</div>
            </div>
          ))}
        </div>
      );
    }
    case "bulletListItem":
      return (
        <ul key={key}>
          <li>
            {inlineContent(content)}
            {blockChildren(block, path)}
          </li>
        </ul>
      );
    case "numberedListItem":
      return (
        <ol key={key}>
          <li>
            {inlineContent(content)}
            {blockChildren(block, path)}
          </li>
        </ol>
      );
    default:
      return null;
  }
}

/** Consecutive list items are one list, the way BlockNote authors them. */
function renderBlocks(blocks: BlogBlock[], parentPath: number[] = []): ReactNode[] {
  const rendered: ReactNode[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];
    if (block.type === "bulletListItem" || block.type === "numberedListItem") {
      const type = block.type;
      const start = index;
      const items: { block: BlogBlock; path: number[] }[] = [];
      while (index < blocks.length && blocks[index].type === type) {
        items.push({ block: blocks[index], path: [...parentPath, index] });
        index += 1;
      }
      const Tag = type === "bulletListItem" ? "ul" : "ol";
      rendered.push(
        <Tag key={`list-${[...parentPath, start].join("-")}`}>
          {items.map(({ block: item, path }) => (
            <li key={blockKey(item, path)}>
              {inlineContent(item.content as InlineContent[] | null)}
              {blockChildren(item, path)}
            </li>
          ))}
        </Tag>,
      );
      continue;
    }

    rendered.push(renderBlock(block, [...parentPath, index]));
    index += 1;
  }

  return rendered;
}

/** The article body: exactly the block vocabulary the admin whitelists, nothing raw. */
export function ArticleBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return <div className="prose">{renderBlocks(blocks)}</div>;
}
