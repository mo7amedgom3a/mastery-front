import Image from "next/image";

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
      <ul className="rail rail--4 reveal m-0 mt-12 list-none p-0" aria-label="خبراء أكاديمية ماستري">
        {experts.map((expert) => (
          <li key={expert.id}>
            <figure className="m-0 flex flex-col gap-4">
              <div className={cn("relative aspect-[600/811] overflow-hidden rounded-photo", brandBg[expert.color])}>
                <Image
                  src={expert.image}
                  alt={`صورة ${expert.name}`}
                  fill
                  sizes="(min-width: 1200px) 290px, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 82vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="flex flex-col gap-1">
                <span className="text-xl font-bold">{expert.name}</span>
                <span className="text-fg-muted">{expert.field}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
