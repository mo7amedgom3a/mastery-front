/** Badge rules shared by the local store, the mock API and (later) the backend scorer. */
import { labs } from "./catalog";
import type { BadgeId, BadgeSignals, LabSlug, Scorecard } from "./types";

export function earnedBadges(
  slug: LabSlug,
  scorecard: Scorecard,
  signals: BadgeSignals,
  attemptedSlugs: readonly LabSlug[],
): BadgeId[] {
  const earned: BadgeId[] = ["first-lab"];
  if (signals.marketingTargetMet) earned.push("budget-sniper");
  if (signals.dealClosed) earned.push("deal-closer");
  if (signals.peaceMade) earned.push("peacemaker");
  if (signals.shareDefended) earned.push("share-defender");
  if (signals.coolHead) earned.push("cool-head");
  if (signals.dealSaved) earned.push("deal-saver");
  if (signals.fairTerms) earned.push("fair-terms");
  if (signals.objectionReader) earned.push("objection-reader");
  if (signals.rulerMaster) earned.push("ruler-master");
  if (signals.rejectionProof) earned.push("rejection-proof");
  if (signals.funnelMaster) earned.push("funnel-master");
  if (signals.founder) earned.push("founder");
  if (signals.governanceGuardian) earned.push("governance-guardian");
  if (signals.runwayKeeper) earned.push("runway-keeper");
  if (signals.cleanClose) earned.push("clean-close");
  if (signals.crisisCommander) earned.push("crisis-commander");
  if (signals.escapeArtist) earned.push("escape-artist");
  if (scorecard.overall >= 85) earned.push("excellence");
  const done = new Set([...attemptedSlugs, slug]);
  if (labs.every((lab) => done.has(lab.slug))) earned.push("all-rounder");
  return earned;
}

export function newBadges(earned: readonly BadgeId[], previous: readonly BadgeId[]): BadgeId[] {
  return earned.filter((badge) => !previous.includes(badge));
}
