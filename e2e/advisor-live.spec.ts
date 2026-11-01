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
  await page.getByRole("button", { name: "تحليل الاحتياجات", exact: true }).click();
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
  let answer = await ask(page, "عايز اتعلم التسويق");
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
    const first = await ask(page, "عايز اتعلم التعامل مع شكاوي العملاء");
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
    await page.getByRole("button", { name: "سريع", exact: true }).click();
    const fast = await ask(page, "عايز أشوف دورات تسويق المحتوى");
    transcript.push(fast);
    expect(fast.mode).toBe("fast");
    expect(fast.conversation_id).toBe(id);
    await page.getByRole("button", { name: "تحليل الاحتياجات", exact: true }).click();
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
    const first = await ask(page, "عايز اتعلم تحليل البيانات لنفسي");
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
