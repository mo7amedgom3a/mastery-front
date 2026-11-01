import type { TocEntry } from "../model/types";

/** المحتويات — the article's level-1/2 headings. Hidden when there is nothing to navigate. */
export function Toc({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 2) return null;
  return (
    <nav className="toc" aria-label="محتويات المقال">
      <p className="tk-title">المحتويات</p>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a href={`#${entry.id}`}>{entry.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
