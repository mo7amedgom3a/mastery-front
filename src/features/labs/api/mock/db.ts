/**
 * The mock database: labs (draft + published), sessions, attempts, events, badges, assignments,
 * generation jobs, assets and an audit trail. Everything is JSON; the dataset is small enough to
 * read/modify/write as a whole per request.
 */
import type { Scorecard } from "../../model/types";
import type {
  LabActionResult,
  LabAsset,
  LabAssignment,
  LabAttempt,
  LabDefinitionPayload,
  LabGenerationJob,
  LabSession,
} from "../contract";
import { initialDefinitions } from "./seed";
import { LABS_DB_KEY, type LabStorage } from "./storage";

export type LabRecord = {
  lab_id: string;
  definition: LabDefinitionPayload;
  published_definition: LabDefinitionPayload | null;
  published_version: number | null;
  current_version: number;
  draft_revision: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string;
};

export type LabSessionRecord = LabSession & {
  /** Stored without the session itself; a replay returns the current session. */
  action_results: Record<string, Omit<LabActionResult, "session">>;
};

export type LabAttemptRecord = LabAttempt & {
  scorecard: Scorecard;
  customer_id: string | null;
  anonymous_id: string;
};

export type LabVersionRecord = {
  lab_id: string;
  version: number;
  definition: LabDefinitionPayload;
  published_at: string;
  published_by: string;
  checksum: string;
};

export type LabEventRecord = {
  event_id: string;
  session_id: string;
  attempt_id: string | null;
  seq: number;
  type: string;
  phase_id: string | null;
  node_id: string | null;
  at: string;
  payload: Record<string, unknown>;
};

export type BadgeRecord = {
  badge: string;
  attempt_id: string;
  earned_at: string;
};

export type AuditRecord = {
  audit_id: string;
  at: string;
  actor: string;
  action: string;
  lab_id: string | null;
  attempt_id: string | null;
  before: unknown;
  after: unknown;
};

export type MockDb = {
  schema_version: 1;
  labs: LabRecord[];
  versions: LabVersionRecord[];
  sessions: LabSessionRecord[];
  attempts: LabAttemptRecord[];
  events: LabEventRecord[];
  badges: BadgeRecord[];
  assignments: LabAssignment[];
  generation_jobs: LabGenerationJob[];
  assets: LabAsset[];
  audit: AuditRecord[];
  meta: {
    seeded_at: string;
    legacy_imported?: boolean;
    demo_seeded_at?: string;
  };
};

const MAX_ATTEMPTS = 500;
const MAX_SESSIONS = 200;
const MAX_EVENTS_PER_SESSION = 500;
const MAX_AUDIT = 500;

export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(now: () => Date = () => new Date()): string {
  return now().toISOString();
}

export function checksum(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function emptyDb(now: () => Date): MockDb {
  return {
    schema_version: 1,
    labs: [],
    versions: [],
    sessions: [],
    attempts: [],
    events: [],
    badges: [],
    assignments: [],
    generation_jobs: [],
    assets: [],
    audit: [],
    meta: { seeded_at: nowIso(now) },
  };
}

export function labRecord(definition: LabDefinitionPayload, now: () => Date, published: boolean): LabRecord {
  const at = nowIso(now);
  const version = published ? 1 : 0;
  return {
    lab_id: newId("lab"),
    definition,
    published_definition: published ? clone(definition) : null,
    published_version: published ? version : null,
    current_version: version,
    draft_revision: 1,
    created_at: at,
    updated_at: at,
    published_at: published ? at : null,
    created_by: "mock-admin",
  };
}

export function seedDb(db: MockDb, now: () => Date): MockDb {
  if (db.labs.length) return topUpDb(db, now);
  for (const definition of initialDefinitions()) {
    const record = labRecord(definition, now, definition.release.status === "published");
    db.labs.push(record);
    if (record.published_version != null && record.published_definition) {
      db.versions.push({
        lab_id: record.lab_id,
        version: record.published_version,
        definition: clone(record.published_definition),
        published_at: record.published_at ?? nowIso(now),
        published_by: "mock-admin",
        checksum: checksum(record.published_definition),
      });
    }
  }
  return db;
}

/**
 * Older saved DBs predate labs added since: add missing shipped labs, and let a shipped (legacy)
 * lab take back its slug from an older schema fixture that used it.
 */
function topUpDb(db: MockDb, now: () => Date): MockDb {
  for (const definition of initialDefinitions()) {
    const existing = db.labs.find((record) => record.definition.slug === definition.slug);
    if (existing && (definition.engine !== "legacy" || existing.definition.engine === "legacy")) continue;
    if (existing) db.labs = db.labs.filter((record) => record !== existing);
    const record = labRecord(definition, now, definition.release.status === "published");
    db.labs.push(record);
    if (record.published_version != null && record.published_definition) {
      db.versions.push({
        lab_id: record.lab_id,
        version: record.published_version,
        definition: clone(record.published_definition),
        published_at: record.published_at ?? nowIso(now),
        published_by: "mock-admin",
        checksum: checksum(record.published_definition),
      });
    }
  }
  return db;
}

export function loadDb(storage: LabStorage, now: () => Date): MockDb {
  const raw = storage.getItem(LABS_DB_KEY);
  if (!raw) {
    const seeded = seedDb(emptyDb(now), now);
    saveDb(storage, seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as MockDb;
    if (!parsed || parsed.schema_version !== 1 || !Array.isArray(parsed.labs)) {
      const seeded = seedDb(emptyDb(now), now);
      saveDb(storage, seeded);
      return seeded;
    }
    // Fill fields that older mock DBs may not have.
    parsed.versions ??= [];
    parsed.sessions ??= [];
    parsed.attempts ??= [];
    parsed.events ??= [];
    parsed.badges ??= [];
    parsed.assignments ??= [];
    parsed.generation_jobs ??= [];
    parsed.assets ??= [];
    parsed.audit ??= [];
    parsed.meta ??= { seeded_at: nowIso(now) };
    return seedDb(parsed, now);
  } catch {
    const seeded = seedDb(emptyDb(now), now);
    saveDb(storage, seeded);
    return seeded;
  }
}

export function saveDb(storage: LabStorage, db: MockDb): void {
  pruneDb(db);
  storage.setItem(LABS_DB_KEY, JSON.stringify(db));
}

export function pruneDb(db: MockDb): void {
  db.attempts.sort((a, b) => b.at.localeCompare(a.at));
  if (db.attempts.length > MAX_ATTEMPTS) db.attempts.length = MAX_ATTEMPTS;
  const keptAttempts = new Set(db.attempts.map((attempt) => attempt.attempt_id));

  db.sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (db.sessions.length > MAX_SESSIONS) db.sessions.length = MAX_SESSIONS;

  const keptSessions = new Set(db.sessions.map((session) => session.session_id));
  db.events = db.events.filter((event) => keptSessions.has(event.session_id) && (!event.attempt_id || keptAttempts.has(event.attempt_id)));

  const perSession = new Map<string, number>();
  db.events = db.events.filter((event) => {
    const count = perSession.get(event.session_id) ?? 0;
    if (count >= MAX_EVENTS_PER_SESSION) return false;
    perSession.set(event.session_id, count + 1);
    return true;
  });

  const keptBadges = new Set(db.attempts.map((attempt) => attempt.attempt_id));
  db.badges = db.badges.filter((badge) => keptBadges.has(badge.attempt_id));

  if (db.audit.length > MAX_AUDIT) db.audit = db.audit.slice(-MAX_AUDIT);
}

export function findLabBySlug(db: MockDb, slug: string): LabRecord | undefined {
  return db.labs.find((lab) => lab.definition.slug === slug);
}

export function findLabById(db: MockDb, labId: string): LabRecord | undefined {
  return db.labs.find((lab) => lab.lab_id === labId);
}

export function publishedDefinition(record: LabRecord): LabDefinitionPayload | null {
  return record.published_definition;
}

export function clone<T>(value: T): T {
  return typeof structuredClone === "function" ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);
}

export function audit(
  db: MockDb,
  actor: string,
  action: string,
  labId: string | null,
  before: unknown,
  after: unknown,
  attemptId: string | null = null,
): void {
  db.audit.push({
    audit_id: newId("audit"),
    at: new Date().toISOString(),
    actor,
    action,
    lab_id: labId,
    attempt_id: attemptId,
    before,
    after,
  });
}
