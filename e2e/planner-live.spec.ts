import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * The learning planner against the running dev stack (:3000 + backend :8000), signed in with the
 * development customer token. Everything the test creates is deleted again at the end.
 *
 *   RUN_PLANNER_LIVE=1 npx playwright test e2e/planner-live.spec.ts
 */
test.skip(!process.env.RUN_PLANNER_LIVE, "set RUN_PLANNER_LIVE=1 to run against the live dev stack");

const SHOTS = process.env.PLANNER_SHOTS_DIR;
const STAMP = Date.now().toString(36);
/** Titles this spec creates end with a base-36 stamp; any run's leftovers (e.g. after a 429) are swept. */
const OURS = /^(حل تمارين الوحدة|مراجعة|إنهاء الكورس) [a-z0-9]{8}$/;
const errors: string[] = [];

async function signIn(page: Page, baseURL: string) {
  const token = readFileSync(resolve(process.env.PLANNER_DEV_TOKEN_FILE ?? "../docs/auth_dev_token.txt"), "utf8").trim();
  await page.context().addCookies([
    { name: "b2c_access_token", value: token, url: baseURL, httpOnly: true, sameSite: "Lax" },
    { name: "b2c_session", value: "1", url: baseURL, sameSite: "Lax" },
  ]);
  const session = await page.request.get(`${baseURL}/api/auth/session`);
  expect(session.ok()).toBeTruthy();
  expect((await session.json()).customer, "Development token must authenticate a real customer").toBeTruthy();
}

/** Deletes what this spec created, from inside the page: the proxy only accepts same-origin calls. */
async function cleanup(page: Page) {
  if (!page.url().startsWith("http")) await page.goto("/students/planner");
  await page.evaluate(async (pattern) => {
    const ours = new RegExp(pattern);
    const from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 60);
    const calendar = await fetch(`/api/b2c/me/planner/calendar?from=${from.toISOString()}&to=${to.toISOString()}`);
    if (calendar.ok) {
      const { events } = (await calendar.json()) as { events: { source: string; title: string; reference_id: string }[] };
      for (const event of events) {
        if (ours.test(event.title) && ["note", "todo", "study"].includes(event.source)) {
          await fetch(`/api/b2c/me/planner/items/${event.reference_id}`, { method: "DELETE" });
        }
      }
    }
    const plans = await fetch("/api/b2c/me/planner/plans?include_archived=true");
    if (plans.ok) {
      for (const plan of (await plans.json()) as { plan_id: string; title: string }[]) {
        if (ours.test(plan.title)) await fetch(`/api/b2c/me/planner/plans/${plan.plan_id}`, { method: "DELETE" });
      }
    }
  }, OURS.source);
}

test.beforeEach(async ({ page, baseURL }) => {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await signIn(page, baseURL ?? "http://localhost:3000");
});

test.afterEach(async ({ page }) => {
  await cleanup(page);
});

test("plan a month: todo, study block, plan range, reminders, profile teaser", async ({ page }) => {
  await page.goto("/students/planner");
  await expect(page.getByRole("heading", { level: 1, name: "خطة التعلّم" })).toBeVisible();
  await expect(page.getByRole("grid")).toBeVisible({ timeout: 20_000 });

  // A todo for today.
  await page.getByRole("button", { name: "مهمة", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "إضافة إلى التقويم" })).toBeVisible();
  await dialog.getByLabel("العنوان").fill(`حل تمارين الوحدة ${STAMP}`);
  await dialog.getByLabel("تذكير بالبريد").selectOption({ label: "قبل يوم" });
  await dialog.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(dialog).toBeHidden();
  const todo = page.getByRole("listitem").filter({ hasText: `حل تمارين الوحدة ${STAMP}` });
  await expect(todo).toBeVisible();

  // Tick it off (optimistic), and it stays done after the refetch.
  await todo.getByRole("checkbox").click();
  await expect(todo.getByRole("checkbox")).toBeChecked();
  await page.waitForResponse((r) => r.url().includes("/me/planner/calendar") && r.ok());
  await expect(todo.getByRole("checkbox")).toBeChecked();

  // A timed study block pinned to a product.
  await page.getByRole("button", { name: "وقت تعلّم", exact: true }).click();
  await dialog.getByLabel("العنوان").fill(`مراجعة ${STAMP}`);
  await dialog.getByLabel("طوال اليوم").uncheck();
  await dialog.getByLabel("من", { exact: true }).fill("19:00");
  await dialog.getByLabel("إلى (اختياري)").fill("20:30");
  const firstProduct = dialog.locator("ul[aria-live] button").first();
  if (await firstProduct.isVisible({ timeout: 8_000 }).catch(() => false)) await firstProduct.click();
  await dialog.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("listitem").filter({ hasText: `مراجعة ${STAMP}` })).toContainText("وقت تعلّم");

  // A two-week plan.
  await page.getByRole("button", { name: "خطة جديدة" }).click();
  await dialog.getByLabel("اسم الخطة").fill(`إنهاء الكورس ${STAMP}`);
  await dialog.getByRole("button", { name: "حفظ الخطة" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: new RegExp(`^إنهاء الكورس ${STAMP}`), pressed: false })).toBeVisible();

  // Reminder settings: turn the digest on and off again.
  const digest = page.getByLabel("ملخّص يومي بخطتي");
  const wasOn = await digest.isChecked();
  const saved = () => page.waitForResponse((r) => r.url().includes("/me/planner/settings") && r.request().method() === "PUT");
  let put = saved();
  await digest.click();
  await expect(digest).toBeChecked({ checked: !wasOn });
  expect((await put).ok()).toBeTruthy();
  if (!wasOn) await expect(page.getByLabel("وقت الملخّص")).toBeVisible();
  put = saved();
  await digest.click();
  await expect(digest).toBeChecked({ checked: wasOn });
  expect((await put).ok()).toBeTruthy();

  if (SHOTS) await page.screenshot({ path: `${SHOTS}/planner-desktop.png`, fullPage: true });

  // Mobile layout: stacked, no horizontal scroll.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("grid")).toBeVisible({ timeout: 20_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/planner-mobile.png`, fullPage: true });

  // Profile teaser.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/students/profile");
  const teaser = page.getByRole("region", { name: "خطتك هذا الأسبوع" });
  await expect(teaser).toBeVisible({ timeout: 20_000 });
  await expect(teaser.getByRole("link", { name: /افتح التقويم/ })).toBeVisible();
  if (SHOTS) await teaser.screenshot({ path: `${SHOTS}/profile-teaser.png` });

  // `?date=` from a reminder email opens that day.
  await page.goto("/students/planner?date=2026-12-15");
  await expect(page.getByRole("heading", { level: 2, name: /15 ديسمبر/ })).toBeVisible({ timeout: 20_000 });

  expect(errors).toEqual([]);
});

test("unsubscribe link answers without a session", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/planner/unsubscribe?token=not-a-real-token-123456");
  await expect(page.getByRole("heading", { level: 1, name: "أوقفنا تذكيرات خطة التعلّم" })).toBeVisible({ timeout: 20_000 });
  await page.goto("/planner/unsubscribe");
  await expect(page.getByRole("heading", { level: 1, name: "رابط غير صالح" })).toBeVisible();
});
