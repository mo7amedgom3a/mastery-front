import { expect, test, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (error) => found.push(error.message));
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

const id = "10000000-0000-4000-8000-000000000001";
const analysis = {
  status: "complete", customer_type: "company", question_count: 3,
  needs_summary: "تحسين تقارير الفريق", pain_points: ["تأخر التقارير"], reported_gaps: [], skills_to_assess: ["تحليل البيانات"],
  possible_non_training_causes: ["تحتاج الأدوات إلى مراجعة"], recommended_actions: ["راجع سير إعداد التقارير"],
  product_matches: [], success_measures: ["قارن وقت إعداد التقارير"], uncertainties: [],
};

async function prepare(page: Page, { signedIn = true } = {}) {
  // Availability of both modes must not depend on a capability request.
  await page.route("**/api/b2c/advisor/capabilities*", (route) => route.abort());
  await page.route("**/api/b2c/advisor/suggestions*", (route) => route.fulfill({ json: { items: [] } }));
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { customer: signedIn ? { customer_id: id, email: "test@example.test", full_name: "Test" } : null, refreshable: false } }));
  await page.goto("/");
  await page.locator("#ma-advisor-launcher").click();
}

test("reasoning discovery, switching, early result and session restoration", async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  let releaseFirst: (() => void) | undefined;
  await page.route("**/api/advisor/stream", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    if (requests.length === 1) await new Promise<void>((resolve) => { releaseFirst = resolve; });
    const discovering = body.mode === "reasoning" && !body.analysis_action;
    const response = {
      conversation_id: id, answer: discovering ? "ما أكبر عائق؟" : "تحسين تقارير الفريق", intent: "study_plan", source: "llm", cached: false,
      mode: body.mode, products: [], follow_up_questions: [], clarification_needed: discovering,
      clarification: discovering ? { question: "ما أكبر عائق؟", options: ["تأخر التقارير"], slots: ["pain_points"], allow_free_text: true } : null,
      needs_analysis: body.mode === "reasoning" ? { ...analysis, status: discovering ? "discovering" : "complete" } : null,
    };
    await route.fulfill({ contentType: "text/event-stream", body: [
      { type: "run_started", conversation_id: id, mode: body.mode }, { type: "final", answer: response },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join("") });
  });
  await prepare(page);
  const reasoning = page.getByRole("button", { name: "تحليل الاحتياجات", exact: true });
  await reasoning.click();
  await expect(reasoning).toHaveAttribute("aria-pressed", "true");
  expect(requests).toHaveLength(0);
  await page.locator("#ma-advisor-input").fill("فريقنا يحتاج إلى تحسين التقارير");
  await page.locator("#ma-advisor-input").press("Enter");
  await expect(reasoning).toBeDisabled();
  await expect.poll(() => Boolean(releaseFirst)).toBe(true);
  releaseFirst!();
  await expect(page.getByRole("status").filter({ hasText: "اكتشاف الاحتياجات" })).toBeVisible();
  await page.getByRole("button", { name: "سريع", exact: true }).click();
  await page.locator("#ma-advisor-input").fill("دورات تحليل البيانات");
  await page.locator("#ma-advisor-input").press("Enter");
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1]).toMatchObject({ conversation_id: id, mode: "fast" });
  await expect(page.locator("#ma-advisor-input")).toBeEnabled();
  await expect(reasoning).toBeEnabled();
  await reasoning.click();
  await page.getByRole("button", { name: "اعرض التوصيات الآن", exact: true }).click();
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toBeVisible();
  expect(requests[2]).toMatchObject({ mode: "reasoning", analysis_action: "recommend_now", conversation_id: id });
  await expect(page.getByText("راجع سير إعداد التقارير", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toBeVisible();
  await expect(page.getByRole("button", { name: "تحليل الاحتياجات", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "محادثة جديدة", exact: true }).click();
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "تحليل الاحتياجات", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("reasoning is available by default and keeps the guest sign-in gate", async ({ page }) => {
  await prepare(page, { signedIn: false });
  await expect(page.getByRole("group", { name: "أسلوب المستشار" })).toBeVisible();
  await page.getByRole("button", { name: "تحليل الاحتياجات", exact: true }).click();
  await page.getByRole("button", { name: "اعرض التوصيات الآن", exact: true }).click();
  await expect(page.locator("#ma-advisor-login-title")).toBeVisible();
  await page.route("**/api/auth/login", (route) => route.fulfill({ json: { sent: true, resendAfter: 30 } }));
  await page.route("**/api/auth/verify", async (route) => {
    const customer = { customer_id: id, email: "test@example.test", full_name: "Test" };
    // Subsequent session checks must reflect the successful mocked sign-in.
    await page.route("**/api/auth/session", (session) => session.fulfill({ json: { customer } }));
    await route.fulfill({ json: { customer } });
  });
  let resumed: Record<string, unknown> | undefined;
  await page.route("**/api/advisor/stream", (route) => {
    resumed = route.request().postDataJSON();
    return route.fulfill({ contentType: "text/event-stream", body: `data: ${JSON.stringify({ type: "final", answer: {
      conversation_id: id, answer: "تحسين تقارير الفريق", mode: "reasoning", intent: "study_plan", source: "llm", products: [], follow_up_questions: [],
      clarification_needed: false, needs_analysis: analysis,
    } })}\n\n` });
  });
  // Scope to the modal so background account controls never match the form.
  const modal = page.locator("dialog[open]");
  await modal.getByRole("textbox", { name: "البريد الإلكتروني" }).fill("test@example.test");
  await modal.getByRole("button", { name: "إرسال رمز التحقق", exact: true }).click();
  await modal.getByRole("textbox", { name: "رمز التحقق", exact: true }).fill("123456");
  await modal.getByRole("button", { name: "تأكيد الدخول", exact: true }).click();
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toBeVisible();
  expect(resumed).toMatchObject({ mode: "reasoning", analysis_action: "recommend_now" });
  await expect(modal).toHaveCount(0);
});

test("mobile RTL controls fit and remain keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  const reasoning = page.getByRole("button", { name: "تحليل الاحتياجات", exact: true });
  await reasoning.focus();
  await page.keyboard.press("Enter");
  await expect(reasoning).toHaveAttribute("aria-pressed", "true");
  const box = await page.locator("#ma-advisor-panel").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  expect(await page.locator("#ma-advisor-panel").evaluate((node) => getComputedStyle(node).direction)).toBe("rtl");
});

test("stream proxy rejects invalid mode and analysis action", async ({ request }) => {
  for (const extra of [{ mode: "invalid" }, { analysis_action: "invalid" }]) {
    const response = await request.post("/api/advisor/stream", { headers: { "sec-fetch-site": "same-origin" }, data: { question: "help", ...extra } });
    expect(response.status()).toBe(400);
  }
});
