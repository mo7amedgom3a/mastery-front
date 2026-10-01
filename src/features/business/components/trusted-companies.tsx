import Image from "next/image";

import { cn } from "@/lib/cn";

import { partners } from "../content/partners";

const TITLE = "شركات وثقت بنا في تدريب فرقها";

/**
 * "Trusted by" row in the StatsSection style: logo and name per company, separated by hairline
 * rules. Logos sit on white tiles because they are drawn for light backgrounds.
 */
export function TrustedCompanies({ className }: { className?: string }) {
  return (
    <div className={cn("border-y border-line bg-surface-alt", className)}>
      <div className="ma-container py-6 md:py-7">
        <p className="m-0 mb-5 text-sm font-bold text-fg-muted">{TITLE}</p>
        <ul aria-label={TITLE} className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-5 p-0 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-0">
          {partners.map((partner) => (
            <li
              key={partner.id}
              className="flex flex-col items-start gap-2 lg:border-s lg:border-line lg:px-6 lg:first:border-s-0 lg:first:ps-0 lg:last:pe-0"
            >
              <span className="flex h-16 w-32 items-center justify-center bg-white p-2">
                {/* Small local logos, some SVG: served as-is rather than through the optimizer. */}
                <Image
                  src={partner.logo}
                  alt=""
                  width={partner.width}
                  height={partner.height}
                  unoptimized
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </span>
              <span className="text-xs text-fg-muted">{partner.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
