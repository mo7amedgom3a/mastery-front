import { execFileSync } from "node:child_process";

import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";

import { adminApi, json } from "./support";

/*
 * A real learner on the customer dashboard, against the live API and workers: LMS_LEARNER_EMAIL's own account. Its
 * B2C purchases must survive untouched. The LMS rows below are temporary and sit on courses the account doesn't have,
 * so cleanup removes only those. Sign-in mints a local session, since the normal sign-in emails a code from the real
 * LMS. Local database only. Needs QA_*, SA_PASSWORD and LMS_LEARNER_EMAIL.
 */

const EMAIL = (process.env.LMS_LEARNER_EMAIL ?? "").toLowerCase();
const DAY = 86_400_000;

function sql(statement: string): string {
  return execFileSync("docker", [
    "exec", "mssql_db", "/opt/mssql-tools18/bin/sqlcmd", "-C", "-I", "-b", "-h", "-1", "-W", "-S", "localhost",
    "-U", "sa", "-P", process.env.SA_PASSWORD ?? "", "-d", "mastery_b2c_dev", "-Q", `SET NOCOUNT ON; ${statement}`,
  ], { encoding: "utf-8" }).trim();
}

/** Runs a workflow on its real worker and waits for it. */
function runWorkflow(name: "LegacyLearnerSyncWorkflow" | "LmsSyncSweepWorkflow", args: string[], queueSetting: string) {
  const code = `
import asyncio, os, uuid
from app.core.config import get_settings
from app.modules.temporal.infrastructure.client import connect_temporal_client
async def main():
    settings = get_settings()
    client = await connect_temporal_client(settings)
    await client.execute_workflow("${name}", args=${JSON.stringify(args)}, id="e2e-" + uuid.uuid4().hex, task_queue=settings.${queueSetting})
asyncio.run(main())
os._exit(0)  # The workflow finished; skips a native client abort at interpreter shutdown.
`;
  try {
    execFileSync("docker", ["exec", "legacy_sync_worker", "python", "-c", code], { encoding: "utf-8", stdio: "pipe" });
  } catch (error) {
    const failure = error as { status?: number; stderr?: string };
    throw new Error(`${name} failed (exit ${failure.status}): ${failure.stderr?.slice(-1500)}`);
  }
}

type Course = { id: number; slug: string; product: string; title: string };

function freeCourses(count: number, status: string): Course[] {
  const rows = sql(`
    SELECT TOP ${count} CONCAT(r.lms_reference_id, N'|', p.slug, N'|', p.product_id, N'|', COALESCE(t.title, p.slug))
    FROM b2c.resources r
    JOIN b2c.product_resources pr ON pr.resource_id = r.resource_id
    JOIN b2c.products p ON p.product_id = pr.product_id
    OUTER APPLY (SELECT TOP 1 title FROM b2c.product_translations x WHERE x.product_id = p.product_id ORDER BY CASE WHEN x.locale_code = N'ar-EG' THEN 0 ELSE 1 END) t
    WHERE r.resource_type = N'course' AND p.product_type = N'course' AND p.status = N'${status}'
      AND NOT EXISTS (SELECT 1 FROM b2c.entitlements e WHERE e.product_id = p.product_id AND e.customer_id = '${customerId}')
      AND NOT EXISTS (SELECT 1 FROM legacy.MAS_TRA_Courses c WHERE c.traineeId = ${trainee} AND c.courseId = TRY_CONVERT(INT, r.lms_reference_id))
      AND NOT EXISTS (SELECT 1 FROM legacy.MAS_COU_CurrentProgress g WHERE g.userId = ${user} AND g.courseId = TRY_CONVERT(INT, r.lms_reference_id))
    ORDER BY p.product_id`).split("\n");
  return rows.map((line) => {
    const [id, slug, product, title] = line.trim().split("|");
    return { id: Number(id), slug, product: product.toLowerCase(), title };
  });
}

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 19);

function enroll(course: Course, offsetDays: number) {
  sql(`INSERT INTO legacy.MAS_TRA_Courses (traineeId, courseId, enrolledAt, validUntil, addedBy, isAssigned, dateToEnd)
       VALUES (${trainee}, ${course.id}, '2024-01-01', '${iso(offsetDays)}', 42, 0, '${iso(offsetDays)}')`);
}

function setValidity(course: Course, offsetDays: number) {
  sql(`UPDATE legacy.MAS_TRA_Courses SET validUntil = '${iso(offsetDays)}' WHERE traineeId = ${trainee} AND courseId = ${course.id}`);
}

function setProgress(course: Course, percent: number) {
  sql(`DELETE FROM legacy.MAS_COU_CurrentProgress WHERE userId = ${user} AND courseId = ${course.id};
       INSERT INTO legacy.MAS_COU_CurrentProgress (Id, userId, courseId, progress, lastUpdate)
       SELECT MAX(Id) + 1, ${user}, ${course.id}, ${percent}, SYSUTCDATETIME() FROM legacy.MAS_COU_CurrentProgress`);
}

const syncLearner = () => runWorkflow("LegacyLearnerSyncWorkflow", [customerId], "temporal_legacy_sync_task_queue");

/** A local session for the account: tokens stay in memory and are revoked in cleanup. */
function mintSession(): { access: string; refresh: string; session: string } {
  const code = `
import asyncio, json, os
from uuid import UUID
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import get_settings
from app.core.database import get_async_engine
from app.db import models  # noqa
from app.modules.auth.application.tokens import TokenService
from app.modules.auth.infrastructure.repositories import SQLModelAuthRepository
async def main():
    tokens = TokenService(get_settings())
    customer_id = UUID("${customerId}")
    refresh, refresh_hash, expires = tokens.issue_refresh_token()
    async with AsyncSession(get_async_engine()) as session:
        created = await SQLModelAuthRepository(session).create_session(customer_id=customer_id, provider="e2e_local", refresh_token_hash=refresh_hash, expires_at=expires, client_ip_hash=None, user_agent_hash=None)
    access, _, _ = tokens.issue_access_token(customer_id=customer_id, session_id=created.session_id, group_id=None)
    print(json.dumps({"access": access, "refresh": refresh, "session": str(created.session_id)}), flush=True)
asyncio.run(main())
os._exit(0)
`;
  const output = execFileSync("docker", ["exec", "fastapi_backend", "python", "-c", code], { encoding: "utf-8", stdio: "pipe" });
  return JSON.parse(output.trim().split("\n").pop()!) as { access: string; refresh: string; session: string };
}

async function signIn(context: BrowserContext, baseURL: string) {
  const url = new URL(baseURL);
  await context.addCookies([
    { name: "b2c_access_token", value: tokens.access, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "b2c_session", value: "1", domain: url.hostname, path: "/", sameSite: "Lax" },
    { name: "b2c_refresh_token", value: tokens.refresh, domain: url.hostname, path: "/api/auth", httpOnly: true, sameSite: "Strict" },
  ]);
}

let admin: APIRequestContext;
let tokens: { access: string; refresh: string; session: string };
let customerId = "";
let user = 0;
let trainee = 0;
let running: Course, lapsed: Course, draft: Course, oldExpired: Course;
let before = "";

const ownedSnapshot = () => sql(`SELECT CONCAT(entitlement_id, N'|', status, N'|', expires_at) FROM b2c.entitlements WHERE customer_id = '${customerId}' AND source_type <> N'legacy_enrollment' ORDER BY entitlement_id`);

function cleanup() {
  const courses = [running, lapsed, draft, oldExpired].filter(Boolean);
  if (!courses.length) return;
  const ids = courses.map((course) => course.id).join(",");
  sql(`
    DELETE f FROM b2c.fulfillments f JOIN b2c.entitlements e ON e.entitlement_id = f.entitlement_id
      JOIN b2c.legacy_enrollment_map m ON m.entitlement_id = e.entitlement_id
      WHERE m.legacy_user_id = ${user} AND m.lms_course_id IN (${ids});
    DELETE e FROM b2c.entitlements e JOIN b2c.legacy_enrollment_map m ON m.entitlement_id = e.entitlement_id
      WHERE m.legacy_user_id = ${user} AND m.lms_course_id IN (${ids});
    DELETE FROM b2c.legacy_enrollment_map WHERE legacy_user_id = ${user} AND lms_course_id IN (${ids});
    DELETE FROM b2c.learner_progress WHERE customer_id = '${customerId}' AND lms_course_id IN (${ids});
    DELETE FROM legacy.MAS_COU_CurrentProgress WHERE userId = ${user} AND courseId IN (${ids});
    DELETE FROM legacy.MAS_TRA_Courses WHERE traineeId = ${trainee} AND courseId IN (${ids});`);
}

test.describe.serial("real learner on the customer dashboard", () => {
  test.setTimeout(120_000);

  test.beforeAll(async () => {
    test.setTimeout(120_000);
    expect(EMAIL, "Set LMS_LEARNER_EMAIL").not.toBe("");
    admin = await adminApi();
    const [id, numeric, traineeId] = sql(`
      SELECT CONCAT(c.customer_id, N'|', c.lms_numeric_user_id, N'|', t.Id)
      FROM b2c.customers c JOIN legacy.MAS_DEF_Trainees t ON t.userId = c.lms_numeric_user_id
      WHERE c.email = N'${EMAIL}'`).split("|");
    customerId = id.toLowerCase();
    user = Number(numeric);
    trainee = Number(traineeId);
    tokens = mintSession();
    before = ownedSnapshot();
    [running, lapsed, oldExpired] = freeCourses(3, "published");
    [draft] = freeCourses(1, "draft");
    enroll(running, 60);
    enroll(lapsed, 30);
    enroll(draft, 30);
    enroll(oldExpired, -60);
    setProgress(running, 65);
    setProgress(lapsed, 100);
    setProgress(oldExpired, 40);
    syncLearner();
    setValidity(lapsed, -1);
    syncLearner();
  });

  test.afterAll(async () => {
    cleanup();
    if (tokens) sql(`UPDATE b2c.auth_sessions SET revoked_at = SYSUTCDATETIME(), status = N'revoked' WHERE session_id = '${tokens.session}'`);
    expect(ownedSnapshot()).toBe(before);
  });

  test("only active enrollments are imported, and an expired one never was", async () => {
    const rows = sql(`SELECT CONCAT(p.slug, N'|', e.status) FROM b2c.entitlements e JOIN b2c.products p ON p.product_id = e.product_id
                      WHERE e.customer_id = '${customerId}' AND e.source_type = N'legacy_enrollment'`).split("\n").map((row) => row.trim());
    expect(rows.sort()).toEqual([`${running.slug}|active`, `${lapsed.slug}|expired`, `${draft.slug}|active`].sort());
    expect(sql(`SELECT COUNT(*) FROM b2c.learner_progress WHERE customer_id = '${customerId}' AND lms_course_id = ${oldExpired.id}`)).toBe("0");
  });

  test("B2C purchases are not doubled", async () => {
    expect(sql(`SELECT COUNT(*) FROM (SELECT product_id FROM b2c.entitlements WHERE customer_id = '${customerId}' GROUP BY product_id HAVING COUNT(*) > 1) x`)).toBe("0");
    expect(sql(`SELECT COUNT(*) FROM b2c.legacy_enrollment_map WHERE legacy_user_id = ${user} AND state = N'b2c_owned'`)).toBe("6");
  });

  test("the dashboard shows purchases and LMS courses with progress", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);
    const response = await context.request.get(`${baseURL}/api/b2c/me/products`, { params: { status: "active", limit: 100 } });
    expect(response.ok()).toBeTruthy();
    const owned = (await response.json()) as { items: { slug: string; progress_pct: number | null; product_status: string | null }[] };
    expect(owned.items[0].slug).toBe(running.slug);
    expect(owned.items[0].progress_pct).toBe(65);
    expect(owned.items.find((row) => row.slug === draft.slug)?.product_status).toBe("draft");
    expect(owned.items.map((row) => row.slug)).toEqual(expect.arrayContaining(["course-97", "package-39"]));

    await page.goto("/students/access");
    const card = page.locator("article", { hasText: running.title }).first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByRole("progressbar", { name: "تقدّمك في البرنامج" })).toHaveAttribute("aria-valuenow", "65");
    await expect(card.getByText("كمّل التعلّم")).toBeVisible();
    await expect(page.locator("article", { hasText: draft.title }).first().getByText("كمّل التعلّم")).toBeVisible();
    if (process.env.E2E_SHOTS_DIR) await page.screenshot({ path: `${process.env.E2E_SHOTS_DIR}/learner-access.png`, fullPage: true });
  });

  test("a course that expired after import keeps its progress", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);
    await page.goto("/students/access");
    await page.getByRole("button", { name: "المنتهي", exact: true }).click();
    const card = page.locator("article", { hasText: lapsed.title }).first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByRole("progressbar", { name: "تقدّمك في البرنامج" })).toHaveAttribute("aria-valuenow", "100");
  });

  test("LMS changes reach the dashboard", async ({ page, context, baseURL }) => {
    setProgress(running, 80);
    setValidity(running, 120);
    syncLearner();
    await signIn(context, baseURL!);
    await page.goto("/students/access");
    const card = page.locator("article", { hasText: running.title }).first();
    await expect(card.getByRole("progressbar", { name: "تقدّمك في البرنامج" })).toHaveAttribute("aria-valuenow", "80", { timeout: 30_000 });
  });

  test("an admin revoke reaches the LMS and survives the next sync", async () => {
    const id = sql(`SELECT e.entitlement_id FROM b2c.entitlements e WHERE e.customer_id = '${customerId}' AND e.product_id = '${running.product}' AND e.source_type = N'legacy_enrollment'`);
    await json(await admin.post(`/api/v1/admin/entitlements/${id}/revoke`, { data: { reason: "e2e revoke" } }));
    runWorkflow("LmsSyncSweepWorkflow", [], "temporal_fulfillment_task_queue");
    expect(sql(`SELECT CASE WHEN MAX(validUntil) <= SYSUTCDATETIME() THEN 1 ELSE 0 END FROM legacy.MAS_TRA_Courses WHERE traineeId = ${trainee} AND courseId = ${running.id}`)).toBe("1");
    syncLearner();
    expect(sql(`SELECT status FROM b2c.entitlements WHERE entitlement_id = '${id}'`)).toBe("revoked");
  });
});
