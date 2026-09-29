/** Kit brand colours usable as solid fields (posters, tags, card media). Ink text on all of them. */
export type BrandColor = "coral" | "yellow" | "purple" | "sky" | "pink" | "teal" | "lilac" | "green" | "cream";

// Static class strings so Tailwind can see them.
export const brandBg: Record<BrandColor, string> = {
  coral: "bg-coral",
  yellow: "bg-yellow",
  purple: "bg-purple",
  sky: "bg-sky",
  pink: "bg-pink",
  teal: "bg-teal",
  lilac: "bg-lilac",
  green: "bg-green",
  cream: "bg-cream",
};

/** Field rotation that keeps neighbouring blocks visually distinct. */
export const brandCycle: readonly BrandColor[] = ["coral", "yellow", "sky", "green", "lilac", "teal", "purple", "pink"];

export function brandColorAt(index: number): BrandColor {
  return brandCycle[index % brandCycle.length];
}
