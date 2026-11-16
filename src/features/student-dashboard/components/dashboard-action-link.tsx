import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";

/** A visible, consistent navigation action for dashboard section headers. */
export function DashboardActionLink({ href, children, label }: { href: Route; children?: ReactNode; label?: string }) {
  return (
    <ButtonLink href={href} variant="soft" size="sm" className="shrink-0 border border-line-strong">
      {children ?? label}
      <ArrowLeft aria-hidden="true" className="size-4 shrink-0 fill-none" />
    </ButtonLink>
  );
}
