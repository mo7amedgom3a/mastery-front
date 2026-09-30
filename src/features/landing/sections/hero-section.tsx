import Image from "next/image";

import { VerticalMarqueeGrid } from "@/components/motion/vertical-marquee-grid";
import { brandBg } from "@/components/ui/brand-colors";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { heroCopy } from "../content/copy";
import { experts, type Expert } from "../content/experts";

const COLUMN_COUNT = 3;

/** Each column shows the full line-up, rotated so neighbouring columns never align. */
function buildColumns(items: readonly Expert[], count: number): Expert[][] {
  const step = Math.max(1, Math.floor(items.length / count));
  return Array.from({ length: count }, (_, column) => {
    const offset = (column * step) % items.length;
    return [...items.slice(offset), ...items.slice(0, offset)];
  });
}

const columns = buildColumns(experts, COLUMN_COUNT);

/**
 * Cinematic hero: headline + CTA pair over an infinite vertical grid of expert portraits.
 * No client JS here — the H1 is the LCP element and paints with the HTML.
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-surface-alt">
      <div className="absolute inset-0 -z-10 opacity-30 md:inset-y-0 md:start-auto md:end-0 md:w-[48%] md:opacity-100">
        <VerticalMarqueeGrid
          columns={columns}
          getKey={(expert) => expert.id}
          duration={70}
          className="px-4 md:px-0"
          renderItem={(expert) => (
            <div className={cn("relative aspect-[600/811] overflow-hidden rounded-photo", brandBg[expert.color])}>
              {/* Decorative backdrop: sized to the column (2 on phones, 3 in 48% on desktop), low quality is invisible at this opacity. */}
              {/* Loaded up front at low priority, not lazily: a portrait that first downloads and
                  decodes as it slides into view pops in and makes the moving column hitch. */}
              <Image
                src={expert.image}
                alt=""
                width={256}
                height={346}
                sizes="(min-width: 900px) 16vw, 45vw"
                quality={60}
                loading="eager"
                fetchPriority="low"
                className="size-full object-cover"
              />
            </div>
          )}
        />
      </div>

      <div className="ma-container flex min-h-[min(calc(100svh-var(--header-h)),58rem)] items-center py-20 md:py-24">
        {/* Text column stops well short of the marquee (48% from the inline end) for breathing room. */}
        <div className="flex max-w-[34rem] flex-col items-start md:w-[44%]">
          <span className="ma-tag ma-tag--outline">{heroCopy.kicker}</span>
          <h1 id="hero-title" className="t-hero m-0 mt-6">
            {heroCopy.title}
          </h1>
          <p className="t-lead m-0 mt-8 max-w-[32rem] text-fg">{heroCopy.lead}</p>
          <div className="ma-cluster mt-10">
            <ButtonLink href={heroCopy.primary.href} variant="primary" size="lg">
              {heroCopy.primary.label}
            </ButtonLink>
            <ButtonLink href={heroCopy.secondary.href} variant="outline" size="lg">
              {heroCopy.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
