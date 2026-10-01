import Image from "next/image";

import { Marquee } from "@/components/motion/marquee";
import { brandBg } from "@/components/ui/brand-colors";
import { ButtonLink } from "@/components/ui/button";
import { TrustedCompanies } from "@/features/business/components/trusted-companies";
import { b2bCopy } from "@/features/business/content/b2b";
import { cn } from "@/lib/cn";

import { experts, type Expert } from "../content/experts";

/** Rows of the backdrop, each starting at a different expert and alternating direction. */
const ROWS = [0, 3, 6].map((offset) => [...experts.slice(offset), ...experts.slice(0, offset)]);

function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <div className="flex w-40 flex-col border border-line bg-surface md:w-48">
      <div className={cn("relative aspect-[600/811] overflow-hidden", brandBg[expert.color])}>
        {/* Decorative and dimmed: low quality is invisible, lazy is fine below the fold. */}
        <Image src={expert.image} alt="" fill sizes="192px" quality={60} className="object-cover" />
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="truncate text-sm font-bold">{expert.name}</span>
        <span className="truncate text-xs text-fg-muted">{expert.field}</span>
      </div>
    </div>
  );
}

/**
 * Companies banner: the pitch in brief over a slow, tilted wall of expert cards, then the companies
 * that trained with us. The request form itself lives on `/business`.
 */
export function BusinessSection() {
  const { banner } = b2bCopy;
  return (
    <section id="business" aria-labelledby="business-title" data-theme="dark" className="cv-auto bg-surface-alt text-fg">
      <div className="relative isolate overflow-hidden">
        {/* Backdrop: decorative only, kept out of the accessibility tree and tab order. */}
        <div aria-hidden="true" inert className="absolute inset-0 -z-10 flex -rotate-6 scale-125 flex-col justify-center gap-6 opacity-50">
          {ROWS.map((row, index) => (
            <Marquee
              key={index}
              items={row}
              getKey={(expert) => expert.id}
              renderItem={(expert) => <ExpertCard expert={expert} />}
              label="خبراء ماستري"
              duration={90 + index * 15}
              reverse={index % 2 === 1}
              repeat={3}
              pauseOnHover={false}
            />
          ))}
        </div>
        {/* Flat scrim (no gradients in the kit): darker on the text side so the copy stays readable. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-surface-alt/70 md:bg-transparent">
          <div className="hidden h-full w-[62%] bg-surface-alt/85 md:block" />
        </div>

        <div className="ma-container grid gap-10 py-20 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:py-28">
          <div className="flex max-w-[36rem] flex-col items-start gap-6">
            <span className="ma-tag ma-tag--coral">{b2bCopy.label}</span>
            <h2 id="business-title" className="t-section m-0">
              {banner.title}
            </h2>
            <p className="t-lead m-0">{banner.lead}</p>
            <ul className="m-0 flex w-full list-none flex-col p-0">
              {b2bCopy.benefits.map((benefit) => (
                <li key={benefit.title} className="flex flex-col gap-1 border-t border-line py-4">
                  <span className="font-bold">{benefit.title}</span>
                  <span className="text-fg-muted">{benefit.body}</span>
                </li>
              ))}
            </ul>
            <ButtonLink href={banner.action.href} variant="primary" size="lg">
              {banner.action.label}
            </ButtonLink>
          </div>
        </div>
      </div>
      <TrustedCompanies />
    </section>
  );
}
