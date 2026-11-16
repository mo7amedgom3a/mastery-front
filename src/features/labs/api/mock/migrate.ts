/**
 * One-time import of the pre-API `ma-labs` Zustand store into the mock DB. It preserves the
 * learner's attempts, XP and badges, and is idempotent (the `legacy_imported` flag).
 */
import type { Attempt } from "../../model/progress-store";
import type { Dimension, Scorecard } from "../../model/types";
import { newId, type LabAttemptRecord, type MockDb } from "./db";
import { LEGACY_LABS_KEY, type LabStorage } from "./storage";

type Persisted = {
  state?: {
    attempts?: Attempt[];
    xp?: number;
    badges?: string[];
  };
};

export function importLegacyAttempts(db: MockDb, storage: LabStorage, now: () => Date): number {
  if (db.meta.legacy_imported) return 0;
  const raw = storage.getItem(LEGACY_LABS_KEY);
  if (!raw) {
    db.meta.legacy_imported = true;
    return 0;
  }

  try {
    const parsed = JSON.parse(raw) as Persisted;
    const attempts = parsed.state?.attempts ?? [];
    let imported = 0;
    for (const attempt of attempts) {
      if (!attempt?.slug || typeof attempt.overall !== "number") continue;
      const dimensions: Dimension[] = (attempt.dimensions ?? []).map((dimension) => ({
        ...dimension,
        weight: dimension.weight ?? 1,
        praise: dimension.praise ?? "",
        tip: dimension.tip ?? "",
      }));
      const scorecard: Scorecard = {
        overall: attempt.overall,
        readiness: attempt.readiness,
        dimensions,
        highlights: attempt.highlights ?? [],
        strengths: dimensions.filter((dimension) => dimension.score >= 75).map((dimension) => dimension.praise),
        tips: dimensions.filter((dimension) => dimension.score < 85).map((dimension) => dimension.tip),
        verdict: "محاولة مستوردة من السجل المحلي.",
      };
      const record: LabAttemptRecord = {
        attempt_id: newId("att"),
        session_id: newId("sess"),
        slug: attempt.slug,
        at: attempt.at ?? now().toISOString(),
        overall: attempt.overall,
        readiness: attempt.readiness,
        dimensions,
        xp: attempt.xp ?? 0,
        badges: attempt.badges ?? [],
        category_legacy_id: attempt.categoryLegacyId ?? 0,
        category_name: attempt.categoryName ?? "",
        minutes: attempt.minutes ?? 0,
        highlights: attempt.highlights ?? [],
        pre: attempt.pre ?? null,
        post: attempt.post ?? null,
        signals: attempt.signals ?? {},
        attempt_no: attempt.attemptNo ?? imported + 1,
        lab_version: 1,
        source: "imported",
        status: "scored",
        scorecard,
        customer_id: null,
        anonymous_id: "legacy",
      };
      db.attempts.push(record);
      for (const badge of record.badges) {
        db.badges.push({ badge, attempt_id: record.attempt_id, earned_at: record.at });
      }
      imported += 1;
    }
    db.meta.legacy_imported = true;
    return imported;
  } catch {
    db.meta.legacy_imported = true;
    return 0;
  }
}
