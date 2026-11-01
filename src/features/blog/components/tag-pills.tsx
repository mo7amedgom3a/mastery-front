import type { Route } from "next";
import Link from "next/link";

export type TagPill = { label: string; href?: Route };

/** A row of pills: categories link to their filtered index, free tags are plain labels. */
export function TagPills({
  items,
  label,
  className = "",
  reveal = false,
}: {
  items: TagPill[];
  label: string;
  className?: string;
  reveal?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      className={`tags-row ${className}`.trim()}
      aria-label={label}
      {...(reveal ? { "data-reveal": true } : {})}
    >
      {items.map((item) => (
        <li key={`${item.label}:${item.href ?? ""}`}>
          {item.href ? (
            <Link className="pill" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="pill">{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
