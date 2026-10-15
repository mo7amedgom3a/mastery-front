import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";

/**
 * An amount, in the site currency unless told otherwise (an order paid in AED). Always
 * left-to-right, so "$129" never flips inside Arabic text.
 */
export function Money({ amount, currency, className }: { amount: number; currency?: string; className?: string }) {
  return (
    <span dir="ltr" className={cn("tabular-nums", className)}>
      {formatMoney(amount, currency)}
    </span>
  );
}
