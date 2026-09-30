import { BookOpen, ChevronLeft, GraduationCap, Layers, MessagesSquare, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { brandBg } from "@/components/ui/brand-colors";
import { routes } from "@/config/routes";
import { TrainerAvatar } from "@/features/product-detail/components/trainer-avatar";
import { cn } from "@/lib/cn";

import { SocialLinks } from "../components/social-links";
import { expertFacts, expertRoles, type ExpertFactKey } from "../model/facts";
import type { ExpertVM } from "../model/types";

const AVATAR_SIZE = 128;
const factIcon: Record<ExpertFactKey, LucideIcon> = {
  courses: BookOpen,
  diplomas: GraduationCap,
  consultations: MessagesSquare,
  packages: Layers,
};

/**
 * Profile hero: a cover (the expert's image when the catalog has one, otherwise a solid brand-colour
 * field), the avatar overlapping its bottom edge, then name, role and specialty, what they offer as
 * tiles, social links and share. Server-rendered; the H1 is the LCP element.
 */
export function ExpertHero({ expert, share }: { expert: ExpertVM; share?: ReactNode }) {
  const facts = expertFacts(expert.counts);
  const roles = expertRoles(expert.counts);

  return (
    <section aria-labelledby="expert-name" className="bg-surface-alt text-fg">
      <div className="ma-container pt-8 pb-12 md:pt-12 md:pb-16">
        <nav aria-label="مسار التصفح">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm text-fg-muted">
            <li>
              <AppLink href={routes.home} className="text-fg-muted no-underline hover:text-fg">
                الرئيسية
              </AppLink>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="size-4" />
            </li>
            <li>
              <AppLink href={routes.section("experts")} className="text-fg-muted no-underline hover:text-fg">
                الخبراء
              </AppLink>
            </li>
            <li aria-hidden="true">
              <ChevronLeft className="size-4" />
            </li>
            <li aria-current="page" className="line-clamp-1 max-w-[40ch] text-fg">
              {expert.name}
            </li>
          </ol>
        </nav>

        <div className={cn("relative mt-8 h-36 overflow-hidden sm:h-48 md:mt-10 md:h-60", brandBg[expert.color])}>
          {expert.cover ? (
            <Image
              src={expert.cover}
              alt=""
              fill
              priority
              sizes="(min-width: 1440px) 1200px, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="relative z-10 px-4 sm:px-8" style={{ marginTop: -AVATAR_SIZE / 2 }}>
          <TrainerAvatar trainer={expert} size={AVATAR_SIZE} index={1} className="ring-4 ring-surface-alt" />
        </div>

        <div className="mt-6 flex flex-col items-start sm:px-8">
          {roles.length > 0 || expert.specialties.length > 0 ? (
            <ul aria-label="الصفة ومجالات الخبرة" className="ma-cluster m-0 list-none gap-2 p-0">
              {roles.map((role) => (
                <li key={role} className="ma-tag ma-tag--coral">
                  {role}
                </li>
              ))}
              {expert.specialties.map((specialty) => (
                <li key={specialty} className="ma-tag ma-tag--outline">
                  {specialty}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Share and social links sit beside the name (below it on phones). */}
          <div className="mt-5 flex w-full flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-8">
            <h1
              id="expert-name"
              className="m-0 text-[clamp(2rem,1.3rem+2.8vw,3.5rem)] leading-[1.35] font-bold text-balance"
            >
              {expert.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:mt-3">
              <SocialLinks links={expert.socials} name={expert.name} />
              {share}
            </div>
          </div>

          {facts.length > 0 ? (
            <ul aria-label="ما يقدّمه الخبير" className="m-0 mt-8 flex list-none flex-wrap gap-3 p-0">
              {facts.map(({ key, label }) => {
                const Icon = factIcon[key];
                return (
                  <li key={key}>
                    {/* Each tile jumps to that kind's section further down the page. */}
                    <a
                      href={`#${key}`}
                      className="flex items-center gap-3 border border-line bg-surface px-4 py-3 text-fg no-underline transition-colors hover:border-line-strong"
                    >
                      <Icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
                      <span className="text-lg font-bold md:text-xl">{label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
