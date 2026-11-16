/**
 * Checks the mock labs API: contract routes, requirements, sessions/actions, scoring, attempts,
 * admin authoring/publish, generation and the legacy localStorage migration.
 * Run with `npm run test:labs:api`.
 */
import assert from "node:assert/strict";

import type { LabAction, LabActionResult, LabSession } from "../src/features/labs/api/contract";
import {
  CAMPAIGN_DAYS,
  TOTAL_BUDGET,
  currentFrequency,
  simulateDay,
  spentSoFar,
  startCampaign,
  suggestedBudget,
  type AdPlan,
} from "../src/features/labs/model/ad-market";
import { MockLabsServer } from "../src/features/labs/api/mock/server";
import { createMemoryStorage, LABS_DB_KEY, LEGACY_LABS_KEY } from "../src/features/labs/api/mock/storage";
import { locks as escapeLocks } from "../src/features/labs/content/escape";
import { startRoom, tryCode } from "../src/features/labs/model/escape-locks";

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve(fn()).then(() => {
    passed += 1;
    console.log(`✓ ${name}`);
  });
}

const FIXED_NOW = new Date("2026-11-13T10:00:00.000Z");

function server(storage = createMemoryStorage(), context = {}) {
  return new MockLabsServer({
    storage,
    now: () => new Date(FIXED_NOW),
    latency_ms: 0,
    fail_rate: 0,
    context,
  });
}

async function send(api: MockLabsServer, session: LabSession, action: LabAction): Promise<LabSession> {
  const result = await api.request<LabActionResult>("POST", `/me/labs/sessions/${session.session_id}/actions`, {
    body: {
      client_action_id: `${session.session_id}-${session.state.seq}-${action.type}`,
      seq: session.state.seq,
      action,
    },
  });
  return result.session;
}

async function main() {
  await test("catalogue hides drafts and preview exposes them", async () => {
    const api = server();
    const list = await api.request<{ items: { slug: string }[]; total: number }>("GET", "/labs");
    assert.equal(list.total, 20);
    assert.ok(list.items.some((item) => item.slug === "marketing-ads"));
    await assert.rejects(() => api.request("GET", "/labs/governance-boardroom"), /المختبر غير موجود/);
    const preview = await api.request<{ slug: string; pathway: unknown }>("GET", "/labs/governance-boardroom", {
      query: { preview: 1 },
    });
    assert.equal(preview.slug, "governance-boardroom");
    assert.ok(preview.pathway);
  });

  await test("requirements block a lab and pass with an entitlement", async () => {
    const api = server(createMemoryStorage(), { customer_id: null, entitlements: [] });
    await assert.rejects(
      () => api.request("POST", "/labs/finance-accrual-review/sessions", { body: {} }),
      /Requirements not met/,
    );
    const allowed = server();
    const session = await allowed.request<LabSession>("POST", "/labs/finance-accrual-review/sessions", { body: {} });
    assert.equal(session.status, "in_progress");
    assert.ok(session.requirements.every((requirement) => requirement.satisfied));
  });

  await test("a schema lab runs, scores and persists an attempt", async () => {
    const api = server();
    let session = await api.request<LabSession>("POST", "/labs/finance-accrual-review/sessions", { body: {} });
    session = await send(api, session, { type: "phase.enter", phase_id: "review" });
    session = await send(api, session, {
      type: "form.submit",
      phase_id: "review",
      values: { variance_note: "فرق في حساب المصروفات المستحقة بسبب فاتورة مورد لم تصل.", materiality: 42000 },
    });
    session = await send(api, session, {
      type: "dialogue.choose",
      graph_id: "pathway",
      node_id: "decision",
      choice_id: "accrue",
    });
    session = await send(api, session, {
      type: "form.submit",
      phase_id: "signoff",
      values: { adjustment: "accrue", sign_off: true },
    });
    const completed = await api.request<{ attempt: { attempt_id: string; overall: number; dimensions: unknown[] }; scorecard: { overall: number }; new_badges: string[] }>(
      "POST",
      `/me/labs/sessions/${session.session_id}/complete`,
      {
        body: {
          engine: "schema",
          answers: {
            fields: { variance_note: "فرق مستحق", materiality: 42000, adjustment: "accrue", sign_off: true },
            choices: { decision: "accrue" },
          },
          pre: null,
          post: null,
          elapsed_seconds: 600,
        },
      },
    );
    assert.ok(completed.scorecard.overall > 0);
    assert.equal(completed.attempt.dimensions.length, 3);
    assert.ok(completed.new_badges.includes("first-lab"));

    const attempts = await api.request<{ items: { attempt_id: string }[]; total: number }>("GET", "/me/labs/attempts");
    assert.equal(attempts.total, 1);
    assert.equal(attempts.items[0].attempt_id, completed.attempt.attempt_id);

    const duplicate = await api.request<{ attempt: { attempt_id: string } }>(
      "POST",
      `/me/labs/sessions/${session.session_id}/complete`,
      { body: { engine: "schema", answers: {}, pre: null, post: null, elapsed_seconds: 0 } },
    );
    assert.equal(duplicate.attempt.attempt_id, completed.attempt.attempt_id);
  });

  await test("actions are idempotent and sequence-checked; invalid forms are rejected", async () => {
    const api = server();
    const session = await api.request<LabSession>("POST", "/labs/hse-site-inspection/sessions", { body: {} });
    const action: LabAction = { type: "phase.enter", phase_id: "walkthrough" };
    const body = { client_action_id: "fixed-action", seq: session.state.seq, action };
    const first = await api.request<LabActionResult>("POST", `/me/labs/sessions/${session.session_id}/actions`, { body });
    const second = await api.request<LabActionResult>("POST", `/me/labs/sessions/${session.session_id}/actions`, { body });
    assert.equal(first.session.state.seq, second.session.state.seq);
    await assert.rejects(
      () => api.request("POST", `/me/labs/sessions/${session.session_id}/actions`, { body: { ...body, client_action_id: "stale" } }),
      /التسلسل غير متطابق/,
    );
    await assert.rejects(
      () =>
        api.request("POST", `/me/labs/sessions/${session.session_id}/actions`, {
          body: {
            client_action_id: "bad-form",
            seq: first.session.state.seq,
            action: { type: "form.submit", phase_id: "assessment", values: {} },
          },
        }),
      /مطلوب/,
    );
  });

  await test("a legacy lab completes through its registered scorer", async () => {
    const api = server();
    const session = await api.request<LabSession>("POST", "/labs/marketing-ads/sessions", { body: {} });
    const plan: AdPlan = {
      city: "riyadh",
      ages: ["18-24", "25-34"],
      interests: ["coffee", "cafes"],
      platforms: ["tiktok", "snapchat"],
      creative: { headline: "h-origin", visual: "v-reel", cta: "c-follow" },
      bid: "engagement",
      pacing: "even",
      split: { tiktok: 60, snapchat: 40 },
    };
    let campaign = startCampaign(plan);
    for (let day = 1; day <= CAMPAIGN_DAYS; day += 1) {
      const remaining = TOTAL_BUDGET - spentSoFar(campaign);
      campaign = simulateDay(
        campaign,
        {
          budget: suggestedBudget(plan.pacing, day, remaining),
          split: plan.split,
          creative: plan.creative,
          refresh: currentFrequency(campaign) > 1.2,
        },
        7,
      );
    }
    const completed = await api.request<{ attempt: { overall: number; source: string }; scorecard: { overall: number }; new_badges: string[] }>(
      "POST",
      `/me/labs/sessions/${session.session_id}/complete`,
      {
        body: {
          engine: "legacy",
          scorer: "marketing",
          run: campaign,
          pre: null,
          post: null,
          elapsed_seconds: 600,
        },
      },
    );
    assert.ok(completed.attempt.overall > 0);
    assert.equal(completed.attempt.source, "lab");
    assert.ok(completed.new_badges.includes("first-lab"));
  });

  await test("a legacy lab accepts its runner stage ids", async () => {
    const api = server();
    let session = await api.request<LabSession>("POST", "/labs/marketing-ads/sessions", { body: {} });
    session = await send(api, session, { type: "phase.enter", phase_id: "pre" });
    session = await send(api, session, { type: "quiz.submit", phase: "pre", answers: [1, 2, 0, 2, 1] });
    session = await send(api, session, { type: "phase.enter", phase_id: "audience" });
    assert.equal(session.state.phase_id, "audience");
    assert.ok(session.state.completed_phases?.includes("pre"));
  });

  await test("admin can list, validate, publish and analyse a lab", async () => {
    const api = server();
    const list = await api.request<{ items: { lab_id: string; slug: string; status: string }[]; total: number }>("GET", "/admin/labs");
    assert.ok(list.total >= 15);
    const draft = await api.request<{ lab: { lab_id: string; slug: string }; definition: { slug: string } }>(
      "GET",
      `/admin/labs/${list.items.find((item) => item.slug === "governance-boardroom")?.lab_id}`,
    );
    assert.equal(draft.definition.slug, "governance-boardroom");
    const validation = await api.request<{ valid: boolean }>("POST", `/admin/labs/${draft.lab.lab_id}/validate`);
    assert.equal(validation.valid, true);

    const published = await api.request<{ status: string; published_version: number }>("POST", `/admin/labs/${draft.lab.lab_id}/publish`);
    assert.equal(published.status, "published");
    assert.equal(published.published_version, 1);
    const publicLab = await api.request<{ slug: string }>("GET", "/labs/governance-boardroom");
    assert.equal(publicLab.slug, "governance-boardroom");

    const versions = await api.request<{ version: number }[]>("GET", `/admin/labs/${draft.lab.lab_id}/versions`);
    assert.equal(versions.length, 1);
    const analytics = await api.request<{ lab_slug: string; funnel: unknown[] }>("GET", `/admin/labs/${draft.lab.lab_id}/analytics`);
    assert.equal(analytics.lab_slug, "governance-boardroom");
    assert.ok(analytics.funnel.length >= 1);

    await assert.rejects(
      () => api.request("PUT", `/admin/labs/${draft.lab.lab_id}/draft`, { body: { base_revision: 999, definition: draft.definition } }),
      /تعارض في التعديل/,
    );
  });

  await test("admin creates and duplicates drafts with unique slugs", async () => {
    const api = server();
    const created = await api.request<{ lab_id: string; slug: string; status: string }>("POST", "/admin/labs", { body: {} });
    assert.equal(created.status, "draft");
    assert.ok(created.slug.startsWith("lab-"));
    const duplicated = await api.request<{ slug: string; status: string }>("POST", `/admin/labs/${created.lab_id}/duplicate`);
    assert.equal(duplicated.status, "draft");
    assert.notEqual(duplicated.slug, created.slug);
  });

  await test("admin generation creates a draft and applies it", async () => {
    const api = server();
    const job = await api.request<{ job_id: string; status: string; draft: { slug: string } }>("POST", "/admin/labs/generate", {
      body: { prompt: "مختبر تفاوض على ميزانية", field_category_id: 29, category_name: "المالية والمحاسبة" },
    });
    assert.equal(job.status, "succeeded");
    const applied = await api.request<{ lab_id: string; slug: string; status: string }>("POST", `/admin/labs/generate/${job.job_id}/apply`);
    assert.equal(applied.status, "draft");
    assert.ok(applied.slug.startsWith("generated-"));
  });

  await test("legacy localStorage attempts migrate once", async () => {
    const storage = createMemoryStorage({
      [LEGACY_LABS_KEY]: JSON.stringify({
        state: {
          attempts: [
            {
              id: "legacy-1",
              slug: "marketing-ads",
              at: "2026-11-01T09:00:00.000Z",
              overall: 72,
              readiness: "جاهز",
              dimensions: [{ key: "target", label: "تحقيق الهدف", score: 72, skill: "execution" }],
              xp: 194,
              badges: ["first-lab"],
              categoryLegacyId: 27,
              categoryName: "التسويق المتكامل",
              minutes: 14,
              highlights: [],
              pre: null,
              post: null,
              signals: {},
              attemptNo: 1,
            },
          ],
          xp: 194,
          badges: ["first-lab"],
        },
      }),
    });
    const api = server(storage);
    const attempts = await api.request<{ items: { slug: string; source: string }[]; total: number }>("GET", "/me/labs/attempts");
    assert.equal(attempts.total, 1);
    assert.equal(attempts.items[0].source, "imported");
    const second = server(storage);
    const again = await second.request<{ total: number }>("GET", "/me/labs/attempts");
    assert.equal(again.total, 1);
  });

  await test("reset clears attempts and badges", async () => {
    const api = server();
    const session = await api.request<LabSession>("POST", "/labs/hse-site-inspection/sessions", { body: {} });
    await api.request("POST", `/me/labs/sessions/${session.session_id}/complete`, {
      body: { engine: "schema", answers: { fields: {}, choices: {} }, pre: null, post: null, elapsed_seconds: 60 },
    });
    assert.equal((await api.request<{ total: number }>("GET", "/me/labs/attempts")).total, 1);
    await api.request("DELETE", "/me/labs/attempts");
    assert.equal((await api.request<{ total: number }>("GET", "/me/labs/attempts")).total, 0);
  });

  await test("a journey lab completes through its scorer and earns its badge", async () => {
    const api = server();
    let session = await api.request<LabSession>("POST", "/labs/audit-escape-room/sessions", { body: {} });
    session = await send(api, session, { type: "phase.enter", phase_id: "room" });
    let room = startRoom();
    for (const lock of escapeLocks) room = tryCode(escapeLocks, room, lock.code).state;
    const completed = await api.request<{ scorecard: { overall: number }; new_badges: string[] }>(
      "POST",
      `/me/labs/sessions/${session.session_id}/complete`,
      { body: { engine: "legacy", scorer: "escape", run: { state: room, recommendation: "conditions" }, pre: null, post: null, elapsed_seconds: 700 } },
    );
    assert.ok(completed.scorecard.overall >= 85);
    assert.ok(completed.new_badges.includes("escape-artist"));
  });

  await test("an older saved DB gains the new labs and the close lab takes back its slug", async () => {
    const storage = createMemoryStorage();
    const first = server(storage);
    await first.request("GET", "/labs");
    const saved = JSON.parse(storage.getItem(LABS_DB_KEY) ?? "{}") as { labs: { definition: { slug: string; engine: string } }[] };
    // Simulate a DB saved before the journey labs: drop them and restore the old schema fixture slug.
    saved.labs = saved.labs.filter((record) => !["audit-escape-room", "finance-quarter-close"].includes(record.definition.slug));
    const fixture = saved.labs.find((record) => record.definition.slug === "finance-accrual-review");
    if (fixture) fixture.definition.slug = "finance-quarter-close";
    storage.setItem(LABS_DB_KEY, JSON.stringify(saved));
    const api = server(storage);
    const close = await api.request<{ slug: string; engine: string }>("GET", "/labs/finance-quarter-close");
    assert.equal(close.engine, "legacy");
    await api.request("GET", "/labs/audit-escape-room");
  });

  console.log(`\n${passed} labs API checks passed`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
