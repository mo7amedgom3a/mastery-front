import { formatCount } from "@/lib/format";

import type { ExpertCountsVM } from "./types";

const COURSE_FORMS = { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" };
const DIPLOMA_FORMS = { one: "دبلوم واحد", two: "دبلومان", few: "دبلومات", many: "دبلوماً" };
const PACKAGE_FORMS = { one: "باقة واحدة", two: "باقتان", few: "باقات", many: "باقة" };
const CONSULTATION_FORMS = { one: "استشارة واحدة", two: "استشارتان", few: "استشارات", many: "استشارة" };
const BUNDLE_FORMS = { one: "حزمة واحدة", two: "حزمتان", few: "حزم", many: "حزمة" };
const LIVE_FORMS = { one: "برنامج مباشر واحد", two: "برنامجان مباشران", few: "برامج مباشرة", many: "برنامجاً مباشراً" };

export type ExpertFactKey = keyof ExpertCountsVM;
export type ExpertFact = { key: ExpertFactKey; label: string };

/** What the expert offers, as counted nouns, for the hero tiles, metadata and the share card. */
export function expertFacts(counts: ExpertCountsVM): ExpertFact[] {
  const facts: ExpertFact[] = [];
  if (counts.courses > 0) facts.push({ key: "courses", label: formatCount(counts.courses, COURSE_FORMS) });
  if (counts.diplomas > 0) facts.push({ key: "diplomas", label: formatCount(counts.diplomas, DIPLOMA_FORMS) });
  if (counts.consultations > 0) {
    facts.push({ key: "consultations", label: formatCount(counts.consultations, CONSULTATION_FORMS) });
  }
  if (counts.packages > 0) facts.push({ key: "packages", label: formatCount(counts.packages, PACKAGE_FORMS) });
  if (counts.bundles > 0) facts.push({ key: "bundles", label: formatCount(counts.bundles, BUNDLE_FORMS) });
  if (counts.live > 0) facts.push({ key: "live", label: formatCount(counts.live, LIVE_FORMS) });
  return facts;
}

/**
 * "مدرّب" and/or "خبير استشارات": what the expert is on the platform. A consultant is someone with an active
 * consultant profile (`isConsultant`) or a published consultation.
 */
export function expertRoles(counts: ExpertCountsVM, isConsultant = false): string[] {
  const roles: string[] = [];
  if (counts.courses + counts.diplomas + counts.packages + counts.bundles + counts.live > 0) roles.push("مدرّب");
  if (isConsultant || counts.consultations > 0) roles.push("خبير استشارات");
  return roles;
}
