/**
 * Definition validation shared by the mock admin API and, later, the backend publish endpoint.
 * It checks the things a publish must never allow: broken pathway edges, missing field/persona
 * references, unreachable ends, unguarded cycles and empty scoring.
 */
import type { LabDefinitionPayload, LabPathway, LabValidation } from "../contract";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateLabDefinition(definition: LabDefinitionPayload): LabValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!SLUG.test(definition.slug)) errors.push("Slug must be lowercase letters, numbers and dashes.");
  if (!definition.title.trim()) errors.push("Title is required.");
  if (!definition.tagline.trim()) errors.push("Tagline is required.");
  if (!definition.scenario.trim()) errors.push("Scenario is required.");
  if (!definition.targets.length) warnings.push("Add at least one target so the learner knows what success means.");
  if (!definition.phases.length) errors.push("At least one phase is required.");
  if (definition.engine === "schema" && !definition.pathway) errors.push("Schema labs need a pathway.");
  if (definition.engine === "legacy" && !definition.legacy_slug) errors.push("Legacy labs need a legacy_slug.");

  if (definition.scoring.dimensions.length === 0) {
    warnings.push("No scoring dimensions: the debrief will have no skill axes.");
  }
  const dimensionKeys = new Set(definition.scoring.dimensions.map((dimension) => dimension.key));
  for (const field of definition.fields) {
    if (field.score && !dimensionKeys.has(field.score.dimension)) {
      errors.push(`Field "${field.id}" scores unknown dimension "${field.score.dimension}".`);
    }
  }

  if (definition.pathway) validatePathway(definition.pathway, definition, errors, warnings);

  for (const requirement of definition.requirements) {
    if (!requirement.id || !requirement.type) errors.push("Every requirement needs an id and a type.");
  }

  if (!definition.release.locales.length) errors.push("At least one locale is required.");

  return { valid: errors.length === 0, errors, warnings };
}

function validatePathway(
  pathway: LabPathway,
  definition: LabDefinitionPayload,
  errors: string[],
  warnings: string[],
): void {
  const fieldIds = new Set(definition.fields.map((field) => field.id));
  const personaIds = new Set(definition.personas.map((persona) => persona.id));
  const nodeIds = new Set(Object.keys(pathway.nodes));

  if (!nodeIds.has(pathway.entry)) errors.push(`Pathway entry "${pathway.entry}" does not exist.`);

  for (const [id, node] of Object.entries(pathway.nodes)) {
    if (node.id !== id) errors.push(`Node key "${id}" does not match its id "${node.id}".`);
    if (node.persona_id && !personaIds.has(node.persona_id)) {
      errors.push(`Node "${id}" references unknown persona "${node.persona_id}".`);
    }
    for (const fieldId of node.fields ?? []) {
      if (!fieldIds.has(fieldId)) errors.push(`Node "${id}" references unknown field "${fieldId}".`);
    }
    for (const target of [node.next, ...(node.choices ?? []).map((choice) => choice.next), ...(node.conditions ?? []).map((condition) => condition.to)]) {
      if (target && !nodeIds.has(target)) errors.push(`Node "${id}" points to unknown node "${target}".`);
    }
    if (node.type === "choice" && !(node.choices?.length)) errors.push(`Choice node "${id}" has no choices.`);
    if (node.type === "form" && !(node.fields?.length)) errors.push(`Form node "${id}" has no fields.`);
    if (node.type === "dialogue" && !(node.choices?.length) && !node.next) {
      errors.push(`Dialogue node "${id}" has neither choices nor a next node.`);
    }
  }

  const ends = [...nodeIds].filter((id) => pathway.nodes[id]?.type === "end");
  if (!ends.length) errors.push("The pathway has no end node.");

  const reachable = new Set<string>();
  const stack = [pathway.entry];
  let steps = 0;
  while (stack.length && steps < 5000) {
    steps += 1;
    const id = stack.pop();
    if (!id || reachable.has(id)) continue;
    const node = pathway.nodes[id];
    if (!node) continue;
    reachable.add(id);
    if (node.next) stack.push(node.next);
    for (const choice of node.choices ?? []) stack.push(choice.next);
    for (const condition of node.conditions ?? []) stack.push(condition.to);
  }
  for (const id of nodeIds) {
    if (!reachable.has(id)) warnings.push(`Node "${id}" is unreachable from the entry.`);
  }
  if (!ends.some((id) => reachable.has(id))) errors.push("No end node is reachable from the entry.");

  const maxSteps = pathway.limits?.max_steps;
  if (maxSteps != null && maxSteps < 1) errors.push("Pathway limits.max_steps must be at least 1.");
}
