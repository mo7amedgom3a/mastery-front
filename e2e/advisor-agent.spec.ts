import { expect, test, type Page } from "@playwright/test";

/**
 * The advisor widget against a scripted, truly incremental SSE stream: "I don't know" replies,
 * closed questions (pick or type), progressive text and the live step timeline. Deterministic: no
 * backend or model is involved. The live counterpart is `advisor-live.spec.ts`.
 */

const id = "10000000-0000-4000-8000-000000000002";
type Frame = Record<string, unknown>;

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (error) => found.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

function answer(overrides: Record<string, unknown>) {
  return {
    conversation_id: id, message_id: null, answer: "", intent: "course_search", source: "llm", cached: false, mode: "fast",
    products: [], follow_up_questions: [], clarification_needed: false, clarification: null, needs_analysis: null, ...overrides,
  };
}

/** Text split the way the backend's `chunk_text` does: a few words per token event. */
function tokens(text: string): Frame[] {
  const parts = text.match(/\S+\s*|\s+/g) ?? [];
  const frames: Frame[] = [];
  for (let index = 0; index < parts.length; index += 3) frames.push({ type: "token", text: parts.slice(index, index + 3).join("") });
  return frames;
}

/**
 * Replaces `fetch("/api/advisor/stream")` in the page with a stream that sends each script's frames
 * one by one, `delay` ms apart. Scripts are matched by question; every request body is recorded.
 */
async function scriptStream(page: Page, scripts: Record<string, Frame[]>, delay = 120) {
  await page.addInitScript(
    ({ scripts, delay }) => {
      const w = window as unknown as { __advisorRequests: Record<string, unknown>[] };
      w.__advisorRequests = [];
      const original = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (!url.endsWith("/api/advisor/stream")) return original(input, init);
        const body = JSON.parse(String(init?.body ?? "{}"));
        w.__advisorRequests.push(body);
        const frames = scripts[body.question] ?? scripts["*"] ?? [];
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            for (const frame of frames) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
            }
            controller.close();
          },
        });
        return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
      };
    },
    { scripts, delay },
  );
}

const requests = (page: Page) => page.evaluate(() => (window as unknown as { __advisorRequests: Record<string, unknown>[] }).__advisorRequests);

async function open(page: Page) {
  await page.route("**/api/b2c/advisor/suggestions*", (route) => route.fulfill({ json: { items: [] } }));
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: { customer: { customer_id: id, email: "test@example.test", full_name: "Test" }, refreshable: false } }),
  );
  await page.goto("/");
  await page.locator("#ma-advisor-launcher").click();
}

async function send(page: Page, text: string) {
  await page.locator("#ma-advisor-input").fill(text);
  await page.locator("#ma-advisor-input").press("Enter");
}

const panel = (page: Page) => page.locator("#ma-advisor-panel");
const lastAnswer = (page: Page) => panel(page).locator("[aria-busy]").last();

test("gibberish gets an honest 'I don't know' with choices, never a recommendation", async ({ page }) => {
  const reply = "ما فهمت قصدك بـ«بتنببنتنتب» 🤔 ما أقدر أرشّح لك شي وأنا مو متأكد من طلبك.\nاختر المجال اللي يهمك، أو اكتب سؤالك بطريقة ثانية:";
  const options = ["الذكاء الاصطناعي وتكنلوجيا المعلومات", "التسويق المتكامل", "أبغى أسأل عن المنصة"];
  await scriptStream(page, {
    "*": [
      { type: "run_started", conversation_id: id, mode: "fast" },
      { type: "step", stage: "understand", status: "unknown", public: { unknown_terms: ["بتنببنتنتب"] } },
      ...tokens(reply),
      { type: "final", answer: answer({ answer: reply, intent: "clarification", source: "unknown", follow_up_questions: options }) },
    ],
  });
  await open(page);
  await send(page, "عايز اتعلم بتنببنتنتب");

  await expect(lastAnswer(page)).toContainText("ما فهمت قصدك");
  await expect(page.locator("#ma-advisor-panel a[href*='/products/'], #ma-advisor-panel a[href*='/courses/']")).toHaveCount(0);
  // The reply offers its own choices instead of the generic catalog guide.
  await expect(page.getByText("ما لقيت لك نتيجة مطابقة")).toHaveCount(0);
  await expect(page.getByText("اختر إجابة أو اكتبها بنفسك")).toBeVisible();
  for (const option of options) await expect(panel(page).getByRole("button", { name: option, exact: true })).toBeVisible();
  const trace = page.getByTestId("advisor-trace").last();
  await trace.locator("summary").click();
  await expect(trace).toContainText("ما قدرت أفهم الطلب");
  await expect(trace).toContainText("«بتنببنتنتب»");

  // "Type your own answer" hands the keyboard to the input.
  await page.getByRole("button", { name: "اكتب إجابتك بنفسك" }).click();
  await expect(page.locator("#ma-advisor-input")).toBeFocused();
});

test("the answer streams progressively while the agent's steps fill in live", async ({ page }) => {
  const reply = "اخترت لك خيارين في بايثون من الكتالوج:\n• أساسيات لغة البرمجة PYTHON — 79.00 USD\n• استشارة في أساسيات لغة البرمجة PYTHON — 129.00 USD\nإذا قلت لي ميزانيتك أطلع لك الأنسب سعرًا.";
  await scriptStream(
    page,
    {
      "*": [
        { type: "run_started", conversation_id: id, mode: "fast" },
        { type: "step", stage: "normalize", status: "done" },
        {
          type: "step", stage: "understand", status: "done",
          public: { intent: "course_search", topic: "بايثون", corrections: { "بايثن": "Python" }, corrected: "عايز اتعلم Python من الصفر" },
        },
        { type: "step", stage: "intent", status: "done", public: { intent: "course_search", level: "beginner" } },
        { type: "step", stage: "exact_cache", status: "miss", public: { hit: false } },
        { type: "step", stage: "retrieval", status: "done", public: { count: 2, titles: ["أساسيات لغة البرمجة PYTHON"] } },
        { type: "thought", step: 1, text: "المستوى مبتدئ، أرتب الأساسيات أول." },
        { type: "step", stage: "compose", status: "done", public: {} },
        ...tokens(reply),
        { type: "final", answer: answer({ answer: reply, follow_up_questions: ["أقل من 150 دولار", "سوّ لي خطة لتعلم بايثون"] }) },
      ],
    },
    150,
  );
  await open(page);
  await send(page, "عايز اتعلم بايثن من الصفر");

  // Before any text: the bubble names the current step, not a static "لحظة أشوف لك…".
  const trace = page.getByTestId("advisor-trace").last();
  await expect(trace).toHaveAttribute("open", "");
  await expect(trace).toContainText("فهم الطلب");
  await expect(trace).toContainText("صحّحت «بايثن» ← Python");
  await expect(trace).toContainText("يبحث عن برنامج");
  await expect(trace).toContainText("البحث في الكتالوج");
  await expect(trace).toContainText("نتيجتين");
  await expect(trace).toContainText("المستوى مبتدئ");
  // Hidden plumbing (normalize, a cache miss) is not a visible step.
  await expect(trace.locator("li")).toHaveCount(4);

  // Text arrives in pieces: part of it is visible while the run is still going.
  await expect(lastAnswer(page)).toContainText("اخترت لك خيارين");
  await expect(lastAnswer(page)).toHaveAttribute("aria-busy", "true");
  await expect(lastAnswer(page)).not.toContainText("الأنسب سعرًا");
  await expect(lastAnswer(page)).toContainText("الأنسب سعرًا");
  await expect(lastAnswer(page)).toHaveAttribute("aria-busy", "false");

  // Once done the timeline folds into one line and can be reopened.
  await expect(trace).not.toHaveAttribute("open", "");
  await expect(trace.locator("summary")).toContainText("فكّرت في 4 خطوات");
  await trace.locator("summary").click();
  await expect(trace.getByText("البحث في الكتالوج")).toBeVisible();
});

test("a closed question can be answered by a chip or by typing", async ({ page }) => {
  const question = "بالنسبة لـ«تحليل البيانات»، وش مستواك الحالي؟";
  const options = ["مبتدئ من الصفر", "عندي أساس بسيط", "عندي خبرة عملية"];
  const ask = [
    { type: "run_started", conversation_id: id, mode: "reasoning" },
    { type: "step", stage: "discovery", status: "started" },
    { type: "step", stage: "understand", status: "done", public: { intent: "needs_analysis", goal: "تحليل البيانات" } },
    { type: "thought", step: 0, text: "الهدف واضح: «تحليل البيانات». ناقص أعرف مستواك الحالي عشان أرشّح بدقة." },
    { type: "ask_user", question, options, slots: ["current_situation"], allow_free_text: true },
    ...tokens(question),
    {
      type: "final",
      answer: answer({
        answer: question, mode: "reasoning", intent: "study_plan", source: "clarification", clarification_needed: true,
        follow_up_questions: options, clarification: { question, options, slots: ["current_situation"], allow_free_text: true },
        needs_analysis: {
          status: "discovering", customer_type: "individual", question_count: 1, needs_summary: "", pain_points: [], reported_gaps: [],
          skills_to_assess: [], possible_non_training_causes: [], recommended_actions: [], product_matches: [], success_measures: [], uncertainties: [],
        },
      }),
    },
  ];
  await scriptStream(page, { "*": ask }, 40);
  await open(page);
  await send(page, "عايز اتعلم تحليل البيانات");

  const group = page.getByRole("group", { name: "اختر إجابة أو اكتبها بنفسك" }).last();
  await expect(group).toBeVisible();
  for (const option of options) await expect(group.getByRole("button", { name: option, exact: true })).toBeVisible();
  await expect(group.getByRole("button", { name: "اكتب إجابتك بنفسك" })).toBeVisible();
  const trace = page.getByTestId("advisor-trace").last();
  await trace.locator("summary").click();
  await expect(trace).toContainText("سؤال لك");
  await expect(trace).toContainText("ناقص أعرف مستواك");

  // Pick a choice: its text is the next message, in the same conversation.
  await group.getByRole("button", { name: "عندي أساس بسيط", exact: true }).click();
  await expect.poll(async () => (await requests(page)).length).toBe(2);
  expect((await requests(page))[1]).toMatchObject({ question: "عندي أساس بسيط", conversation_id: id });
  expect((await requests(page))[1]).not.toHaveProperty("mode");

  // Or type a custom answer.
  await expect(page.locator("#ma-advisor-input")).toBeEnabled();
  await page.getByRole("button", { name: "اكتب إجابتك بنفسك" }).last().click();
  await page.keyboard.type("أستخدم إكسل في الشغل بس");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await requests(page)).length).toBe(3);
  expect((await requests(page))[2]).toMatchObject({ question: "أستخدم إكسل في الشغل بس", conversation_id: id });
});

test("a topic the catalog doesn't cover says so, with no products or catalog guide", async ({ page }) => {
  const reply = "ما أعرف عندنا محتوى عن «الطبخ» حالياً، وما أبغى أرشّح لك شي ما يناسب طلبك.\nتقدر تختار مجال من المجالات المتوفرة عندنا:";
  await scriptStream(page, {
    "*": [
      { type: "run_started", conversation_id: id, mode: "fast" },
      { type: "step", stage: "understand", status: "done", public: { intent: "course_search", topic: "الطبخ" } },
      { type: "step", stage: "retrieval", status: "done", public: { count: 0, titles: [] } },
      { type: "step", stage: "no_match", status: "done", public: { topic: "الطبخ" } },
      ...tokens(reply),
      { type: "final", answer: answer({ answer: reply, source: "no_match", follow_up_questions: ["التسويق المتكامل"] }) },
    ],
  });
  await open(page);
  await send(page, "عايز كورس طبخ");
  await expect(lastAnswer(page)).toContainText("ما أعرف عندنا محتوى عن «الطبخ»");
  await expect(page.getByText("ما لقيت لك نتيجة مطابقة")).toHaveCount(0);
  await expect(panel(page).getByRole("button", { name: "التسويق المتكامل", exact: true })).toBeVisible();
  const trace = page.getByTestId("advisor-trace").last();
  await trace.locator("summary").click();
  await expect(trace).toContainText("بدون نتائج");
  await expect(trace).toContainText("ما لقيت شي مناسب في الكتالوج");
});
