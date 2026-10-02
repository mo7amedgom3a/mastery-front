import { SocialIcon, socialLabel } from "@/components/icons/social-icons";

import type { SocialLinkVM } from "../model/types";

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
            aria-label={`${name} على ${socialLabel[kind]}`}
            className="ma-btn ma-btn--bare ma-btn--icon ma-btn--sm size-10 min-h-10"
          >
            <SocialIcon network={kind} className="size-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
