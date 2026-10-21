import type { Route } from "next";
import Image from "next/image";

import { CardCarousel } from "@/components/motion/card-carousel";
import { AppLink } from "@/components/ui/app-link";
import { brandBg, brandColorAt, type BrandColor } from "@/components/ui/brand-colors";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { routes } from "@/config/routes";
import { nameKey, type ExpertCardVM } from "@/features/experts-directory/model";
import { cn } from "@/lib/cn";

import { experts as curated } from "../content/experts";

type LineupExpert = { id: string; name: string; field: string; image: string | null; color: BrandColor; href: Route | null };

/**
 * The line-up: the experts featured in the admin (in its order), else the curated portraits, each linked to
 * its profile when the directory has the same name.
 */
function lineup(directory: readonly ExpertCardVM[]): LineupExpert[] {
  const featured = directory.filter((expert) => expert.featured && expert.avatar);
  if (featured.length > 0) {
    return featured.map((expert) => ({
      id: expert.key,
      name: expert.name,
      field: expert.title ?? expert.fields[0] ?? "",
      image: expert.avatar,
      color: brandColorAt(expert.colorIndex),
      href: expert.href,
    }));
  }
  const byName = new Map(directory.map((expert) => [nameKey(expert.name), expert]));
  return curated.map((expert) => ({ ...expert, href: byName.get(nameKey(expert.name))?.href ?? null }));
}

/** MasterClass-style "meet the instructors": large portraits, name and credential. */
export function ExpertsSection({
  instructorCount,
  directory = [],
}: {
  instructorCount: number | null;
  directory?: readonly ExpertCardVM[];
}) {
  const experts = lineup(directory);
  return (
    <Section id="experts" aria-labelledby="experts-title" tone="alt" deferRender>
      <SectionHeader
        id="experts-title"
        label="الخبراء"
        title="تعلّم من خبراء يمارسون ما يدرّسونه"
        lead={
          instructorCount
            ? `نخبة من أكثر من ${instructorCount} خبير ومدرّب عربي في التسويق والإدارة والمالية والإبداع.`
            : "نخبة من الخبراء والمدرّبين العرب في التسويق والإدارة والمالية والإبداع."
        }
      />
      <CardCarousel label="خبراء أكاديمية ماستري" className="reveal mt-12 short:mt-6">
        {experts.map((expert) => {
          const portrait = (
            // Three per view makes portraits wide; the height cap keeps the whole row on one screen.
            <div className={cn("relative aspect-[600/811] max-h-[min(60svh,34rem)] w-full overflow-hidden rounded-panel", brandBg[expert.color])}>
              {expert.image ? (
                <Image
                  src={expert.image}
                  alt={`صورة ${expert.name}`}
                  fill
                  sizes="(min-width: 1200px) 390px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              ) : null}
            </div>
          );
          return (
            <figure key={expert.id} className="group m-0 flex flex-col gap-4">
              {expert.href ? (
                <AppLink href={expert.href} tabIndex={-1} aria-hidden="true">
                  {portrait}
                </AppLink>
              ) : (
                portrait
              )}
              <figcaption className="flex flex-col gap-1">
                {expert.href ? (
                  <AppLink href={expert.href} className="text-xl font-bold text-fg no-underline underline-offset-4 hover:underline">
                    {expert.name}
                  </AppLink>
                ) : (
                  <span className="text-xl font-bold">{expert.name}</span>
                )}
                <span className="text-fg-muted">{expert.field}</span>
              </figcaption>
            </figure>
          );
        })}
      </CardCarousel>
      <div className="mt-8 flex justify-center">
        <AppLink href={routes.experts} className="ma-btn ma-btn--secondary no-underline">
          كل المدربين والخبراء
        </AppLink>
      </div>
    </Section>
  );
}
