"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";

import { claimAnonymousLabs } from "../api/anonymous";
import { getLabsApiMode } from "../api/client";
import type { LiveLabSummary } from "../api/contract";
import { liveLabQueries } from "../api/services/labs";
import { labs } from "../model/catalog";
import type { LabDefinition, LabSlug } from "../model/types";

const DEAL_PREFIX = "deal-recovery-";

/** A card for a lab that exists only on the server (authored in the admin). */
function cardFor(item: LiveLabSummary): LabDefinition {
  return {
    slug: item.slug as LabSlug,
    categoryLegacyId: item.field_category_id ?? 0,
    categoryName: item.category_name ?? "مختبرات جديدة",
    title: item.title,
    tagline: item.tagline,
    role: "",
    scenario: "",
    targets: [],
    constraints: [],
    skills: item.skills,
    difficulty: item.difficulty,
    minutes: item.minutes,
    color: item.color,
    phases: [],
    courseKeywords: [],
  };
}

/**
 * Live mode: which labs the hub shows. Bundled labs appear only while published on the server (the
 * four deal-recovery cards follow the `deal-recovery` lab); labs created in the admin are appended.
 * Returns `null` in mock mode or while loading, so the hub keeps the bundled catalogue.
 */
export function useLiveCatalog(): LabDefinition[] | null {
  const live = getLabsApiMode() === "live";
  const query = useQuery({ ...liveLabQueries.list(), enabled: live });
  const signedIn = useAuthStore((state) => state.status) === "authenticated";

  // Move pre-login runs to the account once, after sign-in (a signed-out claim is a 401).
  useEffect(() => {
    if (live && signedIn) void claimAnonymousLabs();
  }, [live, signedIn]);

  if (!live || !query.data) return null;
  const published = new Set(query.data.items.map((item) => item.slug));
  const bundled = new Set<string>(labs.map((lab) => lab.slug));
  const visible = labs.filter((lab) =>
    lab.slug.startsWith(DEAL_PREFIX) ? published.has("deal-recovery") : published.has(lab.slug),
  );
  const extra = query.data.items
    .filter((item) => !bundled.has(item.slug) && item.slug !== "deal-recovery")
    .map(cardFor);
  return [...visible, ...extra];
}
