import Image from "next/image";

import { cn } from "@/lib/cn";

type UserAvatarProps = {
  name: string;
  /** Presigned image URL; the initial is shown without one. */
  src?: string | null;
  /** Diameter in pixels. */
  size?: number;
  className?: string;
};

/** First letter of a name or e-mail, for the avatar circle. */
export function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "؟";
}

/** Kit `.ma-avatar`: the customer's picture, or their initial on the yellow circle. Decorative. */
export function UserAvatar({ name, src, size = 36, className }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("ma-avatar relative overflow-hidden", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {src ? (
        // Presigned S3 URLs change on every read: nothing to optimise or cache, so passed through.
        <Image src={src} alt="" fill unoptimized sizes={`${size}px`} className="object-cover" />
      ) : (
        initialOf(name)
      )}
    </span>
  );
}
