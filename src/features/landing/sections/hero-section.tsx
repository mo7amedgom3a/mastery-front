import type { CSSProperties } from "react";

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
 *
 * The portraits are a decorative backdrop, not content. They use pre-sized local WebP files (under
 * 100 KB for the whole line-up) painted by a pseudo-element, and on phones they are capped shorter
 * than the headline block: the lead paragraph is the page's LCP, not a portrait behind it. The old
 * implementation downloaded 54 eager 500–800 KB PNGs from the legacy host, which is what made
 * mobile LCP 5.5 s.
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-surface-alt">
      <div className="absolute inset-0 -z-10 opacity-30 md:inset-y-0 md:start-auto md:end-0 md:w-[48%] md:opacity-100">
        <VerticalMarqueeGrid
          columns={columns}
          getKey={(expert) => expert.id}
          duration={70}
          className="px-8 md:px-0"
          renderItem={(expert) => (
            <div
              className={cn(
                "vmarquee__portrait relative aspect-[600/811] max-h-[11rem] overflow-hidden rounded-panel md:max-h-none",
                brandBg[expert.color],
              )}
              style={{ "--portrait": `url("${expert.imageSmall}")` } as CSSProperties}
            />
          )}
        />
      </div>

      {/* Fills the screen under the header and never more: type, gaps and padding scale with the
          viewport height, so the tag, headline, lead and both CTAs are visible together. */}
      <div className="ma-container flex min-h-[min(calc(100svh-var(--header-h)),64rem)] items-center py-[clamp(2rem,6svh,6rem)]">
        {/* Text column stops well short of the marquee (48% from the inline end) for breathing room. */}
        <div className="flex max-w-[34rem] flex-col items-start md:w-[44%]">
          <span className="ma-tag ma-tag--soft">{heroCopy.kicker}</span>
          <h1 id="hero-title" className="t-hero m-0 mt-6 short:mt-4">
            {heroCopy.title}
          </h1>
          <p className="t-lead m-0 mt-8 max-w-[32rem] text-fg short:mt-5">{heroCopy.lead}</p>
          <div className="ma-cluster mt-10 w-full short:mt-6 max-sm:flex-col max-sm:items-stretch">
            <ButtonLink href={heroCopy.primary.href} variant="primary" size="lg">
              {heroCopy.primary.label}
            </ButtonLink>
            <ButtonLink href={heroCopy.secondary.href} variant="soft" size="lg">
              {heroCopy.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
