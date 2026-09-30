import "server-only";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { parseExpertSlug } from "@/config/routes";
import { baseOpenGraph, siteConfig } from "@/config/site";

import { expertFacts, expertRoles } from "../model/facts";
import type { ExpertDetailData } from "../model/types";
import { getExpertDetail } from "./get-expert-detail";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function expertForSlug(slug: string): Promise<ExpertDetailData | null> {
  const key = parseExpertSlug(safeDecode(slug));
  const data = key === null ? null : await getExpertDetail(key);
  // A profile without a name is a broken legacy row, not a page.
  return data?.expert.name ? data : null;
}

/**
 * Data for `/experts/[slug]`. 404s unknown keys; permanently redirects to the canonical
 * `/experts/{key}-{name}` when the name part is missing or off (e.g. `/experts/9` from a course
 * page, which knows the trainer by a shorter name, or the old `/instructors/9`).
 */
export async function loadExpertPage(slug: string): Promise<ExpertDetailData> {
  const data = await expertForSlug(slug);
  if (!data) {
    notFound();
  }
  const canonical = data.expert.href;
  if (safeDecode(`/experts/${slug}`) !== safeDecode(canonical)) {
    permanentRedirect(canonical);
  }
  return data;
}

/** Metadata from the same cached request the page makes; unknown keys get the 404 page's defaults. */
export async function expertMetadata(slug: string): Promise<Metadata> {
  const data = await expertForSlug(slug);
  if (!data) {
    return {};
  }
  const { expert } = data;
  const role = expertRoles(expert.counts).join(" و");
  // "د. مظهر قنطقجي – مدرّب ومستشار في المالية والمحاسبة": the name first, it is what people search.
  const field = expert.specialties[0] ? ` في ${expert.specialties[0]}` : "";
  const title = role ? `${expert.name} – ${role}${field}` : expert.name;
  const offers = expertFacts(expert.counts)
    .map((fact) => fact.label)
    .join("، ");
  const description =
    expert.summary ??
    (offers ? `تعرّف على ${expert.name} وما يقدّمه على ${siteConfig.name}: ${offers}.` : siteConfig.description);
  return {
    title,
    description,
    alternates: { canonical: expert.href, languages: { ar: expert.href, "x-default": expert.href } },
    openGraph: {
      ...baseOpenGraph,
      type: "profile",
      url: expert.href,
      title: expert.name,
      description,
      ...(expert.avatar ? { images: [{ url: expert.avatar, alt: expert.name }] } : {}),
    },
    twitter: {
      // Portraits are square or tall: the small card shows them whole.
      card: "summary",
      title: expert.name,
      description,
      ...(expert.avatar ? { images: [expert.avatar] } : {}),
    },
    ...(expert.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}
