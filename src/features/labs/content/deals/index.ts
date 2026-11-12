import type { DealSlug } from "../../model/types";
import { foodScenario } from "./food";
import { medicalScenario } from "./medical";
import { realEstateScenario } from "./real-estate";
import { restaurantsScenario } from "./restaurants";
import type { DealScenario } from "./types";

export const dealScenarios: Record<DealSlug, DealScenario> = {
  "deal-recovery-real-estate": realEstateScenario,
  "deal-recovery-medical": medicalScenario,
  "deal-recovery-food": foodScenario,
  "deal-recovery-restaurants": restaurantsScenario,
};

export function isDealSlug(slug: string): slug is DealSlug {
  return slug in dealScenarios;
}
