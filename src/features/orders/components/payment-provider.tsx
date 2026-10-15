import Image from "next/image";

import { cn } from "@/lib/cn";

/** How an order was paid, as its provider's logo. Unknown providers fall back to their name. */
const PROVIDERS: Record<string, { name: string; src: string; width: number; height: number; chip: boolean }> = {
  // Tamara's official gradient wordmark: shown unaltered, it carries its own background.
  tamara: { name: "تمارا", src: "/icons/tamara-logo-ar.png", width: 296, height: 96, chip: false },
  // Stripe's purple wordmark, on white so it reads in the dark theme too.
  stripe: { name: "Stripe", src: "/icons/stripe.svg", width: 512, height: 214, chip: true },
};

export function PaymentProvider({
  provider,
  size = "sm",
  className,
}: {
  provider: string | null | undefined;
  /** `sm` for order lists, `md` for the order page. */
  size?: "sm" | "md";
  className?: string;
}) {
  if (!provider) return null;
  const known = PROVIDERS[provider];
  if (!known) return <span className={cn("text-sm font-bold", className)}>{provider}</span>;

  const height = size === "sm" ? "h-6" : "h-7 md:h-8";
  const image = (
    <Image
      src={known.src}
      alt={known.name}
      width={known.width}
      height={known.height}
      unoptimized={known.src.endsWith(".svg")}
      className={cn("w-auto shrink-0", known.chip ? "h-full" : height)}
    />
  );
  return known.chip ? (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border border-line bg-white px-2 py-1",
        height,
        className,
      )}
    >
      {image}
    </span>
  ) : (
    <span className={cn("inline-flex shrink-0", className)}>{image}</span>
  );
}
