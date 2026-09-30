import Image from "next/image";

import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";

import type { TrainerVM } from "../model/types";

type TrainerAvatarProps = {
  trainer: Pick<TrainerVM, "avatar" | "initial">;
  /** Rendered size in px; also picks the image variant. */
  size: number;
  index?: number;
  className?: string;
};

/** Kit `.ma-avatar` scaled up: the trainer's photo, or their initial on a brand colour. */
export function TrainerAvatar({ trainer, size, index = 0, className }: TrainerAvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-content-center overflow-hidden rounded-full font-bold text-ink",
        brandBg[brandColorAt(index)],
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {trainer.avatar ? (
        <Image src={trainer.avatar} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span aria-hidden="true">{trainer.initial}</span>
      )}
    </span>
  );
}
