import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import type { AdvisorAnswer } from "../src/features/advisor/model/types";

test.skip(process.env.RUN_ADVISOR_LIVE !== "1", "Opt-in: uses the local development account and real advisor models");
test.setTimeout(420_000);
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach("browser-errors", { body: JSON.stringify(pageErrors.get(page)), contentType: "application/json" });
  expect(pageErrors.get(page)).toEqual([]);
});

async function signIn(page: Page, baseURL: string) {
  const token = readFileSync(resolve(process.env.ADVISOR_DEV_TOKEN_FILE ?? "../docs/auth_dev_token.txt"), "utf8").trim();
  await page.context().addCookies([
    { name: "b2c_access_token", value: token, url: baseURL, httpOnly: true, sameSite: "Lax" },
    { name: "b2c_session", value: "1", url: baseURL, sameSite: "Lax" },
  ]);
  const session = await page.request.get(`${baseURL}/api/auth/session`);
  expect(session.ok()).toBeTruthy();
  expect((await session.json()).customer, "Development token must authenticate a real customer").toBeTruthy();
  await page.goto("/");
  await page.locator("#ma-advisor-launcher").click();
  // One advisor: there is no mode toggle, the agent picks a direct answer or a diagnosis per turn.
  await expect(page.getByRole("button", { name: "تحليل الاحتياجات", exact: true })).toHaveCount(0);
}

async function ask(page: Page, question: string): Promise<AdvisorAnswer & { factors: Record<string, unknown> }> {
  const pending = page.waitForResponse((response) => response.url().endsWith("/api/advisor/stream") && response.request().method() === "POST", { timeout: 180_000 });
  await page.locator("#ma-advisor-input").fill(question);
  await page.locator("#ma-advisor-input").press("Enter");
  const response = await pending;
  expect(response.status(), "Real streaming endpoint").toBe(200);
  const body = await response.text();
  const events = body.split("\n").filter((line) => line.startsWith("data: ")).map((line) => JSON.parse(line.slice(6)));
  const error = events.find((event) => event.type === "error");
  expect(error, "Real SSE stream must finish without errors").toBeUndefined();
  const answer = events.find((event) => event.type === "final")?.answer;
  expect(answer, "Real stream must include a final answer").toBeTruthy();
  console.log(JSON.stringify({ question, answer: answer.answer, mode: answer.mode, source: answer.source,
    clarification: answer.clarification, needs_analysis: answer.needs_analysis, needs_profile: answer.factors?.needs_profile }));
  // Markdown renders bullet markers as list elements rather than literal characters.
  await expect(page.locator("#ma-advisor-panel")).toContainText(answer.answer.split("\n")[0]);
  return answer;
}

async function saveTranscript(testInfo: TestInfo, transcript: unknown[]) {
  const path = testInfo.outputPath("real-advisor-transcript.json");
  writeFileSync(path, JSON.stringify(transcript, null, 2));
  await testInfo.attach("real-advisor-transcript", { path, contentType: "application/json" });
}

test("real marketing conversation retains answers and progresses", async ({ page, baseURL }, testInfo) => {
  await signIn(page, baseURL!);
  const transcript: unknown[] = [];
  let previousCount = 0;
  const seen = new Set<string>();
  let answer = await ask(page, "عايز اتعلم التسويق بس مش عارف أبدأ منين");
  expect(answer.mode, "a described need starts a diagnosis").toBe("reasoning");
  expect(answer.answer).not.toMatch(/المحاسبة|المحاسبه|الإدارة المالية/);
  try {
    for (let turn = 0; turn < 6; turn++) {
      transcript.push(answer);
      const profile = answer.factors?.needs_profile as Record<string, unknown>;
      const count = Number(profile?.question_count ?? 0);
      expect(count, "Discovery must not restart within a goal").toBeGreaterThanOrEqual(previousCount);
      previousCount = count;
      expect(count).toBeLessThanOrEqual(5);
      if (!answer.clarification_needed) break;
      const slot = answer.clarification!.slots[0];
      expect(seen.has(slot), `Already asked ${slot}`).toBe(false);
      seen.add(slot);
      const replies: Record<string, string> = { customer_type: "لنفسي", current_situation: "ليس لدي اي خبره", pain_points: "المصادر والوقت", weekly_availability: "ساعتين في الأسبوع", goal: "عايز أبدأ أشتغل في التسويق الإلكتروني", budget: "أقل من 150 دولار", team_context: "أنا بتعلم لنفسي، مش لفريق" };
      answer = await ask(page, replies[slot] ?? "مش مهم");
    }
    expect(answer.clarification_needed).toBe(false);
    const profile = answer.factors.needs_profile as Record<string, unknown>;
    expect(profile.customer_type).toBe("individual");
    expect(String(profile.goal)).toMatch(/تسويق|marketing/i);
    expect(profile.weekly_availability, "Time barrier must receive a useful availability follow-up").toBeTruthy();
    expect(profile.extraction_failed).toBe(false);
    await page.screenshot({ path: testInfo.outputPath("marketing-result.png"), fullPage: true });
    await expect(page.getByRole("heading", { name: /خطة تطويرك/ })).toBeVisible();
  } finally {
    await saveTranscript(testInfo, transcript);
  }
});


async function finishDiscovery(page: Page, initial: Awaited<ReturnType<typeof ask>>, replies: Record<string, string>, transcript: unknown[]) {
  let answer = initial;
  let previousCount = 0;
  const asked = new Set<string>();
  for (let turn = 0; turn < 6; turn++) {
    transcript.push(answer);
    const profile = answer.factors.needs_profile as Record<string, unknown>;
    const count = Number(profile.question_count);
    expect(count).toBeGreaterThanOrEqual(previousCount);
    expect(count).toBeLessThanOrEqual(5);
    previousCount = count;
    if (!answer.clarification_needed) return answer;
    const slot = answer.clarification!.slots[0];
    expect(asked.has(slot), `Repeated discovery slot: ${slot}`).toBe(false);
    asked.add(slot);
    answer = await ask(page, replies[slot] ?? "مش مهم");
  }
  throw new Error("Discovery did not finish within its question limit");
}

test("real complaints discovery adapts to an individual beginner on mobile", async ({ page, baseURL }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, baseURL!);
  const transcript: unknown[] = [];
  try {
    const first = await ask(page, "عايز اتعلم التعامل مع شكاوي العملاء ومش عارف أبدأ منين");
    expect(first.mode).toBe("reasoning");
    const result = await finishDiscovery(page, first, {
      customer_type: "لنفسي", current_situation: "ليس لدي اي خبره", pain_points: "الوقت ومش عارف أختار مصادر مناسبة",
      weekly_availability: "ثلاث ساعات أسبوعيا", goal: "عايز أعرف أتعامل مع العميل الغاضب بطريقة مهنية",
    }, transcript);
    const profile = result.factors.needs_profile as Record<string, unknown>;
    expect(profile.customer_type).toBe("individual");
    expect(String(profile.goal)).toMatch(/شكاو|complaint|عملاء|عميل/i);
    expect(profile.weekly_availability).toBeTruthy();
    expect(profile.extraction_failed).toBe(false);
    expect(result.needs_analysis).toBeTruthy();
    const productIds = new Set(result.products.map((product) => product.product_id));
    for (const match of result.needs_analysis!.product_matches) expect(productIds.has(match.product_id)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("complaints-mobile-result.png"), fullPage: true });
  } finally { await saveTranscript(testInfo, transcript); }
});

test("real company analysis recognizes a permissions problem without selling training", async ({ page, baseURL }, testInfo) => {
  await signIn(page, baseURL!);
  const transcript: unknown[] = [];
  try {
    const first = await ask(page, "إحنا شركة وعندي فريق خدمة عملاء من خمسة موظفين. هدفنا تسريع حل شكاوي العملاء. الموظفين عندهم خبرة وبيعرفوا يحلوا الشكاوي، لكن نظام الشكاوي مش بيديهم صلاحية تنفيذ الحل إلا بعد موافقة المدير. المشكلة صلاحيات النظام فقط، ومش محتاجين كورسات جديدة.");
    expect(first.clarification_needed, "An explained permissions problem must not repeat discovery").toBe(false);
    const result = await finishDiscovery(page, first, {
      customer_type: "شركة", goal: "نقلل وقت حل الشكاوى بتعديل الصلاحيات", current_situation: "الفريق خبير والمشكلة فقط انتظار صلاحية المدير",
      team_context: "خمسة موظفين في فريق خدمة العملاء", pain_points: "تأخر موافقة المدير على صلاحيات النظام",
    }, transcript);
    expect((result.factors.needs_profile as Record<string, unknown>).customer_type).toBe("company");
    expect((result.factors.needs_profile as Record<string, unknown>).training_relevant).toBe(false);
    expect(result.products).toEqual([]);
    expect(result.needs_analysis!.possible_non_training_causes.length).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { name: /خطة عمل للفريق/ })).toBeVisible();
  } finally { await saveTranscript(testInfo, transcript); }
});

test("real corrections, FAQ and mode switching preserve the same analysis", async ({ page, baseURL }, testInfo) => {
  await signIn(page, baseURL!);
  const transcript: unknown[] = [];
  try {
    let answer = await ask(page, "أنا بتعلم لنفسي، عندي أساسيات التسويق ومحتاج أتعلم تسويق المحتوى عشان أبدأ شغل حر. مشكلتي قلة التطبيق العملي والوقت، ومتفرغ ساعتين أسبوعيا.");
    answer = await finishDiscovery(page, answer, { customer_type: "لنفسي", current_situation: "عندي أساسيات التسويق", goal: "العمل الحر في تسويق المحتوى", pain_points: "قلة التطبيق العملي والوقت", weekly_availability: "ساعتين أسبوعيا" }, transcript);
    const id = answer.conversation_id;
    const count = (answer.factors.needs_profile as Record<string, unknown>).question_count;
    const faq = await ask(page, "هل دوراتكم فيها شهادات؟");
    transcript.push(faq);
    expect(faq.intent).toBe("faq");
    expect(faq.factors.needs_profile).toEqual(answer.factors.needs_profile);
    const corrected = await ask(page, "تصحيح: متاح لي أربع ساعات أسبوعيا بدل ساعتين، وباقي المعلومات زي ما هي");
    transcript.push(corrected);
    expect(corrected.conversation_id).toBe(id);
    expect(String((corrected.factors.needs_profile as Record<string, unknown>).weekly_availability)).toMatch(/4|٤|أربع|اربع/);
    expect((corrected.factors.needs_profile as Record<string, unknown>).question_count).toBe(count);
    // A named topic mid-diagnosis is answered directly by the agent's own choice.
    const fast = await ask(page, "عايز أشوف دورات تسويق المحتوى");
    transcript.push(fast);
    expect(fast.mode).toBe("fast");
    expect(fast.conversation_id).toBe(id);
    const resumed = await ask(page, "كمل نفس التحليل مع الأربع ساعات الأسبوعية");
    transcript.push(resumed);
    expect(resumed.mode).toBe("reasoning");
    expect(resumed.conversation_id).toBe(id);
    expect((resumed.factors.needs_profile as Record<string, unknown>).question_count).toBe(count);
    expect(String((resumed.factors.needs_profile as Record<string, unknown>).weekly_availability)).toMatch(/4|٤|أربع|اربع/);
  } finally { await saveTranscript(testInfo, transcript); }
});

test("real skipped answers and early recommendations do not repeat questions", async ({ page, baseURL }, testInfo) => {
  await signIn(page, baseURL!);
  const transcript: unknown[] = [];
  try {
    const first = await ask(page, "عايز اتعلم تحليل البيانات لنفسي بس مش عارف أبدأ منين");
    expect(first.mode).toBe("reasoning");
    transcript.push(first);
    let answer = first;
    if (answer.clarification_needed) {
      answer = await ask(page, answer.clarification!.slots[0] === "customer_type" ? "لنفسي" : "مش مهم");
      transcript.push(answer);
    }
    if (answer.clarification_needed) {
      answer = await ask(page, "مش مهم");
      transcript.push(answer);
    }
    const pending = page.waitForResponse((response) => response.url().endsWith("/api/advisor/stream") && response.request().method() === "POST");
    await page.getByRole("button", { name: "اعرض التوصيات الآن", exact: true }).click();
    const response = await pending;
    expect(response.status()).toBe(200);
    const events = (await response.text()).split("\n").filter((line) => line.startsWith("data: ")).map((line) => JSON.parse(line.slice(6)));
    const final = events.find((event) => event.type === "final")?.answer;
    expect(final).toBeTruthy();
    transcript.push(final);
    expect(final.clarification_needed).toBe(false);
    expect(final.factors.needs_profile.question_count).toBeLessThanOrEqual(5);
    expect(final.factors.needs_profile.declined.length).toBeGreaterThan(0);
    if (final.factors.needs_profile.declined.includes("current_situation")) {
      expect(final.factors.needs_profile.current_situation).toBeNull();
      expect(final.needs_analysis.needs_summary).toContain("غير محددة");
    }
    expect(final.needs_analysis.status).toBe("provisional");
  } finally { await saveTranscript(testInfo, transcript); }
});

type LiveEvent = { type: string; stage?: string; public?: Record<string, unknown>; answer?: AdvisorAnswer };

/** Sends a message through the real widget and returns every SSE event of the real stream. */
async function askEvents(page: Page, question: string): Promise<LiveEvent[]> {
  const pending = page.waitForResponse((response) => response.url().endsWith("/api/advisor/stream") && response.request().method() === "POST", { timeout: 180_000 });
  await page.locator("#ma-advisor-input").fill(question);
  await page.locator("#ma-advisor-input").press("Enter");
  const response = await pending;
  expect(response.status(), "Real streaming endpoint").toBe(200);
  const events = (await response.text()).split("\n").filter((line) => line.startsWith("data: ")).map((line) => JSON.parse(line.slice(6)) as LiveEvent);
  expect(events.find((event) => event.type === "error"), "Real SSE stream must finish without errors").toBeUndefined();
  expect(events.at(-1)?.type).toBe("final");
  await expect(page.locator("#ma-advisor-input")).toBeEnabled({ timeout: 30_000 });
  return events;
}

const finalOf = (events: LiveEvent[]) => events.at(-1)!.answer as AdvisorAnswer;

test("real gibberish from the issue samples gets 'I don't know', never a question or product", async ({ page, baseURL }, testInfo) => {
  await signIn(page, baseURL!);
  const transcript: unknown[] = [];
  // Twice: on a fresh conversation, then after a diagnosis question is pending.
  for (const mode of ["fresh", "diagnosing"]) {
    if (mode === "diagnosing") {
      const start = finalOf(await askEvents(page, "فريقي عنده مشاكل في التعامل مع شكاوي العملاء"));
      expect(start.mode).toBe("reasoning");
    }
    for (const message of ["عايز اتعلم بتنببنتنتب", "dkdndlk"]) {
      const events = await askEvents(page, message);
      const answer = finalOf(events);
      transcript.push({ mode, message, answer: answer.answer, source: answer.source, options: answer.follow_up_questions });
      expect(answer.source).toBe("unknown");
      expect(answer.answer).toContain("ما فهمت");
      expect(answer.products).toEqual([]);
      expect(answer.clarification_needed).toBe(false);
      expect(answer.follow_up_questions.length).toBeGreaterThan(1);
      expect(events.filter((event) => event.type === "token").length).toBeGreaterThan(1);
      await expect(page.locator("#ma-advisor-panel")).not.toContainText("هل تبحث عن تطوير نفسك أم تدريب فريق");
    }
  }
  await saveTranscript(testInfo, transcript);
});

test("real diagnosis asks closed questions, streams and shows its steps", async ({ page, baseURL }, testInfo) => {
  await signIn(page, baseURL!);
  const transcript: unknown[] = [];
  let events = await askEvents(page, "عايز اتعلم تحليل البيانات بس مش عارف أبدأ منين");
  expect(finalOf(events).mode, "the agent chose a diagnosis").toBe("reasoning");
  expect(events.find((event) => event.stage === "route")?.public).toEqual({ mode: "reasoning" });
  for (let turn = 0; turn < 5; turn += 1) {
    const answer = finalOf(events);
    transcript.push({ answer: answer.answer, source: answer.source, clarification: answer.clarification, steps: events.filter((e) => e.type !== "token").map((e) => e.stage ?? e.type) });
    expect(events.filter((event) => event.type === "token").length, "the answer streams in pieces").toBeGreaterThan(1);
    expect(events.some((event) => event.type === "thought"), "reasoning shows a thought").toBeTruthy();
    expect(answer.clarification?.slots ?? []).not.toContain("customer_type");
    const trace = page.getByTestId("advisor-trace").last();
    await expect(trace).toBeVisible();
    await expect(trace.locator("summary")).toContainText("فكّرت في");
    if (!answer.clarification_needed) break;
    const options = answer.clarification!.options;
    expect(options.length, "closed question with 2-4 options").toBeGreaterThanOrEqual(2);
    expect(options.length).toBeLessThanOrEqual(4);
    await expect(page.getByRole("button", { name: "اكتب إجابتك بنفسك" }).last()).toBeVisible();
    // Answer with the first choice, like a visitor tapping a chip.
    const pending = page.waitForResponse((response) => response.url().endsWith("/api/advisor/stream"), { timeout: 180_000 });
    await page.locator("#ma-advisor-panel").getByRole("button", { name: options[0], exact: true }).last().click();
    const response = await pending;
    events = (await response.text()).split("\n").filter((line) => line.startsWith("data: ")).map((line) => JSON.parse(line.slice(6)) as LiveEvent);
    expect(events.find((event) => event.type === "error")).toBeUndefined();
    await expect(page.locator("#ma-advisor-input")).toBeEnabled({ timeout: 30_000 });
  }
  await saveTranscript(testInfo, transcript);
  expect(finalOf(events).clarification_needed, "discovery ends within the question budget").toBe(false);
});

test("real direct answer streams a catalog answer with visible steps and says 'I don't know' off-catalog", async ({ page, baseURL }, testInfo) => {
  await signIn(page, baseURL!);
  const python = await askEvents(page, "عايز اتعلم بايثن من الصفر");
  expect(finalOf(python).mode, "a named topic is answered directly").toBe("fast");
  const understand = python.find((event) => event.type === "step" && event.stage === "understand");
  expect(understand?.public, "understanding is visible to the widget").toBeTruthy();
  expect(python.filter((event) => event.type === "token").length).toBeGreaterThan(1);
  const trace = page.getByTestId("advisor-trace").last();
  await trace.locator("summary").click();
  await expect(trace).toContainText("فهم الطلب");
  await expect(trace).toContainText("البحث في الكتالوج");
  const cooking = await askEvents(page, "عايز كورس طبخ");
  const answer = finalOf(cooking);
  await saveTranscript(testInfo, [finalOf(python), answer]);
  expect(answer.source).toBe("no_match");
  expect(answer.products).toEqual([]);
  await expect(page.locator("#ma-advisor-panel")).not.toContainText("ما لقيت لك نتيجة مطابقة");
});
