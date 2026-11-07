import { ArrowLeft } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { brandBg, brandColorAt } from "@/components/ui/brand-colors";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

import type { FieldVM } from "../model/b2b-view";

/** Training fields (the privacy-safe answer to "departments"): each links into the catalog search. */
export function FieldGrid({ fields, compact }: { fields: FieldVM[]; compact?: boolean }) {
  if (fields.length === 0) {
    return null;
  }
  return (
    <ul className={cn("b2b-fields", compact && "b2b-fields--compact")} data-b2b-stagger>
      {fields.map((field, index) => (
        <li key={field.code}>
          <AppLink href={field.href} className="b2b-field">
            <span aria-hidden="true" className={cn("b2b-field__dot", brandBg[brandColorAt(index)])} />
            <span className="b2b-field__name">{field.name}</span>
            {field.count > 0 ? (
              <span className="b2b-field__count" aria-label={`${formatNumber(field.count)} برنامج`}>
                {formatNumber(field.count)}
              </span>
            ) : null}
            <ArrowLeft aria-hidden="true" className="b2b-field__arrow" />
          </AppLink>
        </li>
      ))}
    </ul>
  );
}
