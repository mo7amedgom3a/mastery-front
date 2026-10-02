import { Marquee } from "@/components/motion/marquee";
import { brandBg } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";

import { testimonials, type Testimonial } from "../content/testimonials";

/** First letter of the name, skipping honorifics like "د." */
function initialOf(name: string): string {
  return name.replace(/^د\.\s*/, "").trim().charAt(0);
}

function ReviewCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="m-0 flex h-full w-72 flex-col gap-3 rounded-panel border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:w-80">
      <figcaption className="flex items-center gap-3">
        <span aria-hidden="true" className={cn("ma-avatar size-9 text-sm", brandBg[testimonial.color])}>
          {initialOf(testimonial.name)}
        </span>
        <span className="text-sm font-bold">{testimonial.name}</span>
      </figcaption>
      <blockquote className="m-0 text-sm leading-7 text-fg-muted">«{testimonial.quote}»</blockquote>
    </figure>
  );
}

// Wide edge fade (like the reference) via the marquee's own mask — no overlay gradients.
const EDGE_FADE =
  "[mask-image:linear-gradient(to_right,transparent,#000_18%,#000_82%,transparent)] max-sm:[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]";

/** Learner reviews: two tight rows scrolling in opposite directions; each row pauses on hover. */
export function TestimonialsSection() {
  if (testimonials.length === 0) {
    return null;
  }
  const middle = Math.ceil(testimonials.length / 2);
  const rows = [testimonials.slice(0, middle), testimonials.slice(middle)].filter((row) => row.length > 0);

  return (
    <section aria-labelledby="testimonials-title" className="ma-section ma-band cv-auto overflow-hidden">
      <div className="ma-container">
        <header className="ma-sechead">
          <div className="ma-sechead__run pt-3">
            <span>آراء المتعلّمين</span>
          </div>
          <h2 id="testimonials-title" className="ma-sechead__title t-section mt-10 md:mt-12 short:mt-6">
            ماذا يقول متعلّمو ماستري
          </h2>
        </header>
      </div>
      <div className="mt-12 flex flex-col gap-4 short:mt-6">
        {rows.map((row, index) => (
          <Marquee
            key={index}
            items={row}
            getKey={(item) => item.id}
            label={index === 0 ? "آراء المتعلّمين" : "المزيد من آراء المتعلّمين"}
            duration={55}
            reverse={index % 2 === 1}
            repeat={3}
            className={cn("marquee--tight marquee--stretch", EDGE_FADE)}
            renderItem={(item) => <ReviewCard testimonial={item} />}
          />
        ))}
      </div>
    </section>
  );
}
