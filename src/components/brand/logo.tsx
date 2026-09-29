import Image from "next/image";

import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  /** Height in px; width follows the logo's aspect ratio (300.4 × 34.1). */
  height?: number;
  priority?: boolean;
  /**
   * `theme` follows the active theme (white word on dark, ink word on light).
   * `on-dark` is for surfaces that stay ink in every theme (footer).
   */
  tone?: "theme" | "on-dark";
};

const LOGO_RATIO = 300.4 / 34.1;

/** Kit logo files (coral mark + white or ink word) — never retype or recolour them. */
export function Logo({ className, height = 24, priority, tone = "theme" }: LogoProps) {
  const size = { width: Math.round(height * LOGO_RATIO), height };
  const imageClass = cn("ma-logo h-auto max-w-full", className);

  if (tone === "on-dark") {
    return <Image src="/brand/ma-logo-coral-white.svg" alt="ماستري أكاديمي" {...size} priority={priority} unoptimized className={imageClass} />;
  }

  // Both files are ~4 KB SVGs; CSS shows the one matching the theme, so there's no flash or hydration mismatch.
  return (
    <>
      <Image
        src="/brand/ma-logo-coral-white.svg"
        alt="ماستري أكاديمي"
        {...size}
        priority={priority}
        unoptimized
        className={cn(imageClass, "theme-dark-only")}
      />
      <Image
        src="/brand/ma-logo-coral-ink.svg"
        alt="ماستري أكاديمي"
        {...size}
        priority={priority}
        unoptimized
        className={cn(imageClass, "theme-light-only")}
      />
    </>
  );
}
