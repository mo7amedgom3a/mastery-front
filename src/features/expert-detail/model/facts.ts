import { formatCount } from "@/lib/format";

import type { ExpertCountsVM } from "./types";

const COURSE_FORMS = { one: "دورة واحدة", two: "دورتان", few: "دورات", many: "دورة" };
const DIPLOMA_FORMS = { one: "دبلوم واحد", two: "دبلومان", few: "دبلومات", many: "دبلوماً" };
const PACKAGE_FORMS = { one: "باقة واحدة", two: "باقتان", few: "باقات", many: "باقة" };
const CONSULTATION_FORMS = { one: "استشارة واحدة", two: "استشارتان", few: "استشارات", many: "استشارة" };

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
  return facts;
}

/** "مدرّب ومستشار" · "مدرّب" · "مستشار": what the expert is on the platform. */
export function expertRoles(counts: ExpertCountsVM): string[] {
  const roles: string[] = [];
  if (counts.courses + counts.diplomas + counts.packages > 0) roles.push("مدرّب");
  if (counts.consultations > 0) roles.push("مستشار");
  return roles;
}
