import type { ObjectionSlug } from "../../model/types";
import { competitorRulerScenario } from "./competitor-ruler";
import { sixTypesScenario } from "./six-types";
import type { ObjectionScenario } from "./types";

export const objectionScenarios: Record<ObjectionSlug, ObjectionScenario> = {
  "objections-six-types": sixTypesScenario,
  "objections-competitor-ruler": competitorRulerScenario,
};

export function isObjectionSlug(slug: string): slug is ObjectionSlug {
  return slug in objectionScenarios;
}
