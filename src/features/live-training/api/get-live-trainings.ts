import "server-only";

import { cache } from "react";

import { getLiveDiploma, listLiveDiplomas } from "@/lib/api/live-diplomas";

import { byStartDate, fromLiveDiploma, isOpen, toListItem, toLiveTrainingDetailVM, toLiveTrainingVM } from "../model/mappers";
import type { LiveTrainingDetailDto, LiveTrainingDetailVM, LiveTrainingDto, LiveTrainingVM } from "../model/types";

/** Matches the `/live` pages' `revalidate`; refreshed on demand via the `live-trainings` tag. */
const REVALIDATE_SECONDS = 300;
const TAGS = ["live-trainings"];
const read = { next: { revalidate: REVALIDATE_SECONDS, tags: TAGS } } as const;

/** Every published live diploma as a storefront DTO (list fields + `details`). */
const getLiveTrainingDetailDtos = cache(async (): Promise<LiveTrainingDetailDto[]> => {
  const diplomas = await listLiveDiplomas(read);
  return diplomas.map(fromLiveDiploma);
});

/** Every published live diploma, soonest first, as list items. */
export const getLiveTrainingDtos = cache(async (): Promise<LiveTrainingDto[]> => {
  const all = await getLiveTrainingDetailDtos();
  return all.toSorted(byStartDate).map(toListItem);
});

/** One training with its page content, by slug; null when unknown or unpublished. */
export const getLiveTrainingDetailDto = cache(async (slug: string): Promise<LiveTrainingDetailDto | null> => {
  try {
    const diploma = await getLiveDiploma(slug, read);
    return fromLiveDiploma(diploma);
  } catch {
    return null;
  }
});

export async function getLiveTrainings(): Promise<LiveTrainingVM[]> {
  return (await getLiveTrainingDtos()).map(toLiveTrainingVM);
}

/** Featured diplomas (the landing spotlight carousel); falls back to all open when none flagged. */
export async function getFeaturedLiveTrainings(): Promise<LiveTrainingVM[]> {
  const all = await getLiveTrainingDetailDtos();
  const featured = all.filter((dto) => dto.featured);
  const chosen = featured.length > 0 ? featured : all.filter((dto) => isOpen(dto, Date.now()));
  return chosen.toSorted(byStartDate).map(toListItem).map(toLiveTrainingVM);
}

export async function getLiveTrainingDetail(slug: string): Promise<LiveTrainingDetailVM | null> {
  const dto = await getLiveTrainingDetailDto(slug);
  return dto ? toLiveTrainingDetailVM(dto) : null;
}

/** Every published diploma slug (static params, sitemap). */
export async function getLiveTrainingSlugs(): Promise<string[]> {
  return (await getLiveTrainingDetailDtos()).map((dto) => dto.slug);
}
