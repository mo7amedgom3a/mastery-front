import Image from "next/image";

import { CardCarousel } from "@/components/motion/card-carousel";
import { brandBg } from "@/components/ui/brand-colors";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/cn";

import { experts } from "../content/experts";

/** MasterClass-style "meet the instructors": large portraits, name and credential. */
export function ExpertsSection({ instructorCount }: { instructorCount: number | null }) {
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
        {experts.map((expert) => (
          <figure key={expert.id} className="m-0 flex flex-col gap-4">
            {/* Three per view makes portraits wide; the height cap keeps the whole row on one screen. */}
            <div className={cn("relative aspect-[600/811] max-h-[min(60svh,34rem)] w-full overflow-hidden rounded-panel", brandBg[expert.color])}>
              <Image
                src={expert.image}
                alt={`صورة ${expert.name}`}
                fill
                sizes="(min-width: 1200px) 390px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
                className="object-cover object-top"
              />
            </div>
            <figcaption className="flex flex-col gap-1">
              <span className="text-xl font-bold">{expert.name}</span>
              <span className="text-fg-muted">{expert.field}</span>
            </figcaption>
          </figure>
        ))}
      </CardCarousel>
    </Section>
  );
}
