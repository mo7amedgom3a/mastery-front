import { Marquee } from "@/components/motion/marquee";

import type { CompanyVM } from "../model/b2b-view";

import { SafeImage } from "./safe-image";

/**
 * Trusted-company logo wall. Pure CSS marquee (existing `Marquee`): the first track is the readable
 * list, the copies are `inert` and hidden from assistive tech.
 */
export function LogoMarquee({ companies, label = "شركات تثق بنا" }: { companies: CompanyVM[]; label?: string }) {
  if (companies.length === 0) {
    return null;
  }
  return (
    <Marquee
      items={companies}
      getKey={(company) => company.id}
      label={label}
      duration={70}
      repeat={2}
      pauseOnHover
      className="b2b-logos"
      renderItem={(company) => (
        <span className="b2b-logo" title={company.name}>
          <SafeImage
            src={company.logo}
            alt={company.name}
            fill
            sizes="160px"
            className="b2b-logo__img"
            unoptimized
            fallback={
              <span aria-hidden="true" className="b2b-logo__fallback">
                {company.name.trim().charAt(0)}
              </span>
            }
          />
        </span>
      )}
    />
  );
}
