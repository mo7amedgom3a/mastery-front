import { ArrowLeft } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { TextBlocks } from "@/features/product-detail/components/text-blocks";
import { TrainerAvatar } from "@/features/product-detail/components/trainer-avatar";

import type { ExpertVM } from "../model/types";

/**
 * عن الخبير: photo, name and plain-text bio. Links to the expert's profile only when they have one
 * (consultants without an instructor profile are shown by name alone).
 */
export function ExpertSection({ expert }: { expert: ExpertVM | null }) {
  if (!expert) {
    return null;
  }
  const avatar = <TrainerAvatar trainer={expert} size={112} />;
  return (
    <section id="instructor" aria-labelledby="instructor-title" className="scroll-mt-[calc(var(--header-h)+4.5rem)]">
      <h2 id="instructor-title" className="m-0 text-2xl font-bold">
        عن الخبير
      </h2>
      <article className="mt-6 flex flex-col gap-5 border border-line p-6 md:flex-row md:gap-8">
        {expert.href ? (
          <AppLink href={expert.href} className="shrink-0 self-start" tabIndex={-1} aria-hidden="true">
            {avatar}
          </AppLink>
        ) : (
          <span className="shrink-0 self-start">{avatar}</span>
        )}
        <div className="flex min-w-0 flex-col gap-4">
          <h3 className="m-0 text-xl font-bold">
            {expert.href ? (
              <AppLink href={expert.href} className="text-fg no-underline underline-offset-4 hover:underline">
                {expert.name}
              </AppLink>
            ) : (
              expert.name
            )}
          </h3>
          {expert.bio.length > 0 ? (
            <TextBlocks blocks={expert.bio} className="text-fg-muted" />
          ) : (
            <p className="m-0 max-w-[68ch] leading-8 text-fg-muted">
              يقدّم {expert.name} هذه الاستشارة في جلسات فردية مباشرة عبر ماستري أكاديمي.
            </p>
          )}
          {expert.href ? (
            <AppLink
              href={expert.href}
              className="inline-flex items-center gap-1 self-start text-sm font-medium text-fg no-underline hover:text-accent"
            >
              الملف الشخصي للخبير
              <ArrowLeft aria-hidden="true" className="size-4" />
            </AppLink>
          ) : null}
        </div>
      </article>
    </section>
  );
}
