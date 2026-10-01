import "server-only";

import { cache } from "react";

import { byStartDate, isOpen, toLiveTrainingVM } from "../model/mappers";
import type { LiveTrainingDto, LiveTrainingVM } from "../model/types";
import { LIVE_TRAININGS } from "./mock-data";

/**
 * Open live trainings (not yet finished), soonest first, in the API's shape. Pages and the landing
 * banner call this directly; `GET /api/live-trainings` serves the same list to the browser.
 *
 * TODO(api): fetch the backend list here (`apiFetch` + `cachedRead`) instead of the mock.
 */
export const getLiveTrainingDtos = cache(async (): Promise<LiveTrainingDto[]> => {
  const now = Date.now();
  return LIVE_TRAININGS.filter((dto) => isOpen(dto, now)).toSorted(byStartDate);
});

export async function getLiveTrainings(): Promise<LiveTrainingVM[]> {
  return (await getLiveTrainingDtos()).map(toLiveTrainingVM);
}

/** The next training to start (the landing spotlight); null when none is open. */
export async function getNewestLiveTraining(): Promise<LiveTrainingVM | null> {
  const [next] = await getLiveTrainingDtos();
  return next ? toLiveTrainingVM(next) : null;
}
