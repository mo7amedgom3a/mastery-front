/**
 * The mock labs HTTP server. It matches method + path, applies the same checks the future
 * FastAPI module will apply (published versions, requirements, sequence, idempotency, scoring),
 * and persists to the mock DB. Tests call `request` directly with latency 0.
 */
import type { CatalogCard } from "@/lib/api/browse";

import type { BadgeId, LabSlug, Scorecard } from "../../model/types";
import { earnedBadges } from "../../model/badges";
import { xpFor } from "../../model/scoring";
import type {
  AdminLab,
  AdminLabList,
  LabAction,
  LabActionRequest,
  LabAnalytics,
  LabApiQuery,
  LabAsset,
  LabAssignment,
  LabAttempt,
  LabAttemptList,
  LabCompletionRequest,
  LabCompletionResult,
  LabDefinitionPayload,
  LabDraft,
  LabGenerationJob,
  LabGenerationRequest,
  LabInsights,
  LabList,
  LabOverview,
  LabPathwayNode,
  LabPreviewToken,
  LabRecommendationSet,
  LabRequirement,
  LabRequirementStatus,
  LabRuntime,
  LabSummary,
  LabValidation,
  LabVersion,
} from "../contract";
import { LabApiError } from "../errors";
import {
  audit,
  checksum,
  clone,
  emptyDb,
  findLabById,
  findLabBySlug,
  labRecord,
  loadDb,
  newId,
  nowIso,
  saveDb,
  seedDb,
  type LabAttemptRecord,
  type LabEventRecord,
  type LabRecord,
  type LabSessionRecord,
  type LabVersionRecord,
  type MockDb,
} from "./db";
import { fixturesForCategory, schemaFixtures } from "./seed";
import { importLegacyAttempts } from "./migrate";
import { scoreCompletion } from "./scoring";
import { createBrowserStorage, type LabStorage } from "./storage";
import { validateLabDefinition } from "./validate";

export type MockContext = {
  customer_id?: string | null;
  anonymous_id?: string | null;
  entitlements?: string[];
  assignments?: string[];
  skills?: string[];
  consent?: boolean;
  is_admin?: boolean;
  actor?: string;
};

export type MockRequestOptions = {
  query?: LabApiQuery;
  body?: unknown;
  context?: MockContext;
};

export type MockServerOptions = {
  storage?: LabStorage;
  now?: () => Date;
  random?: () => number;
  latency_ms?: number;
  fail_rate?: number;
  context?: MockContext;
};

type HandlerContext = {
  db: MockDb;
  params: string[];
  query: LabApiQuery;
  body: unknown;
  context: MockContext;
  now: () => Date;
  random: () => number;
};

type Handler = (input: HandlerContext) => unknown | Promise<unknown>;
type Route = { method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; pattern: RegExp; handler: Handler };

const DEFAULT_CONTEXT: MockContext = {
  customer_id: "mock-customer",
  anonymous_id: "mock-anonymous",
  entitlements: ["course", "diploma", "package", "subscription"],
  assignments: [],
  skills: [],
  consent: true,
  is_admin: true,
  actor: "mock-admin",
};

const nowDefault = () => new Date();
const randomDefault = () => Math.random();

export class MockLabsServer {
  private readonly storage: LabStorage;
  private readonly now: () => Date;
  private readonly random: () => number;
  private readonly latency: number;
  private readonly failRate: number;
  private readonly defaultContext: MockContext;
  private db: MockDb;

  constructor(options: MockServerOptions = {}) {
    this.storage = options.storage ?? createBrowserStorage();
    this.now = options.now ?? nowDefault;
    this.random = options.random ?? randomDefault;
    this.latency = options.latency_ms ?? 0;
    this.failRate = options.fail_rate ?? 0;
    this.defaultContext = { ...DEFAULT_CONTEXT, ...(options.context ?? {}) };
    this.db = loadDb(this.storage, this.now);
    importLegacyAttempts(this.db, this.storage, this.now);
    saveDb(this.storage, this.db);
  }

  /** Replace the DB (tests, reset). */
  reset(db: MockDb = seedDb(emptyDb(this.now), this.now)): void {
    this.db = db;
    saveDb(this.storage, this.db);
  }

  snapshot(): MockDb {
    return this.db;
  }

  async request<T>(method: Route["method"], path: string, options: MockRequestOptions = {}): Promise<T> {
    if (this.latency > 0) await delay(this.latency);
    if (this.failRate > 0 && this.random() < this.failRate) {
      throw new LabApiError("Mock network failure", { status: 503, code: "mock_unavailable", detail: "تعذّر الاتصال بالخدمة التجريبية." });
    }

    const url = new URL(path, "http://mock.local");
    const route = ROUTES.find((candidate) => candidate.method === method && candidate.pattern.test(url.pathname));
    if (!route) {
      throw new LabApiError("Not found", { status: 404, code: "not_found", detail: `No mock route for ${method} ${url.pathname}` });
    }
    const match = route.pattern.exec(url.pathname);
    const params = (match?.slice(1) ?? []).map((value) => decodeURIComponent(value));
    const query: LabApiQuery = { ...options.query };
    for (const [key, value] of url.searchParams) query[key] = value;

    try {
      const result = await route.handler({
        db: this.db,
        params,
        query,
        body: options.body,
        context: { ...this.defaultContext, ...(options.context ?? {}) },
        now: this.now,
        random: this.random,
      });
      saveDb(this.storage, this.db);
      return result as T;
    } catch (error) {
      // Persist side effects that happened before a validation error (audit, status changes).
      saveDb(this.storage, this.db);
      throw error;
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(status: number, code: string, detail: string): never {
  throw new LabApiError(detail, { status, code, detail });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, key: string, fallback = ""): string {
  const item = asRecord(value)[key];
  return typeof item === "string" ? item : fallback;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function labSummary(record: LabRecord, db: MockDb): LabSummary {
  const attempts = db.attempts.filter((attempt) => attempt.slug === record.definition.slug);
  const best = attempts.reduce<number | null>((max, attempt) => (max == null || attempt.overall > max ? attempt.overall : max), null);
  return {
    lab_id: record.lab_id,
    slug: record.definition.slug,
    title: record.definition.title,
    tagline: record.definition.tagline,
    field_category_id: record.definition.field_category_id,
    category_name: record.definition.category_name,
    engine: record.definition.engine,
    skills: record.definition.skills,
    difficulty: record.definition.difficulty,
    minutes: record.definition.minutes,
    color: record.definition.color,
    status: record.definition.release.status,
    version: record.published_version,
    product_slugs: [
      ...(record.definition.recommendations.course_slugs ?? []),
      ...(record.definition.recommendations.diploma_slugs ?? []),
    ],
    attempt_count: attempts.length,
    best_score: best,
  };
}

function adminLab(record: LabRecord, db: MockDb): AdminLab {
  const attempts = db.attempts.filter((attempt) => attempt.slug === record.definition.slug);
  const sessions = db.sessions.filter((session) => session.lab_id === record.lab_id);
  const completed = sessions.filter((session) => session.status === "completed").length;
  const average = attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.overall, 0) / attempts.length : null;
  return {
    ...labSummary(record, db),
    draft_revision: record.draft_revision,
    published_version: record.published_version,
    created_at: record.created_at,
    updated_at: record.updated_at,
    published_at: record.published_at,
    release: record.definition.release,
    completion_rate: sessions.length ? Math.round((completed / sessions.length) * 100) : 0,
    avg_score: average == null ? null : Math.round(average),
  };
}

function runtime(record: LabRecord, definition = record.published_definition): LabRuntime {
  if (!definition) fail(404, "not_published", "This lab has no published version.");
  return {
    lab_id: record.lab_id,
    slug: definition.slug,
    version: record.published_version ?? 1,
    engine: definition.engine,
    title: definition.title,
    tagline: definition.tagline,
    role: definition.role,
    scenario: definition.scenario,
    targets: definition.targets,
    constraints: definition.constraints,
    field_category_id: definition.field_category_id,
    category_name: definition.category_name,
    skills: definition.skills,
    difficulty: definition.difficulty,
    minutes: definition.minutes,
    color: definition.color,
    phases: definition.phases.map((phase) => ({ id: phase.id, label: phase.label, type: phase.type })),
    // Public runtime: no hidden facts/triggers, no scoring rubric.
    personas: definition.personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      role: persona.role,
      tone: persona.tone,
      traits: persona.traits,
    })),
    fields: definition.fields.map((field) => {
      const copy = { ...field };
      delete copy.score;
      return copy;
    }),
    pathway: definition.pathway
      ? {
          ...definition.pathway,
          nodes: Object.fromEntries(
            Object.entries(definition.pathway.nodes).map(([id, node]) => [
              id,
              {
                ...node,
                choices: node.choices?.map((choice) => {
                  const copy = { ...choice };
                  delete copy.score;
                  return copy;
                }),
              },
            ]),
          ),
        }
      : null,
    requirements: definition.requirements,
    scoring: definition.scoring,
    recommendations: definition.recommendations,
    legacy_slug: definition.legacy_slug,
    locale: definition.locale,
  };
}

function publicRecord(db: MockDb, slug: string): LabRecord {
  const record = findLabBySlug(db, slug);
  if (!record || !record.published_definition || record.definition.release.status !== "published") {
    fail(404, "not_found", "المختبر غير موجود.");
  }
  if (record.definition.release.kill_switch) {
    fail(409, "disabled", "المختبر متوقف مؤقتًا.");
  }
  return record;
}

function labOr404(db: MockDb, labId: string): LabRecord {
  const record = findLabById(db, labId);
  if (!record) fail(404, "not_found", "المختبر غير موجود.");
  return record;
}

function requirementStatuses(definition: LabDefinitionPayload, context: MockContext): LabRequirementStatus[] {
  return definition.requirements.map((requirement) => requirementStatus(requirement, context));
}

function requirementStatus(requirement: LabRequirement, context: MockContext): LabRequirementStatus {
  const values = requirement.values ?? [];
  let satisfied = true;
  switch (requirement.type) {
    case "auth":
      satisfied = Boolean(context.customer_id);
      break;
    case "entitlement": {
      const owned = context.entitlements ?? [];
      satisfied = values.length === 0 ? owned.length > 0 : values.some((value) => owned.includes(value));
      break;
    }
    case "assignment": {
      const assigned = context.assignments ?? [];
      satisfied = values.length === 0 ? assigned.length > 0 : values.some((value) => assigned.includes(value));
      break;
    }
    case "date_window":
      satisfied = true;
      break;
    case "skill": {
      const skills = context.skills ?? [];
      satisfied = values.length === 0 ? skills.length > 0 : values.some((value) => skills.includes(value));
      break;
    }
    case "consent":
      satisfied = context.consent !== false;
      break;
    default:
      satisfied = true;
  }
  return {
    id: requirement.id,
    type: requirement.type,
    satisfied,
    reason: satisfied ? undefined : requirement.message?.ar ?? "هذا الشرط غير مستوفٍ.",
  };
}

function assertRequirements(definition: LabDefinitionPayload, context: MockContext): LabRequirementStatus[] {
  const statuses = requirementStatuses(definition, context);
  const blocked = definition.requirements.filter((requirement) => {
    const status = statuses.find((item) => item.id === requirement.id);
    return status && !status.satisfied && (requirement.on_fail ?? "block") === "block";
  });
  if (blocked.length) {
    throw new LabApiError("Requirements not met", {
      status: 403,
      code: "requirement_failed",
      detail: { code: "requirement_failed", requirements: statuses, message: "لا تستوفي شروط البدء." },
    });
  }
  return statuses;
}

function newSession(
  db: MockDb,
  record: LabRecord,
  definition: LabDefinitionPayload,
  context: MockContext,
  now: () => Date,
  random: () => number,
  preview: boolean,
): LabSessionRecord {
  const at = nowIso(now);
  const firstPhase = definition.pathway?.entry ?? definition.phases[0]?.id ?? null;
  const session: LabSessionRecord = {
    session_id: newId("sess"),
    lab_id: record.lab_id,
    lab_slug: definition.slug,
    lab_version: record.published_version ?? 1,
    customer_id: context.customer_id ?? null,
    anonymous_id: context.anonymous_id ?? newId("anon"),
    status: "in_progress",
    state: {
      phase_id: firstPhase,
      seq: 0,
      answers: {},
      facts: [],
      visited_nodes: firstPhase ? [firstPhase] : [],
      completed_phases: [],
      actions_count: 0,
    },
    seed: Math.floor(random() * 1_000_000_000),
    requirements: requirementStatuses(definition, context),
    started_at: at,
    updated_at: at,
    expires_at: new Date(now().getTime() + 2 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    preview,
    action_results: {},
  };
  db.sessions.push(session);
  recordEvent(db, session, "session.started", null, { preview });
  return session;
}

function assertSessionOwner(session: LabSessionRecord, context: MockContext): void {
  if (session.customer_id && context.customer_id && session.customer_id !== context.customer_id) {
    fail(403, "forbidden", "هذه الجلسة ليست لك.");
  }
}

function sessionOr404(db: MockDb, sessionId: string): LabSessionRecord {
  const session = db.sessions.find((item) => item.session_id === sessionId);
  if (!session) fail(404, "not_found", "الجلسة غير موجودة.");
  if (session.status !== "in_progress" && session.status !== "created") {
    if (session.status === "expired") fail(410, "session_expired", "انتهت صلاحية الجلسة.");
  }
  return session;
}

function recordEvent(
  db: MockDb,
  session: LabSessionRecord,
  type: string,
  phaseId: string | null,
  payload: Record<string, unknown> = {},
  attemptId: string | null = null,
): void {
  const events: LabEventRecord[] = db.events.filter((event) => event.session_id === session.session_id);
  db.events.push({
    event_id: newId("evt"),
    session_id: session.session_id,
    attempt_id: attemptId,
    seq: events.length,
    type,
    phase_id: phaseId ?? session.state.phase_id,
    node_id: typeof payload.node_id === "string" ? payload.node_id : null,
    at: new Date().toISOString(),
    payload,
  });
}

function actionPhase(action: LabAction, fallback: string | null): string | null {
  return "phase_id" in action ? action.phase_id : fallback;
}

function applyAction(
  db: MockDb,
  record: LabRecord,
  session: LabSessionRecord,
  action: LabAction,
  now: () => Date,
): { effects: Record<string, unknown> } {
  const definition = session.preview ? record.definition : record.published_definition ?? record.definition;
  const state = session.state;
  const effects: Record<string, unknown> = {};

  if (action.type === "phase.enter") {
    const exists = definition.phases.some((phase) => phase.id === action.phase_id) || Boolean(definition.pathway?.nodes[action.phase_id]);
    if (!exists) fail(422, "validation_failed", `المرحلة «${action.phase_id}» غير موجودة.`);
    if (state.phase_id && !state.completed_phases?.includes(state.phase_id)) {
      state.completed_phases = [...(state.completed_phases ?? []), state.phase_id];
    }
    state.phase_id = action.phase_id;
    state.visited_nodes = [...new Set([...(state.visited_nodes ?? []), action.phase_id])];
  } else if (action.type === "quiz.submit") {
    state.answers[`${action.phase}_quiz`] = action.answers;
  } else if (action.type === "dialogue.choose") {
    state.answers[`choice:${action.node_id}`] = action.choice_id;
    state.answers[`choice:${action.graph_id}:${action.node_id}`] = action.choice_id;
    state.answers.choices = { ...asRecord(state.answers.choices), [action.node_id]: action.choice_id };
    state.visited_nodes = [...new Set([...(state.visited_nodes ?? []), action.node_id])];
  } else if (action.type === "form.submit") {
    const node = definition.pathway?.nodes[action.phase_id];
    if (definition.engine === "schema" && node?.type === "form") {
      validateForm(node, definition, action.values);
    }
    state.answers.fields = { ...asRecord(state.answers.fields), ...action.values };
    state.answers[`form:${action.phase_id}`] = action.values;
    state.visited_nodes = [...new Set([...(state.visited_nodes ?? []), action.phase_id])];
  } else if (action.type === "simulator.step") {
    const history = Array.isArray(state.answers[`sim:${action.phase_id}`]) ? (state.answers[`sim:${action.phase_id}`] as unknown[]) : [];
    state.answers[`sim:${action.phase_id}`] = [...history, action.decision];
    state.visited_nodes = [...new Set([...(state.visited_nodes ?? []), action.phase_id])];
  } else if (action.type === "document.redline") {
    state.answers[`redline:${action.clause_id}`] = action.option_id;
    state.answers.redlines = { ...asRecord(state.answers.redlines), [action.clause_id]: action.option_id };
  } else if (action.type === "crm.update") {
    state.answers[`crm:${action.phase_id}`] = action.entry;
    state.answers.crm = action.entry;
  } else if (action.type === "commitment.set") {
    state.answers[`commitment:${action.phase_id}`] = action.value;
    state.answers.commitment = action.value;
  }

  const phaseId = actionPhase(action, state.phase_id);
  if (definition.pathway && phaseId) {
    const node = definition.pathway.nodes[phaseId];
    if (node?.next) effects.next = node.next;
  }

  state.seq += 1;
  state.actions_count += 1;
  session.updated_at = nowIso(now);
  recordEvent(db, session, `action.${action.type}`, phaseId, {
    ...action,
    node_id: "node_id" in action ? action.node_id : undefined,
  });
  return { effects };
}

function validateForm(node: LabPathwayNode, definition: LabDefinitionPayload, values: Record<string, unknown>): void {
  for (const fieldId of node.fields ?? []) {
    const field = definition.fields.find((item) => item.id === fieldId);
    if (!field) continue;
    const value = values[fieldId];
    const missing = value == null || value === "" || (Array.isArray(value) && value.length === 0);
    if (field.required && missing) fail(422, "validation_failed", `الحقل «${field.label.ar}» مطلوب.`);
    if (missing) continue;
    if (typeof value === "string" && field.validation?.max_length && value.length > field.validation.max_length) {
      fail(422, "validation_failed", `الحقل «${field.label.ar}» أطول من المسموح.`);
    }
    if ((field.type === "number" || field.type === "range") && numberValue(value) == null) {
      fail(422, "validation_failed", `الحقل «${field.label.ar}» يجب أن يكون رقمًا.`);
    }
    if (field.validation?.options && typeof value === "string" && !field.validation.options.some((option) => option.value === value)) {
      fail(422, "validation_failed", `قيمة «${field.label.ar}» غير صحيحة.`);
    }
  }
}

function complete(
  db: MockDb,
  record: LabRecord,
  session: LabSessionRecord,
  request: LabCompletionRequest,
  now: () => Date,
): LabCompletionResult {
  const existing = db.attempts.find((attempt) => attempt.session_id === session.session_id);
  if (existing) {
    return { attempt: publicAttempt(existing), scorecard: existing.scorecard, new_badges: existing.badges };
  }

  const definition = session.preview ? record.definition : record.published_definition ?? record.definition;
  const scored = scoreCompletion(definition, request);
  const at = nowIso(now);
  const previous = db.attempts.filter((attempt) => attempt.slug === definition.slug);
  const attemptNumber = previous.length + 1;
  const attemptedSlugs = db.attempts.map((attempt) => attempt.slug) as LabSlug[];
  const earned = earnedBadges(definition.slug as LabSlug, scored.scorecard, scored.signals, attemptedSlugs);
  const previousBadges = new Set(db.badges.map((badge) => badge.badge));
  const fresh = earned.filter((badge) => !previousBadges.has(badge));

  const attempt: LabAttemptRecord = {
    attempt_id: newId("att"),
    session_id: session.session_id,
    slug: definition.slug,
    at,
    overall: scored.scorecard.overall,
    readiness: scored.scorecard.readiness,
    dimensions: scored.scorecard.dimensions,
    xp: xpFor(scored.scorecard.overall, fresh.length),
    badges: fresh,
    category_legacy_id: definition.field_category_id,
    category_name: definition.category_name,
    minutes: Math.max(0, Math.round(request.elapsed_seconds / 60)),
    highlights: scored.scorecard.highlights,
    pre: request.pre,
    post: request.post,
    signals: scored.signals,
    attempt_no: attemptNumber,
    lab_version: session.lab_version,
    source: "lab",
    status: "scored",
    scorecard: scored.scorecard,
    customer_id: session.customer_id,
    anonymous_id: session.anonymous_id,
  };

  db.attempts.unshift(attempt);
  for (const badge of fresh) {
    db.badges.push({ badge, attempt_id: attempt.attempt_id, earned_at: at });
  }
  session.status = "completed";
  session.completed_at = at;
  session.updated_at = at;
  recordEvent(db, session, "session.completed", session.state.phase_id, { attempt_id: attempt.attempt_id }, attempt.attempt_id);
  return { attempt: publicAttempt(attempt), scorecard: scored.scorecard, new_badges: fresh };
}

function publicAttempt(record: LabAttemptRecord): LabAttempt {
  const copy = { ...record } as Record<string, unknown>;
  delete copy.scorecard;
  delete copy.customer_id;
  delete copy.anonymous_id;
  return copy as unknown as LabAttempt;
}

function attemptsFor(db: MockDb, context: MockContext): LabAttemptRecord[] {
  if (!context.customer_id) return db.attempts;
  return db.attempts.filter(
    (attempt) => attempt.customer_id === context.customer_id || attempt.customer_id === null,
  );
}

function recommendationSet(record: LabRecord): LabRecommendationSet {
  const cards = fixturesForCategory(record.definition.field_category_id);
  const byType = (type: string): CatalogCard[] => cards.filter((card) => card.product_type === type);
  return {
    courses: byType("course"),
    diplomas: byType("diploma"),
    packages: byType("package"),
    bundles: byType("bundle"),
    consultations: byType("consultation"),
    live_diplomas: byType("live_diploma"),
    subscriptions: byType("subscription"),
  };
}

function analytics(db: MockDb, record: LabRecord): LabAnalytics {
  const attempts = db.attempts.filter((attempt) => attempt.slug === record.definition.slug);
  const sessions = db.sessions.filter((session) => session.lab_id === record.lab_id);
  const completed = sessions.filter((session) => session.status === "completed");
  const events = db.events.filter((event) => sessions.some((session) => session.session_id === event.session_id));
  const funnel = record.definition.phases.map((phase) => {
    const entries = events.filter((event) => event.type === "action.phase.enter" && event.phase_id === phase.id).length;
    const nextIndex = record.definition.phases.findIndex((item) => item.id === phase.id) + 1;
    const next = record.definition.phases[nextIndex];
    const completions = next
      ? events.filter((event) => event.type === "action.phase.enter" && event.phase_id === next.id).length
      : completed.length;
    return {
      phase_id: phase.id,
      label: phase.label,
      entries,
      completions,
      drop_rate: entries ? Math.max(0, Math.round(((entries - completions) / entries) * 100)) : 0,
    };
  });
  const branchMap = new Map<string, Map<string, number>>();
  for (const event of events) {
    if (!event.node_id) continue;
    const choice = event.payload.choice_id;
    if (typeof choice !== "string") continue;
    const choices = branchMap.get(event.node_id) ?? new Map<string, number>();
    choices.set(choice, (choices.get(choice) ?? 0) + 1);
    branchMap.set(event.node_id, choices);
  }
  return {
    lab_id: record.lab_id,
    lab_slug: record.definition.slug,
    attempts: attempts.length,
    completions: completed.length,
    completion_rate: sessions.length ? Math.round((completed.length / sessions.length) * 100) : 0,
    avg_score: attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.overall, 0) / attempts.length) : null,
    avg_minutes: attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.minutes, 0) / attempts.length) : null,
    funnel,
    branches: [...branchMap].map(([nodeId, choices]) => ({
      node_id: nodeId,
      label: record.definition.pathway?.nodes[nodeId]?.title?.ar ?? nodeId,
      visits: [...choices.values()].reduce((sum, count) => sum + count, 0),
      choices: [...choices].map(([choiceId, count]) => ({ choice_id: choiceId, label: choiceId, count })),
    })),
    dimensions: record.definition.scoring.dimensions.map((dimension) => {
      const values = attempts.flatMap((attempt) => attempt.dimensions.filter((item) => item.key === dimension.key).map((item) => item.score));
      return {
        key: dimension.key,
        label: dimension.label.ar,
        average: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
      };
    }),
    signals: Object.entries(
      attempts.reduce<Record<string, number>>((acc, attempt) => {
        for (const [key, value] of Object.entries(attempt.signals)) {
          if (value) acc[key] = (acc[key] ?? 0) + 1;
        }
        return acc;
      }, {}),
    ).map(([key, count]) => ({ key, count })),
  };
}

function validationResponse(definition: LabDefinitionPayload): LabValidation {
  return validateLabDefinition(definition);
}

function draftResponse(record: LabRecord, db: MockDb): LabDraft {
  return {
    lab: adminLab(record, db),
    definition: record.definition,
    published_definition: record.published_definition,
    has_unpublished_changes: JSON.stringify(record.definition) !== JSON.stringify(record.published_definition),
  };
}

function createDraft(definition: LabDefinitionPayload, now: () => Date): LabRecord {
  const draft = clone(definition);
  draft.release = { ...draft.release, status: "draft", rollout_pct: 0 };
  return labRecord(draft, now, false);
}

function addVersion(record: LabRecord, now: () => Date): LabVersionRecord {
  const version = record.current_version + 1;
  const published = clone(record.definition);
  published.release = { ...published.release, status: "published" };
  const entry: LabVersionRecord = {
    lab_id: record.lab_id,
    version,
    definition: clone(published),
    published_at: nowIso(now),
    published_by: "mock-admin",
    checksum: checksum(published),
  };
  record.current_version = version;
  record.published_version = version;
  record.published_definition = clone(published);
  record.published_at = entry.published_at;
  record.definition.release = { ...published.release };
  record.updated_at = entry.published_at;
  return entry;
}

function generationDraft(request: LabGenerationRequest, now: () => Date): LabDefinitionPayload {
  const base = clone(schemaFixtures[2]);
  base.slug = `generated-${now().getTime().toString(36)}`;
  base.title = request.prompt.trim().slice(0, 120) || "مختبر مولّد";
  base.tagline = "مسودة مولّدة آليًا للمراجعة قبل النشر.";
  base.field_category_id = request.field_category_id ?? base.field_category_id;
  base.category_name = request.category_name ?? base.category_name;
  base.difficulty = request.difficulty ?? base.difficulty;
  base.minutes = request.minutes ?? base.minutes;
  base.locale = request.locale ?? "ar";
  base.release = { status: "draft", locales: [base.locale], starts_at: null, ends_at: null, rollout_pct: 0 };
  return base;
}

const ROUTES: Route[] = [
  // ── public ────────────────────────────────────────────────────────────────────────────────
  {
    method: "GET",
    pattern: /^\/labs$/,
    handler: ({ db, query }) => {
      const field = query.field != null ? Number(query.field) : null;
      const q = typeof query.q === "string" ? query.q.toLowerCase() : null;
      const items = db.labs
        .filter((record) => record.published_definition && record.definition.release.status === "published")
        .filter((record) => (field == null || record.definition.field_category_id === field))
        .filter((record) => (q ? `${record.definition.title} ${record.definition.tagline}`.toLowerCase().includes(q) : true))
        .map((record) => labSummary(record, db));
      return { items, total: items.length } satisfies LabList;
    },
  },
  {
    method: "GET",
    pattern: /^\/labs\/([^/]+)$/,
    handler: ({ db, params, query }) => {
      if (query.preview === "1" || query.preview === 1) {
        const record = findLabBySlug(db, params[0]);
        if (!record) fail(404, "not_found", "المختبر غير موجود.");
        return runtime(record, record.definition);
      }
      return runtime(publicRecord(db, params[0]));
    },
  },
  {
    method: "GET",
    pattern: /^\/labs\/([^/]+)\/recommendations$/,
    handler: ({ db, params }) => recommendationSet(publicRecord(db, params[0])),
  },
  {
    method: "POST",
    pattern: /^\/labs\/([^/]+)\/sessions$/,
    handler: ({ db, params, body, context, now, random }) => {
      const preview = asRecord(body).preview === true;
      const record = preview ? findLabBySlug(db, params[0]) : publicRecord(db, params[0]);
      if (!record) fail(404, "not_found", "المختبر غير موجود.");
      const definition = preview ? record.definition : record.published_definition!;
      const requirements = preview ? requirementStatuses(definition, context) : assertRequirements(definition, context);
      const session = newSession(db, record, definition, context, now, random, preview);
      session.requirements = requirements;
      return session;
    },
  },

  // ── customer sessions ─────────────────────────────────────────────────────────────────────
  {
    method: "GET",
    pattern: /^\/me\/labs\/sessions\/([^/]+)$/,
    handler: ({ db, params, context }) => {
      const session = db.sessions.find((item) => item.session_id === params[0]);
      if (!session) fail(404, "not_found", "الجلسة غير موجودة.");
      assertSessionOwner(session, context);
      return session;
    },
  },
  {
    method: "POST",
    pattern: /^\/me\/labs\/sessions\/([^/]+)\/actions$/,
    handler: ({ db, params, body, context, now }) => {
      const session = sessionOr404(db, params[0]);
      assertSessionOwner(session, context);
      const request = body as LabActionRequest;
      if (!request?.client_action_id || !request.action) fail(422, "validation_failed", "طلب الإجراء غير صحيح.");
      const previous = session.action_results[request.client_action_id];
      if (previous) return { ...previous, session };
      if (request.seq !== session.state.seq) {
        fail(409, "sequence_conflict", `التسلسل غير متطابق (${request.seq} مقابل ${session.state.seq}).`);
      }
      const record = labOr404(db, session.lab_id);
      const { effects } = applyAction(db, record, session, request.action, now);
      session.action_results[request.client_action_id] = { accepted: true, effects };
      return { accepted: true, session, effects };
    },
  },
  {
    method: "POST",
    pattern: /^\/me\/labs\/sessions\/([^/]+)\/complete$/,
    handler: ({ db, params, body, context, now }) => {
      const session = sessionOr404(db, params[0]);
      assertSessionOwner(session, context);
      const record = labOr404(db, session.lab_id);
      return complete(db, record, session, body as LabCompletionRequest, now);
    },
  },
  {
    method: "POST",
    pattern: /^\/me\/labs\/sessions\/([^/]+)\/abandon$/,
    handler: ({ db, params, context, now }) => {
      const session = sessionOr404(db, params[0]);
      assertSessionOwner(session, context);
      session.status = "abandoned";
      session.updated_at = nowIso(now);
      session.completed_at = session.updated_at;
      recordEvent(db, session, "session.abandoned", session.state.phase_id);
      return { ok: true, session };
    },
  },

  // ── customer attempts / insights ───────────────────────────────────────────────────────────
  {
    method: "GET",
    pattern: /^\/me\/labs\/attempts$/,
    handler: ({ db, context }) => {
      const items = attemptsFor(db, context).map(publicAttempt);
      return { items, total: items.length } satisfies LabAttemptList;
    },
  },
  {
    method: "GET",
    pattern: /^\/me\/labs\/attempts\/([^/]+)$/,
    handler: ({ db, params }) => {
      const attempt = db.attempts.find((item) => item.attempt_id === params[0]);
      if (!attempt) fail(404, "not_found", "المحاولة غير موجودة.");
      return publicAttempt(attempt);
    },
  },
  {
    method: "GET",
    pattern: /^\/me\/labs\/insights$/,
    handler: ({ db, context }) => {
      const attempts = attemptsFor(db, context);
      const badges = [...new Set(db.badges.map((badge) => badge.badge))] as BadgeId[];
      return {
        attempts: attempts.map(publicAttempt),
        total_attempts: attempts.length,
        labs_completed: new Set(attempts.map((attempt) => attempt.slug)).size,
        total_minutes: attempts.reduce((sum, attempt) => sum + attempt.minutes, 0),
        total_xp: attempts.reduce((sum, attempt) => sum + attempt.xp, 0),
        badges,
        average: attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.overall, 0) / attempts.length) : null,
      } satisfies LabInsights;
    },
  },
  {
    method: "GET",
    pattern: /^\/me\/labs\/portfolio$/,
    handler: ({ db, context }) => {
      const attempts = attemptsFor(db, context);
      return {
        attempts: attempts.map(publicAttempt),
        badges: [...new Set(db.badges.map((badge) => badge.badge))],
        generated_at: nowIso(() => new Date()),
      };
    },
  },
  {
    method: "POST",
    pattern: /^\/me\/labs\/demo$/,
    handler: ({ db, context, now }) => {
      const at = nowIso(now);
      const demo = [
        { slug: "marketing-ads", overall: 58, minutes: 14, dimensions: 3 },
        { slug: "sales-discovery-call", overall: 71, minutes: 12, dimensions: 5 },
        { slug: "support-angry-customer", overall: 76, minutes: 10, dimensions: 4 },
        { slug: "hr-conflict-mediation", overall: 64, minutes: 11, dimensions: 3 },
        { slug: "ceo-competitor-response", overall: 80, minutes: 15, dimensions: 3 },
      ];
      for (const [index, item] of demo.entries()) {
        const definition = db.labs.find((record) => record.definition.slug === item.slug)?.definition;
        if (!definition) continue;
        const dimensions = definition.skills.slice(0, item.dimensions).map((skill) => ({
          key: `${skill}-demo`,
          label: skill,
          score: item.overall,
          weight: 1,
          skill,
          praise: "أداء تجريبي.",
          tip: "جرّب المختبر الحقيقي.",
        }));
        const scorecard: Scorecard = {
          overall: item.overall,
          readiness: item.overall >= 80 ? "متميّز" : item.overall >= 60 ? "جاهز" : "مبتدئ",
          dimensions,
          highlights: [],
          strengths: [],
          tips: [],
          verdict: "محاولة تجريبية لعرض التقرير.",
        };
        db.attempts.unshift({
          attempt_id: newId("att"),
          session_id: newId("sess"),
          slug: item.slug,
          at: new Date(now().getTime() - index * 86_400_000).toISOString(),
          overall: item.overall,
          readiness: scorecard.readiness,
          dimensions,
          xp: xpFor(item.overall, 0),
          badges: [],
          category_legacy_id: definition.field_category_id,
          category_name: definition.category_name,
          minutes: item.minutes,
          highlights: [],
          pre: null,
          post: null,
          signals: {},
          attempt_no: 1,
          lab_version: 1,
          source: "demo",
          status: "scored",
          scorecard,
          customer_id: context.customer_id ?? null,
          anonymous_id: context.anonymous_id ?? "mock-anonymous",
        });
      }
      db.meta.demo_seeded_at = at;
      return { ok: true, attempts: attemptsFor(db, context).length };
    },
  },
  {
    method: "DELETE",
    pattern: /^\/me\/labs\/attempts$/,
    handler: ({ db, context }) => {
      const owned = new Set(attemptsFor(db, context).map((attempt) => attempt.attempt_id));
      db.attempts = db.attempts.filter((attempt) => !owned.has(attempt.attempt_id));
      db.badges = db.badges.filter((badge) => !owned.has(badge.attempt_id));
      db.events = db.events.filter((event) => !event.attempt_id || !owned.has(event.attempt_id));
      return { ok: true };
    },
  },

  // ── admin: labs ────────────────────────────────────────────────────────────────────────────
  {
    method: "GET",
    pattern: /^\/admin\/labs$/,
    handler: ({ db, query }) => {
      const status = typeof query.status === "string" ? query.status : null;
      const q = typeof query.q === "string" ? query.q.toLowerCase() : null;
      const items = db.labs
        .filter((record) => (status ? record.definition.release.status === status : true))
        .filter((record) => (q ? `${record.definition.title} ${record.definition.slug}`.toLowerCase().includes(q) : true))
        .map((record) => adminLab(record, db));
      return { items, total: items.length } satisfies AdminLabList;
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs$/,
    handler: ({ db, body, now }) => {
      const input = asRecord(body);
      const definition = (input.definition as LabDefinitionPayload | undefined) ?? clone(schemaFixtures[0]);
      if (!definition) fail(422, "validation_failed", "تعريف المختبر مطلوب.");
      if (!input.definition) {
        definition.slug = `lab-${now().getTime().toString(36)}`;
        definition.title = "مختبر جديد";
      }
      if (findLabBySlug(db, definition.slug)) fail(409, "conflict", "الـslug مستخدم.");
      const record = createDraft(definition, now);
      db.labs.push(record);
      audit(db, "mock-admin", "lab.create", record.lab_id, null, record.definition);
      return adminLab(record, db);
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/overview$/,
    handler: ({ db }) => {
      const sessions = db.sessions.length;
      const completed = db.sessions.filter((session) => session.status === "completed").length;
      return {
        labs: db.labs.length,
        published: db.labs.filter((record) => record.definition.release.status === "published").length,
        drafts: db.labs.filter((record) => record.definition.release.status === "draft").length,
        attempts: db.attempts.length,
        completion_rate: sessions ? Math.round((completed / sessions) * 100) : 0,
        avg_score: db.attempts.length ? Math.round(db.attempts.reduce((sum, attempt) => sum + attempt.overall, 0) / db.attempts.length) : null,
      } satisfies LabOverview;
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/templates$/,
    handler: () => schemaFixtures.map((definition) => ({ slug: definition.slug, title: definition.title, field_category_id: definition.field_category_id })),
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/fields$/,
    handler: () => ["text", "textarea", "number", "range", "select", "multiselect", "checkbox", "radio", "table", "allocation", "document", "chat"],
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/attempts\/([^/]+)$/,
    handler: ({ db, params }) => {
      const attempt = db.attempts.find((item) => item.attempt_id === params[0]);
      if (!attempt) fail(404, "not_found", "المحاولة غير موجودة.");
      return attempt;
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/attempts\/([^/]+)\/(flag|reset|override-score)$/,
    handler: ({ db, params, body }) => {
      const attempt = db.attempts.find((item) => item.attempt_id === params[0]);
      if (!attempt) fail(404, "not_found", "المحاولة غير موجودة.");
      const action = params[1];
      if (action === "flag") attempt.status = "flagged";
      if (action === "reset") attempt.status = "voided";
      if (action === "override-score") {
        const value = numberValue(asRecord(body).overall);
        if (value == null) fail(422, "validation_failed", "الدرجة مطلوبة.");
        attempt.overall = Math.max(0, Math.min(100, value));
        attempt.scorecard = { ...attempt.scorecard, overall: attempt.overall };
        attempt.status = "overridden";
      }
      audit(db, "mock-admin", `attempt.${action}`, null, null, { attempt_id: attempt.attempt_id }, attempt.attempt_id);
      return attempt;
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)$/,
    handler: ({ db, params }) => {
      const record = labOr404(db, params[0]);
      const draft: LabDraft = {
        lab: adminLab(record, db),
        definition: record.definition,
        published_definition: record.published_definition,
        has_unpublished_changes: JSON.stringify(record.definition) !== JSON.stringify(record.published_definition),
      };
      return draft;
    },
  },
  {
    method: "PATCH",
    pattern: /^\/admin\/labs\/([^/]+)$/,
    handler: ({ db, params, body, now }) => {
      const record = labOr404(db, params[0]);
      const patch = asRecord(asRecord(body).definition);
      record.definition = { ...record.definition, ...(patch as Partial<LabDefinitionPayload>) };
      record.draft_revision += 1;
      record.updated_at = nowIso(now);
      audit(db, "mock-admin", "lab.update", record.lab_id, null, patch);
      return adminLab(record, db);
    },
  },
  {
    method: "DELETE",
    pattern: /^\/admin\/labs\/([^/]+)$/,
    handler: ({ db, params, now }) => {
      const record = labOr404(db, params[0]);
      record.definition.release.status = "archived";
      record.published_definition = null;
      record.published_version = null;
      record.updated_at = nowIso(now);
      audit(db, "mock-admin", "lab.archive", record.lab_id, null, null);
      return { ok: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/draft$/,
    handler: ({ db, params }) => {
      const record = labOr404(db, params[0]);
      return draftResponse(record, db);
    },
  },
  {
    method: "PUT",
    pattern: /^\/admin\/labs\/([^/]+)\/draft$/,
    handler: ({ db, params, body, now }) => {
      const record = labOr404(db, params[0]);
      const input = asRecord(body);
      const base = numberValue(input.base_revision);
      if (base == null || base !== record.draft_revision) {
        fail(409, "conflict", `تعارض في التعديل (${base ?? "?"} مقابل ${record.draft_revision}).`);
      }
      const definition = input.definition as LabDefinitionPayload | undefined;
      if (!definition) fail(422, "validation_failed", "تعريف المختبر مطلوب.");
      record.definition = definition;
      record.draft_revision += 1;
      record.updated_at = nowIso(now);
      audit(db, "mock-admin", "lab.draft.save", record.lab_id, null, { revision: record.draft_revision });
      return draftResponse(record, db);
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/validate$/,
    handler: ({ db, params }) => validationResponse(labOr404(db, params[0]).definition),
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/publish$/,
    handler: ({ db, params, now }) => {
      const record = labOr404(db, params[0]);
      const validation = validationResponse(record.definition);
      if (!validation.valid) fail(422, "validation_failed", validation.errors.join(" "));
      const entry = addVersion(record, now);
      db.versions.push(entry);
      audit(db, "mock-admin", "lab.publish", record.lab_id, null, { version: entry.version });
      return adminLab(record, db);
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/unpublish$/,
    handler: ({ db, params, now }) => {
      const record = labOr404(db, params[0]);
      record.definition.release.status = "paused";
      record.updated_at = nowIso(now);
      audit(db, "mock-admin", "lab.unpublish", record.lab_id, null, null);
      return adminLab(record, db);
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/archive$/,
    handler: ({ db, params, now }) => {
      const record = labOr404(db, params[0]);
      record.definition.release.status = "archived";
      record.updated_at = nowIso(now);
      audit(db, "mock-admin", "lab.archive", record.lab_id, null, null);
      return adminLab(record, db);
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/duplicate$/,
    handler: ({ db, params, now }) => {
      const source = labOr404(db, params[0]);
      const copy = clone(source.definition);
      const base = `${source.definition.slug}-copy`;
      copy.slug = findLabBySlug(db, base) ? `${base}-${now().getTime().toString(36)}` : base;
      copy.title = `${source.definition.title} (نسخة)`;
      const record = createDraft(copy, now);
      db.labs.push(record);
      audit(db, "mock-admin", "lab.duplicate", record.lab_id, null, { source: source.lab_id });
      return adminLab(record, db);
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/versions$/,
    handler: ({ db, params }) =>
      db.versions
        .filter((version) => version.lab_id === params[0])
        .sort((a, b) => b.version - a.version)
        .map((version) => ({ ...version, definition: version.definition })) satisfies LabVersion[],
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/versions\/(\d+)$/,
    handler: ({ db, params }) => {
      const version = db.versions.find((item) => item.lab_id === params[0] && item.version === Number(params[1]));
      if (!version) fail(404, "not_found", "الإصدار غير موجود.");
      return version;
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/versions\/(\d+)\/restore$/,
    handler: ({ db, params, now }) => {
      const record = labOr404(db, params[0]);
      const version = db.versions.find((item) => item.lab_id === params[0] && item.version === Number(params[1]));
      if (!version) fail(404, "not_found", "الإصدار غير موجود.");
      record.definition = clone(version.definition);
      record.definition.release = { ...record.definition.release, status: "draft", rollout_pct: 0 };
      record.draft_revision += 1;
      record.updated_at = nowIso(now);
      audit(db, "mock-admin", "lab.version.restore", record.lab_id, null, { version: version.version });
      return draftResponse(record, db);
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/preview$/,
    handler: ({ db, params, now }) => {
      const record = labOr404(db, params[0]);
      const expires = new Date(now().getTime() + 30 * 60 * 1000).toISOString();
      const token = btoa(JSON.stringify({ lab_id: record.lab_id, version: record.draft_revision, exp: expires }));
      return { token, path: `/labs/preview/${record.definition.slug}?token=${encodeURIComponent(token)}`, expires_at: expires } satisfies LabPreviewToken;
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/analytics$/,
    handler: ({ db, params }) => analytics(db, labOr404(db, params[0])),
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/attempts$/,
    handler: ({ db, params }) => {
      const record = labOr404(db, params[0]);
      const items = db.attempts.filter((attempt) => attempt.slug === record.definition.slug);
      return { items, total: items.length } satisfies LabAttemptList;
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/assignments$/,
    handler: ({ db, params }) => db.assignments.filter((assignment) => assignment.lab_id === params[0]),
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/assignments$/,
    handler: ({ db, params, body, now }) => {
      labOr404(db, params[0]);
      const input = asRecord(body);
      const assignment: LabAssignment = {
        assignment_id: newId("asg"),
        lab_id: params[0],
        scope_type: (input.scope_type as LabAssignment["scope_type"]) ?? "cohort",
        scope_id: typeof input.scope_id === "string" ? input.scope_id : "mock-cohort",
        due_at: typeof input.due_at === "string" ? input.due_at : null,
        required: input.required !== false,
        created_at: nowIso(now),
      };
      db.assignments.push(assignment);
      audit(db, "mock-admin", "lab.assignment.create", params[0], null, assignment);
      return assignment;
    },
  },
  {
    method: "DELETE",
    pattern: /^\/admin\/labs\/([^/]+)\/assignments\/([^/]+)$/,
    handler: ({ db, params }) => {
      const before = db.assignments.length;
      db.assignments = db.assignments.filter((assignment) => !(assignment.lab_id === params[0] && assignment.assignment_id === params[1]));
      if (db.assignments.length === before) fail(404, "not_found", "التكليف غير موجود.");
      return { ok: true };
    },
  },
  {
    method: "PUT",
    pattern: /^\/admin\/labs\/([^/]+)\/release$/,
    handler: ({ db, params, body, now }) => {
      const record = labOr404(db, params[0]);
      record.definition.release = { ...record.definition.release, ...(asRecord(body) as Partial<LabDefinitionPayload["release"]>) };
      record.updated_at = nowIso(now);
      audit(db, "mock-admin", "lab.release.update", record.lab_id, null, record.definition.release);
      return adminLab(record, db);
    },
  },

  // ── admin: generation / assets / import-export ────────────────────────────────────────────
  {
    method: "POST",
    pattern: /^\/admin\/labs\/generate$/,
    handler: ({ db, body, now }) => {
      const request = asRecord(body) as unknown as LabGenerationRequest;
      if (!request.prompt || !request.prompt.trim()) fail(422, "validation_failed", "الوصف مطلوب.");
      const job: LabGenerationJob = {
        job_id: newId("job"),
        status: "succeeded",
        prompt: request.prompt,
        draft: generationDraft(request, now),
        error: null,
        created_at: nowIso(now),
      };
      db.generation_jobs.unshift(job);
      return job;
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/generate\/([^/]+)$/,
    handler: ({ db, params }) => {
      const job = db.generation_jobs.find((item) => item.job_id === params[0]);
      if (!job) fail(404, "not_found", "المهمة غير موجودة.");
      return job;
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/generate\/([^/]+)\/apply$/,
    handler: ({ db, params, now }) => {
      const job = db.generation_jobs.find((item) => item.job_id === params[0]);
      if (!job?.draft) fail(404, "not_found", "لا توجد مسودة جاهزة.");
      if (findLabBySlug(db, job.draft.slug)) job.draft.slug = `${job.draft.slug}-${now().getTime().toString(36)}`;
      const record = createDraft(job.draft, now);
      db.labs.push(record);
      audit(db, "mock-admin", "lab.generate.apply", record.lab_id, null, { job_id: job.job_id });
      return adminLab(record, db);
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/assets\/upload-url$/,
    handler: ({ db, params, body }) => {
      labOr404(db, params[0]);
      const filename = text(body, "filename", "asset");
      return {
        upload_url: `data:text/plain;charset=utf-8,${encodeURIComponent(filename)}`,
        key: `mock/${params[0]}/${filename}`,
        method: "PUT",
        headers: {},
      };
    },
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/assets$/,
    handler: ({ db, params, body, now }) => {
      labOr404(db, params[0]);
      const asset: LabAsset = {
        asset_id: newId("asset"),
        lab_id: params[0],
        url: typeof asRecord(body).url === "string" ? String(asRecord(body).url) : "https://example.com/mock-asset.png",
        filename: text(body, "filename", "asset"),
        content_type: text(body, "content_type", "application/octet-stream"),
        size_bytes: numberValue(asRecord(body).size_bytes) ?? 0,
        alt_text: typeof asRecord(body).alt_text === "string" ? String(asRecord(body).alt_text) : null,
        created_at: nowIso(now),
      };
      db.assets.push(asset);
      return asset;
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/assets$/,
    handler: ({ db, params }) => db.assets.filter((asset) => asset.lab_id === params[0]),
  },
  {
    method: "DELETE",
    pattern: /^\/admin\/labs\/([^/]+)\/assets\/([^/]+)$/,
    handler: ({ db, params }) => {
      const before = db.assets.length;
      db.assets = db.assets.filter((asset) => !(asset.lab_id === params[0] && asset.asset_id === params[1]));
      if (db.assets.length === before) fail(404, "not_found", "الملف غير موجود.");
      return { ok: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/admin\/labs\/([^/]+)\/export$/,
    handler: ({ db, params }) => labOr404(db, params[0]).definition,
  },
  {
    method: "POST",
    pattern: /^\/admin\/labs\/([^/]+)\/import$/,
    handler: ({ db, params, body, now }) => {
      labOr404(db, params[0]);
      const definition = asRecord(body).definition as LabDefinitionPayload | undefined;
      if (!definition) fail(422, "validation_failed", "التعريف مطلوب.");
      const record = createDraft(definition, now);
      db.labs.push(record);
      return adminLab(record, db);
    },
  },
];

/** Singleton used by the client. Tests construct their own server with memory storage. */
let singleton: MockLabsServer | null = null;

function numberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getMockLabsServer(context?: MockContext): MockLabsServer {
  singleton ??= new MockLabsServer({
    context,
    latency_ms: numberEnv(process.env.NEXT_PUBLIC_LABS_MOCK_LATENCY_MS, 120),
    fail_rate: numberEnv(process.env.NEXT_PUBLIC_LABS_MOCK_FAIL_RATE, 0),
  });
  return singleton;
}

export function resetMockLabsServerForTests(): void {
  singleton = null;
}
