import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

/** An amount in the site currency. Always left-to-right, so "$129" never flips inside Arabic text. */
export function Money({ amount, className }: { amount: number; className?: string }) {
  return (
    <span dir="ltr" className={cn("tabular-nums", className)}>
      {formatMoney(amount)}
    </span>
  );
}
