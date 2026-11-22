import { Marquee } from "@/components/motion/marquee";
import { brandBg } from "@/components/ui/brand-colors";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/cn";

import { TestimonialReelCard } from "../components/testimonial-reel-card";
import { testimonialVideos, type TestimonialVideo } from "../content/testimonial-videos";
import { testimonials, type Testimonial } from "../content/testimonials";

/** First letter of the name, skipping honorifics like "د." */
function initialOf(name: string): string {
  return name.replace(/^د\.\s*/, "").trim().charAt(0);
}

function ReviewCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="m-0 flex flex-1 flex-col gap-3 rounded-panel border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <figcaption className="flex items-center gap-3">
        <span aria-hidden="true" className={cn("ma-avatar size-9 text-sm", brandBg[testimonial.color])}>
          {initialOf(testimonial.name)}
        </span>
        <span className="text-sm font-bold">{testimonial.name}</span>
      </figcaption>
      <blockquote className="m-0 text-sm leading-6 text-fg-muted sm:text-[0.9375rem]">«{testimonial.quote}»</blockquote>
    </figure>
  );
}

type Slot =
  | { kind: "video"; key: string; video: TestimonialVideo }
  | { kind: "quotes"; key: string; quotes: readonly Testimonial[] };

/**
 * One row that alternates a reel with a stack of two written reviews. Reviews are paired long
 * with short so every stack stays close to a reel's height.
 */
function buildSlots(videos: readonly TestimonialVideo[], quotes: readonly Testimonial[]): Slot[] {
  const byLength = [...quotes].sort((a, b) => a.quote.length - b.quote.length);
  const stacks: Testimonial[][] = [];
  while (byLength.length > 0) {
    const short = byLength.shift()!;
    const long = byLength.pop();
    stacks.push(long ? [long, short] : [short]);
  }

  const slots: Slot[] = [];
  const count = Math.max(videos.length, stacks.length);
  for (let index = 0; index < count; index += 1) {
    const video = videos[index];
    const stack = stacks[index];
    if (video) slots.push({ kind: "video", key: `video-${video.youtubeId}`, video });
    if (stack) slots.push({ kind: "quotes", key: `quotes-${stack.map((item) => item.id).join("+")}`, quotes: stack });
  }
  return slots;
}

// Wide edge fade via the marquee's own mask, narrow enough that the end cards stay readable.
const EDGE_FADE =
  "[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] max-sm:[mask-image:linear-gradient(to_right,transparent,#000_4%,#000_96%,transparent)]";

/**
 * Learner reviews: a single slow row mixing short feedback reels with written reviews. The row
 * pauses on hover or focus (and while a reel's player is open), so cards can be read and played.
 */
export function TestimonialsSection() {
  const slots = buildSlots(testimonialVideos, testimonials);
  if (slots.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="testimonials-title" data-landing-surface="alt" className="ma-section ma-band cv-auto overflow-hidden">
      <div className="ma-container">
        <SectionHeader
          id="testimonials-title"
          label="آراء المتعلّمين"
          title="ماذا يقول متعلّمو ماستري"
          lead="قصص خريجي الدبلومات والدورات بأصواتهم وكلماتهم: شاهد تجاربهم أو اقرأ آراءهم."
        />
      </div>
      <Marquee
        items={slots}
        getKey={(slot) => slot.key}
        label="آراء المتعلّمين وفيديوهات تجاربهم"
        duration={120}
        repeat={2}
        className={cn("marquee--tight marquee--stretch mt-12 short:mt-6", EDGE_FADE)}
        itemClassName="flex"
        renderItem={(slot) =>
          slot.kind === "video" ? (
            <TestimonialReelCard video={slot.video} />
          ) : (
            <div className="flex w-[min(22rem,78vw)] flex-col gap-4 sm:w-96">
              {slot.quotes.map((quote) => (
                <ReviewCard key={quote.id} testimonial={quote} />
              ))}
            </div>
          )
        }
      />
    </section>
  );
}
