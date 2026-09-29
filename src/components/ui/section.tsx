import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type SectionProps = ComponentProps<"section"> & {
  /** `alt` renders on the surface-alt band so sections alternate (kit layout rule). */
  tone?: "base" | "alt";
  /** Skip rendering work while offscreen. Use for below-the-fold sections only. */
  deferRender?: boolean;
};

export function Section({ tone = "base", deferRender, className, children, ...rest }: SectionProps) {
  return (
    <section className={cn("ma-section", tone === "alt" && "ma-band", deferRender && "cv-auto", className)} {...rest}>
      <div className="ma-container">{children}</div>
    </section>
  );
}
