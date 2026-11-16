"use client";

import { dealScenarios, isDealSlug } from "../content/deals";
import { isObjectionSlug, objectionScenarios } from "../content/objections";
import { findLab } from "../model/catalog";
import type { LabSlug } from "../model/types";
import { CeoLab } from "./ceo/ceo-lab";
import { CloseLab } from "./close/close-lab";
import { CrisisLab } from "./crisis/crisis-lab";
import { EscapeLab } from "./escape/escape-lab";
import { ForecastLab } from "./forecast/forecast-lab";
import { GovernanceLab } from "./governance/governance-lab";
import { RegistrationLab } from "./registration/registration-lab";
import { DealRecoveryLab } from "./deals/deal-recovery-lab";
import { HrLab } from "./hr/hr-lab";
import { MarketingLab } from "./marketing/ad-lab";
import { ObjectionLab } from "./objections/objection-lab";
import { SalesLab } from "./sales/sales-lab";
import { SalesFailureLab } from "./sales-failure/sales-failure-lab";
import { SupportLab } from "./support/support-lab";

/** Picks the lab runner for a slug (the server page already 404s unknown slugs). */
export function LabPage({ slug }: { slug: LabSlug }) {
  const lab = findLab(slug);
  if (!lab) return null;
  if (isDealSlug(lab.slug)) return <DealRecoveryLab key={lab.slug} lab={lab} scenario={dealScenarios[lab.slug]} />;
  if (isObjectionSlug(lab.slug)) return <ObjectionLab key={lab.slug} lab={lab} scenario={objectionScenarios[lab.slug]} />;
  switch (lab.slug) {
    case "marketing-ads":
      return <MarketingLab lab={lab} />;
    case "sales-discovery-call":
      return <SalesLab lab={lab} />;
    case "hr-conflict-mediation":
      return <HrLab lab={lab} />;
    case "support-angry-customer":
      return <SupportLab lab={lab} />;
    case "ceo-competitor-response":
      return <CeoLab lab={lab} />;
    case "sales-failure-week":
      return <SalesFailureLab lab={lab} />;
    case "startup-company-registration":
      return <RegistrationLab lab={lab} />;
    case "governance-first-board":
      return <GovernanceLab lab={lab} />;
    case "cfo-forecast-runway":
      return <ForecastLab lab={lab} />;
    case "finance-quarter-close":
      return <CloseLab lab={lab} />;
    case "crisis-data-leak":
      return <CrisisLab lab={lab} />;
    case "audit-escape-room":
      return <EscapeLab lab={lab} />;
  }
}
