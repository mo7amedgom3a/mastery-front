import { formatCount } from "@/lib/format";

import type { ConsultationDetailVM } from "./types";

const SESSION_FORMS = { one: "جلسة واحدة", two: "جلستان", few: "جلسات", many: "جلسة" };

export type ConsultationFactKey = "sessions" | "length" | "format";
export type ConsultationFact = { key: ConsultationFactKey; label: string };

export function sessionsLabel(sessions: number): string | null {
  return sessions > 0 ? formatCount(sessions, SESSION_FORMS) : null;
}

/** Headline facts shown in the hero and on the share card, in display order. */
export function consultationFacts(
  consultation: Pick<ConsultationDetailVM, "sessions" | "sessionLength">,
): ConsultationFact[] {
  const facts: ConsultationFact[] = [];
  const sessions = sessionsLabel(consultation.sessions);
  if (sessions) facts.push({ key: "sessions", label: sessions });
  if (consultation.sessionLength) {
    facts.push({ key: "length", label: `${consultation.sessionLength} للجلسة` });
  }
  // Every consultation is a one-to-one video meeting (see the FAQ and the booking card).
  facts.push({ key: "format", label: "اجتماع مرئي مباشر" });
  return facts;
}
