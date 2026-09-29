import { Marquee } from "@/components/motion/marquee";

import { experts } from "../content/experts";

/** Logo-style ticker of expert names between two rules. */
export function ExpertsTicker() {
  return (
    <div className="border-y border-line bg-surface py-6 md:py-8">
      <Marquee
        items={experts}
        getKey={(expert) => expert.id}
        label="خبراء أكاديمية ماستري"
        duration={45}
        pauseOnHover={false}
        itemClassName="flex items-center gap-6"
        renderItem={(expert) => (
          <>
            <span className="flex items-baseline gap-3 whitespace-nowrap">
              <span className="text-2xl font-bold md:text-3xl">{expert.name}</span>
              <span className="text-sm text-fg-muted md:text-base">{expert.field}</span>
            </span>
            <span aria-hidden="true" className="size-2.5 bg-accent" />
          </>
        )}
      />
    </div>
  );
}
