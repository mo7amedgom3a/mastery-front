import { expect, test, type Page } from "@playwright/test";

/**
 * One advisor, no mode toggle: the backend agent picks a direct answer or a needs diagnosis for
 * every turn. The widget never sends a mode and follows whatever each answer was.
 */
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

/** A stand-in for the backend router: a described team need is diagnosed, a named topic is answered. */
function reply(body: Record<string, unknown>) {
  const question = String(body.question);
  const diagnose = Boolean(body.analysis_action) || question.includes("فريق") || question === "تأخر التقارير";
  const discovering = diagnose && !body.analysis_action;
  return {
    conversation_id: id, answer: discovering ? "ما أكبر عائق؟" : diagnose ? "تحسين تقارير الفريق" : "هذه دورات تحليل البيانات.",
    intent: diagnose ? "study_plan" : "course_search", source: discovering ? "clarification" : "llm", cached: false,
    mode: diagnose ? "reasoning" : "fast", products: [], follow_up_questions: discovering ? ["تأخر التقارير", "أخطاء البيانات"] : [],
    clarification_needed: discovering,
    clarification: discovering ? { question: "ما أكبر عائق؟", options: ["تأخر التقارير", "أخطاء البيانات"], slots: ["pain_points"], allow_free_text: true } : null,
    needs_analysis: diagnose ? { ...analysis, status: discovering ? "discovering" : "complete" } : null,
  };
}

async function mockStream(page: Page) {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/advisor/stream", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    const answer = reply(body);
    await route.fulfill({ contentType: "text/event-stream", body: [
      { type: "run_started", conversation_id: id },
      { type: "step", stage: "route", status: "done", public: { mode: answer.mode } },
      { type: "final", answer },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join("") });
  });
  return requests;
}

async function prepare(page: Page, { signedIn = true } = {}) {
  await page.route("**/api/b2c/advisor/capabilities*", (route) => route.abort());
  await page.route("**/api/b2c/advisor/suggestions*", (route) => route.fulfill({ json: { items: [] } }));
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { customer: signedIn ? { customer_id: id, email: "test@example.test", full_name: "Test" } : null, refreshable: false } }));
  await page.goto("/");
  await page.locator("#ma-advisor-launcher").click();
}

async function send(page: Page, text: string) {
  await page.locator("#ma-advisor-input").fill(text);
  await page.locator("#ma-advisor-input").press("Enter");
}

test("there is no mode toggle and no mode is sent; each answer follows the agent's choice", async ({ page }) => {
  const requests = await mockStream(page);
  await prepare(page);
  await expect(page.getByRole("group", { name: "أسلوب المستشار" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "سريع", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "تحليل الاحتياجات", exact: true })).toHaveCount(0);

  // A named topic: a direct answer, no "recommend now".
  await send(page, "دورات تحليل البيانات");
  await expect(page.getByText("هذه دورات تحليل البيانات.")).toBeVisible();
  expect(requests[0]).not.toHaveProperty("mode");
  await expect(page.getByRole("button", { name: "اعرض التوصيات الآن", exact: true })).toHaveCount(0);

  // A described team need: the agent starts a diagnosis with a closed question.
  await send(page, "فريقنا يحتاج إلى تحسين التقارير");
  const group = page.getByRole("group", { name: "اختر إجابة أو اكتبها بنفسك" }).last();
  await expect(group.getByRole("button", { name: "تأخر التقارير", exact: true })).toBeVisible();
  const recommendNow = group.getByRole("button", { name: "اعرض التوصيات الآن", exact: true });
  await expect(recommendNow).toBeVisible();
  // The timeline says which way the agent went.
  await expect(page.getByTestId("advisor-trace").nth(0)).toContainText("قرّرت أجاوبك مباشرة");
  await expect(page.getByTestId("advisor-trace").last()).toContainText("قرّرت أفهم احتياجك أولاً");
  expect(requests[1]).toMatchObject({ conversation_id: id });
  expect(requests[1]).not.toHaveProperty("mode");

  // Skipping the remaining questions finishes the diagnosis.
  await recommendNow.click();
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toBeVisible();
  expect(requests[2]).toMatchObject({ analysis_action: "recommend_now", conversation_id: id });
  expect(requests[2]).not.toHaveProperty("mode");
  await expect(page.getByText("راجع سير إعداد التقارير", { exact: true })).toBeVisible();
  // Only the latest diagnosis question offers it.
  await expect(page.getByRole("button", { name: "اعرض التوصيات الآن", exact: true })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toBeVisible();
  await page.getByRole("button", { name: "محادثة جديدة", exact: true }).click();
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toHaveCount(0);
});

test("a guest's described need waits for sign-in, then the agent diagnoses it", async ({ page }) => {
  const requests = await mockStream(page);
  await prepare(page, { signedIn: false });
  await send(page, "فريقنا يحتاج إلى تحسين التقارير");
  await expect(page.locator("#ma-advisor-login-title")).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.route("**/api/auth/login", (route) => route.fulfill({ json: { sent: true, resendAfter: 30 } }));
  await page.route("**/api/auth/verify", async (route) => {
    const customer = { customer_id: id, email: "test@example.test", full_name: "Test" };
    await page.route("**/api/auth/session", (session) => session.fulfill({ json: { customer } }));
    await route.fulfill({ json: { customer } });
  });
  const modal = page.locator("dialog[open]");
  await modal.getByRole("textbox", { name: "البريد الإلكتروني" }).fill("test@example.test");
  await modal.getByRole("button", { name: "إرسال رمز التحقق", exact: true }).click();
  await modal.getByRole("textbox", { name: "رمز التحقق", exact: true }).fill("123456");
  await modal.getByRole("button", { name: "تأكيد الدخول", exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole("button", { name: "اعرض التوصيات الآن", exact: true })).toBeVisible();
  expect(requests[0]).toMatchObject({ question: "فريقنا يحتاج إلى تحسين التقارير" });
  expect(requests[0]).not.toHaveProperty("mode");
});

test("mobile RTL: the diagnosis choices fit and remain keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockStream(page);
  await prepare(page);
  await send(page, "فريقنا يحتاج إلى تحسين التقارير");
  const recommendNow = page.getByRole("button", { name: "اعرض التوصيات الآن", exact: true });
  await recommendNow.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "خطة عمل للفريق" })).toBeVisible();
  const box = await page.locator("#ma-advisor-panel").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(391);
  expect(await page.locator("#ma-advisor-panel").evaluate((node) => getComputedStyle(node).direction)).toBe("rtl");
});

test("stream proxy rejects an invalid analysis action", async ({ request }) => {
  const response = await request.post("/api/advisor/stream", { headers: { "sec-fetch-site": "same-origin" }, data: { question: "help", analysis_action: "invalid" } });
  expect(response.status()).toBe(400);
});
