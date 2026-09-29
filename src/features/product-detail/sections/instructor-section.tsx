import { ArrowLeft } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";

import { TextBlocks } from "../components/text-blocks";
import { TrainerAvatar } from "../components/trainer-avatar";
import type { TrainerVM } from "../model/types";

/** عن المدرب: photo, name and plain-text bio per trainer, each linking to the trainer's profile. */
export function InstructorSection({ trainers }: { trainers: readonly TrainerVM[] }) {
  if (trainers.length === 0) {
    return null;
  }
  return (
    <section
      id="instructor"
      aria-labelledby="instructor-title"
      className="scroll-mt-[calc(var(--header-h)+4.5rem)]"
    >
      <h2 id="instructor-title" className="m-0 text-2xl font-bold">
        {trainers.length > 1 ? "عن المدربين" : "عن المدرب"}
      </h2>
      <div className="mt-6 flex flex-col gap-10">
        {trainers.map((trainer, index) => (
          <article key={trainer.id} className="flex flex-col gap-5 border border-line p-6 md:flex-row md:gap-8">
            <AppLink href={trainer.href} className="shrink-0 self-start" tabIndex={-1} aria-hidden="true">
              <TrainerAvatar trainer={trainer} size={112} index={index} />
            </AppLink>
            <div className="flex min-w-0 flex-col gap-4">
              <h3 className="m-0 text-xl font-bold">
                <AppLink href={trainer.href} className="text-fg no-underline underline-offset-4 hover:underline">
                  {trainer.name}
                </AppLink>
              </h3>
              {trainer.bio.length > 0 ? <TextBlocks blocks={trainer.bio} className="text-fg-muted" /> : null}
              <AppLink
                href={trainer.href}
                className="inline-flex items-center gap-1 self-start text-sm font-medium text-fg no-underline hover:text-accent"
              >
                الملف الشخصي للمدرب
                <ArrowLeft aria-hidden="true" className="size-4" />
              </AppLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
