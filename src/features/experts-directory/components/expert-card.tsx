import { AppLink } from "@/components/ui/app-link";
import { TrainerAvatar } from "@/features/product-detail/components/trainer-avatar";
import { cn } from "@/lib/cn";

import type { ExpertCardVM } from "../model";

/**
 * An expert as a card: photo, name, title line, role tags, fields and what they offer. The name link
 * stretches over the whole card (one tab stop, one accessible name).
 */
export function ExpertCard({ expert, className }: { expert: ExpertCardVM; className?: string }) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-panel border border-line bg-surface p-5 transition-colors hover:border-line-strong",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <TrainerAvatar trainer={expert} size={72} index={expert.colorIndex} />
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="m-0 text-lg leading-snug font-bold">
            <AppLink href={expert.href} className="text-fg no-underline after:absolute after:inset-0 after:content-['']">
              {expert.name}
            </AppLink>
          </h3>
          {expert.title ? <p className="m-0 line-clamp-2 text-sm text-fg-muted">{expert.title}</p> : null}
        </div>
      </div>

      {expert.roles.length > 0 ? (
        <ul aria-label="الصفة" className="ma-cluster m-0 list-none gap-2 p-0">
          {expert.roles.map((role) => (
            <li key={role} className={role === "مدرّب" ? "ma-tag ma-tag--coral" : "ma-tag ma-tag--lilac"}>
              {role}
            </li>
          ))}
        </ul>
      ) : null}

      {expert.fields.length > 0 ? (
        <p className="m-0 line-clamp-2 text-sm leading-6">
          <span className="text-fg-muted">المجالات: </span>
          {expert.fields.join("، ")}
        </p>
      ) : null}

      {expert.offers.length > 0 ? (
        <p className="m-0 mt-auto border-t border-line pt-3 text-sm text-fg-muted">{expert.offers.join(" · ")}</p>
      ) : null}
    </article>
  );
}

/** A grid of expert cards. */
export function ExpertGrid({ experts, label }: { experts: readonly ExpertCardVM[]; label: string }) {
  return (
    <ul aria-label={label} className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {experts.map((expert) => (
        <li key={expert.key} className="min-w-0">
          <ExpertCard expert={expert} />
        </li>
      ))}
    </ul>
  );
}
