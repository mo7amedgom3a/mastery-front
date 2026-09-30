import type { ReactNode } from "react";

import type { SocialKind, SocialLinkVM } from "../model/types";

// Lucide ships no brand marks; these are the three outline glyphs the profile needs.
const social: Record<SocialKind, { label: string; icon: ReactNode }> = {
  facebook: {
    label: "فيسبوك",
    icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  },
  instagram: {
    label: "إنستغرام",
    icon: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
  },
  youtube: {
    label: "يوتيوب",
    icon: (
      <>
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </>
    ),
  },
};

/** The expert's social profiles as icon links. Renders nothing when they have none. */
export function SocialLinks({ links, name }: { links: readonly SocialLinkVM[]; name: string }) {
  if (links.length === 0) {
    return null;
  }
  return (
    <ul aria-label={`حسابات ${name}`} className="m-0 flex list-none gap-2 p-0">
      {links.map(({ kind, href }) => (
        <li key={kind}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} على ${social[kind].label}`}
            className="ma-btn ma-btn--outline ma-btn--icon ma-btn--sm size-10 min-h-10"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              {social[kind].icon}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
