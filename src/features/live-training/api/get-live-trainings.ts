import "server-only";

import { cache } from "react";

import { byStartDate, isOpen, toLiveTrainingDetailVM, toLiveTrainingVM } from "../model/mappers";
import type { LiveTrainingDetailDto, LiveTrainingDto, LiveTrainingDetailVM, LiveTrainingVM } from "../model/types";
import { LIVE_TRAININGS } from "./mock-data";

/** The list item: everything but the long-form page content. */
function toListItem(dto: LiveTrainingDetailDto): LiveTrainingDto {
  const item: Partial<LiveTrainingDetailDto> = { ...dto };
  delete item.details;
  return item as LiveTrainingDto;
}

/**
 * Open live trainings (not yet finished), soonest first, in the API's shape. Pages and the landing
 * banner call this directly; `GET /api/live-trainings` serves the same list to the browser.
 *
 * TODO(api): fetch the backend list here (`apiFetch` + `cachedRead`) instead of the mock.
 */
export const getLiveTrainingDtos = cache(async (): Promise<LiveTrainingDto[]> => {
  const now = Date.now();
  return LIVE_TRAININGS.filter((dto) => isOpen(dto, now)).toSorted(byStartDate).map(toListItem);
});

/**
 * One training with its page content, by slug; null when unknown. Finished trainings still resolve,
 * so links shared during a cohort keep working after it ends.
 *
 * TODO(api): fetch `/live-trainings/{slug}` from the backend instead of the mock.
 */
export const getLiveTrainingDetailDto = cache(async (slug: string): Promise<LiveTrainingDetailDto | null> => {
  return LIVE_TRAININGS.find((dto) => dto.slug === slug) ?? null;
});

export async function getLiveTrainings(): Promise<LiveTrainingVM[]> {
  return (await getLiveTrainingDtos()).map(toLiveTrainingVM);
}

/** The next training to start (the landing spotlight); null when none is open. */
export async function getNewestLiveTraining(): Promise<LiveTrainingVM | null> {
  const [next] = await getLiveTrainingDtos();
  return next ? toLiveTrainingVM(next) : null;
}

export async function getLiveTrainingDetail(slug: string): Promise<LiveTrainingDetailVM | null> {
  const dto = await getLiveTrainingDetailDto(slug);
  return dto ? toLiveTrainingDetailVM(dto) : null;
}

/** Every slug with a page, open or finished (static params, sitemap). */
export async function getLiveTrainingSlugs(): Promise<string[]> {
  return LIVE_TRAININGS.map((dto) => dto.slug);
}
