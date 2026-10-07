import { cn } from "@/lib/cn";

import type { StatusView } from "../model/status";

/** A status always reads as a word; the colour only reinforces it. */
export function StatusTag({ status, className }: { status: StatusView; className?: string }) {
  return <span className={cn("ma-tag", status.tag, className)}>{status.label}</span>;
}
