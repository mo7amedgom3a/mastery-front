import { cn } from "@/lib/cn";
import { ticketPriority, ticketStatus } from "../model/status";

export function TicketStatusTag({ status, className }: { status: string; className?: string }) {
  const view = ticketStatus(status);
  return <span className={cn("ma-tag", view.tag, className)}>{view.label}</span>;
}

export function TicketPriorityTag({ priority, className }: { priority: string; className?: string }) {
  const view = ticketPriority(priority);
  return <span className={cn("ma-tag", view.tag, className)}>{view.label}</span>;
}
