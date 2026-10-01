import { ButtonLink } from "@/components/ui/button";
import { b2bCopy } from "@/features/business/content/b2b";

/** Companies banner: the pitch in brief, leading to `/business` where the request form lives. */
export function BusinessSection() {
  const { banner } = b2bCopy;
  return (
    <section id="business" aria-labelledby="business-title" className="cv-auto bg-yellow text-ink">
      <div className="ma-container grid gap-10 py-16 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-end md:gap-16 md:py-24">
        <div className="flex flex-col items-start gap-5">
          <span className="text-sm font-bold">{b2bCopy.label}</span>
          <h2 id="business-title" className="t-section m-0">
            {banner.title}
          </h2>
          <p className="m-0 max-w-[40rem] text-lg">{banner.lead}</p>
          <ButtonLink href={banner.action.href} variant="on-color" size="lg" className="mt-2">
            {banner.action.label}
          </ButtonLink>
        </div>
        <ul className="m-0 flex list-none flex-col p-0">
          {b2bCopy.benefits.map((benefit) => (
            <li key={benefit.title} className="flex flex-col gap-1 border-t border-ink py-4">
              <span className="font-bold">{benefit.title}</span>
              <span>{benefit.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
