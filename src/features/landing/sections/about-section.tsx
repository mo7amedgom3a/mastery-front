import Image from "next/image";

import { LazyVideo } from "@/components/motion/lazy-video";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { siteConfig } from "@/config/site";

import { aboutCopy } from "../content/copy";

export function AboutSection() {
  return (
    <Section id="about" aria-labelledby="about-title" deferRender>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeader id="about-title" label={aboutCopy.label} title={aboutCopy.title} />
          <div className="mt-6 flex flex-col gap-4">
            {aboutCopy.paragraphs.map((paragraph) => (
              <p key={paragraph} className="t-lead m-0">
                {paragraph}
              </p>
            ))}
          </div>
          <dl className="mt-8 grid grid-cols-2 border-t border-line">
            <div className="border-e border-line py-4 pe-4">
              <dt className="text-sm text-fg-muted">سنة التأسيس</dt>
              <dd className="m-0 text-3xl font-bold tabular-nums">{siteConfig.foundingYear}</dd>
            </div>
            <div className="py-4 ps-4">
              <dt className="text-sm text-fg-muted">المؤسسون</dt>
              <dd className="m-0 text-lg font-bold">{siteConfig.founders.join(" و")}</dd>
            </div>
          </dl>
        </div>
        <LazyVideo
          src={siteConfig.introVideoUrl}
          label={aboutCopy.videoLabel}
          className="reveal aspect-video w-full overflow-hidden rounded-panel"
          poster={
            <Image
              src={aboutCopy.teamImage.src}
              alt={aboutCopy.teamImage.alt}
              fill
              sizes="(min-width: 1200px) 580px, (min-width: 900px) 50vw, 100vw"
              className="object-cover"
            />
          }
        />
      </div>
    </Section>
  );
}
