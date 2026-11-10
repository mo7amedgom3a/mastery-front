import { expect, test, type Page } from "@playwright/test";

import { customerApi, json, signInCustomer } from "./support";

const FETCHED_AT = "2026-11-09T08:25:50Z";
const COURSE_IMAGE = "https://s3.eu-west-1.amazonaws.com/course.emasteryacademy.com/7la124xvy2nxvjdfuzcyeqpdzi2fakcnmwjc1xymzrb7bq6x5s.png";

const SUMMARY = { bookmarks: 5, quizzes: 4, certificates: 2, assignments: 1, fetched_at: FETCHED_AT, cached: false };

const COURSES = {
  items: [
    {
      lms_course_id: 169,
      title: "قوانين التسويق",
      trainer: "ثابت حجازي",
      image_url: COURSE_IMAGE,
      course_link: "Mkt-Laws",
      course_kind: "recorded",
      course_type: null,
      progress_percent: 40,
      status: "in_progress",
      authorized: true,
      is_expired: false,
      started_at: "2026-09-01T00:00:00",
      expires_at: "2027-09-01T00:00:00",
      days_left: null,
      has_before_quiz: false,
      assignment_name: null,
      duration_seconds: 1928,
      product_id: null,
      product_slug: null,
      entitlement_id: null,
      last_activity_at: "2026-11-02T10:00:00Z",
    },
  ],
  page: 1,
  page_size: 50,
  total_pages: 1,
  fetched_at: FETCHED_AT,
  cached: false,
};

const QUIZZES = {
  items: [
    {
      lms_course_id: 169,
      course_title: "قوانين التسويق",
      course_image_url: COURSE_IMAGE,
      quiz_title: "اختبار الوحدة الأولى",
      passed: true,
      score: 18,
      max_score: 20,
      score_percent: 90,
      product_slug: null,
      entitlement_id: null,
    },
  ],
  total: 1,
  fetched_at: FETCHED_AT,
  cached: false,
};

const ENTITLEMENTS = {
  items: [
    {
      entitlement_id: "11111111-1111-4111-8111-111111111111",
      customer_id: "22222222-2222-4222-8222-222222222222",
      product_id: "33333333-3333-4333-8333-333333333333",
      product_type: "bundle",
      product_slug: "ai-data-career-bundle",
      product_title: "الذكاء الاصطناعي وتحليل البيانات",
      source_type: "order",
      source_id: "44444444-4444-4444-8444-444444444444",
      status: "active",
      starts_at: "2026-09-01T00:00:00Z",
      expires_at: null,
      created_at: "2026-09-01T00:00:00Z",
      fulfillment_status: "fulfilled",
      suspended_remaining_days: null,
      product_status: "published",
      progress_pct: 20,
      last_activity_at: "2026-11-02T10:00:00Z",
    },
    {
      entitlement_id: "55555555-5555-4555-8555-555555555555",
      customer_id: "22222222-2222-4222-8222-222222222222",
      product_id: "66666666-6666-4666-8666-666666666666",
      product_type: "package",
      product_slug: "package-2",
      product_title: "باقة التنمية الذاتية",
      source_type: "order",
      source_id: "77777777-7777-4777-8777-777777777777",
      status: "active",
      starts_at: "2026-09-01T00:00:00Z",
      expires_at: "2027-09-01T00:00:00Z",
      created_at: "2026-09-01T00:00:00Z",
      fulfillment_status: "fulfilled",
      suspended_remaining_days: null,
      product_status: "published",
      progress_pct: 40,
      last_activity_at: "2026-11-02T10:00:00Z",
    },
  ],
  total: 2,
  limit: 100,
  offset: 0,
};


const FILTER_PROGRAM_ID = "88888888-8888-4888-8888-888888888888";

function accessItem(overrides: Record<string, unknown>) {
  return {
    customer_id: "22222222-2222-4222-8222-222222222222",
    source_type: "order",
    source_id: "44444444-4444-4444-8444-444444444444",
    status: "active",
    starts_at: "2026-09-01T00:00:00Z",
    expires_at: "2027-09-01T00:00:00Z",
    created_at: "2026-09-01T00:00:00Z",
    fulfillment_status: "fulfilled",
    suspended_remaining_days: null,
    product_status: "published",
    progress_pct: 10,
    last_activity_at: null,
    category_id: null,
    category_name: null,
    program_ids: [],
    ...overrides,
  };
}

const FILTER_ENTITLEMENTS = {
  items: [
    accessItem({
      entitlement_id: "90000000-0000-4000-8000-000000000001",
      product_id: FILTER_PROGRAM_ID,
      product_slug: "test-program",
      product_title: "باقة الاختبار",
      product_type: "package",
      program_ids: [FILTER_PROGRAM_ID],
      category_id: "aaaa0000-0000-4000-8000-000000000001",
      category_name: "التطوير",
    }),
    accessItem({
      entitlement_id: "90000000-0000-4000-8000-000000000002",
      product_id: "90000000-0000-4000-8000-000000000102",
      product_slug: "test-course-a",
      product_title: "دورة القراءة السريعة",
      product_type: "course",
      program_ids: [FILTER_PROGRAM_ID],
      category_id: "aaaa0000-0000-4000-8000-000000000001",
      category_name: "التطوير",
    }),
    accessItem({
      entitlement_id: "90000000-0000-4000-8000-000000000003",
      product_id: "90000000-0000-4000-8000-000000000103",
      product_slug: "test-course-b",
      product_title: "مهارات العرض والتقديم",
      product_type: "course",
      program_ids: [FILTER_PROGRAM_ID],
      category_id: "aaaa0000-0000-4000-8000-000000000001",
      category_name: "التطوير",
    }),
    accessItem({
      entitlement_id: "90000000-0000-4000-8000-000000000004",
      product_id: "90000000-0000-4000-8000-000000000104",
      product_slug: "test-course-c",
      product_title: "أساسيات التسويق",
      product_type: "course",
      category_id: "aaaa0000-0000-4000-8000-000000000002",
      category_name: "التسويق",
    }),
  ],
  total: 4,
  limit: 100,
  offset: 0,
};

async function mockLms(page: Page): Promise<void> {
  await page.route("**/api/b2c/me/lms/summary", (route) => route.fulfill({ json: SUMMARY }));
  await page.route("**/api/b2c/me/lms/courses**", (route) => route.fulfill({ json: COURSES }));
  await page.route("**/api/b2c/me/lms/quizzes", (route) => route.fulfill({ json: QUIZZES }));
}

/**
 * The QA customer has no completed profile, so the home gate needs its onboarding skip. The LMS
 * calls themselves are intercepted so these tests don't depend on the legacy token's live state.
 */
async function skipOnboarding(context: Parameters<typeof signInCustomer>[0], baseURL: string): Promise<void> {
  const api = await customerApi();
  const me = await json<{ customer_id: string }>(await api.get("/api/v1/me"));
  await api.dispose();
  await context.addInitScript((customerId) => {
    try {
      localStorage.setItem(`mastery:onboarding-skipped:${customerId}`, "1");
    } catch {
      // Storage blocked: the redirect is harmless for these checks.
    }
  }, me.customer_id);
  await signInCustomer(context, baseURL);
}

test("the dashboard renders live LMS courses and quizzes", async ({ page, context, baseURL }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockLms(page);
  await skipOnboarding(context, baseURL!);

  await page.goto("/students");
  await expect(page.getByRole("heading", { name: "اختباراتك" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تقدّم التعلّم" })).toBeVisible();
  await expect(page.getByText("قوانين التسويق").first()).toBeVisible();
  await expect(page.getByText("اختبار الوحدة الأولى").first()).toBeVisible();
  await expect(page.getByText("بيانات تجريبية", { exact: true })).toHaveCount(0);
  // The hero card and the "قيد التعلّم" list both show the course cover the LMS returned.
  const covers = page.locator('img[src*="course.emasteryacademy.com"]');
  await expect(covers.first()).toBeVisible();
  expect(await covers.count()).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test("bundle and package cards open their contents instead of the LMS", async ({ page, context, baseURL }) => {
  await page.route("**/api/b2c/me/entitlements**", (route) => route.fulfill({ json: ENTITLEMENTS }));
  await page.route("**/api/b2c/me/lms/courses**", (route) => route.fulfill({ json: { ...COURSES, items: [] } }));
  await signInCustomer(context, baseURL!);

  await page.goto("/students/access");
  const details = page.getByRole("link", { name: /^عرض التفاصيل/ });
  await expect(details).toHaveCount(2);
  await expect(page.locator('a[href="/students/learning/bundle/ai-data-career-bundle"]')).toBeVisible();
  await expect(page.locator('a[href="/students/learning/package/2"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /كمّل التعلّم/ })).toHaveCount(0);
});

test("the learning page filters by program, category and name", async ({ page, context, baseURL }) => {
  await page.route("**/api/b2c/me/entitlements**", (route) => route.fulfill({ json: FILTER_ENTITLEMENTS }));
  await page.route("**/api/b2c/me/lms/courses**", (route) => route.fulfill({ json: { ...COURSES, items: [] } }));
  await signInCustomer(context, baseURL!);

  await page.goto("/students/access");
  await expect(page.locator("article")).toHaveCount(4);

  const program = page.getByLabel("تصفية حسب البرنامج");
  await program.selectOption(FILTER_PROGRAM_ID);
  await expect(page.locator("article")).toHaveCount(3);
  await expect(page.getByText("عرض 3 من 4")).toBeVisible();

  await program.selectOption("");
  const category = page.getByLabel("تصفية حسب التصنيف");
  await category.selectOption("aaaa0000-0000-4000-8000-000000000002");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByText("أساسيات التسويق")).toBeVisible();

  await category.selectOption("");
  await page.getByLabel("ابحث باسم الدورة أو البرنامج").fill("العرض");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.getByText("مهارات العرض والتقديم")).toBeVisible();
});

test("a consultation card opens the student consultation page", async ({ page, context, baseURL }) => {
  const consultation = accessItem({
    entitlement_id: "90000000-0000-4000-8000-00000000000c",
    product_id: "90000000-0000-4000-8000-00000000010c",
    product_slug: "consultation-37",
    product_title: "استشارة في الاكسيل",
    product_type: "consultation",
    category_id: "aaaa0000-0000-4000-8000-000000000003",
    category_name: "الاستشارات",
  });
  await page.route("**/api/b2c/me/entitlements**", (route) =>
    route.fulfill({ json: { items: [consultation], total: 1, limit: 100, offset: 0 } }),
  );
  await page.route("**/api/b2c/me/lms/courses**", (route) => route.fulfill({ json: { ...COURSES, items: [] } }));
  await signInCustomer(context, baseURL!);

  await page.goto("/students/access");
  const cta = page.getByRole("link", { name: /عرض تفاصيل الاستشارة/ });
  await expect(cta).toHaveAttribute("href", "/students/consultations/37");
  await expect(page.getByRole("button", { name: /كمّل التعلّم/ })).toHaveCount(0);
});

test("the learning page loads every entitlement page, not just the first 100", async ({ page, context, baseURL }) => {
  const offsets: number[] = [];
  await page.route("**/api/b2c/me/entitlements**", (route) => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 100);
    offsets.push(offset);
    const count = Math.max(0, Math.min(limit, 150 - offset));
    const items = Array.from({ length: count }, (_, index) =>
      accessItem({
        entitlement_id: `a0000000-0000-4000-8000-${String(offset + index).padStart(12, "0")}`,
        product_id: `b0000000-0000-4000-8000-${String(offset + index).padStart(12, "0")}`,
        product_slug: `test-course-${offset + index}`,
        product_title: `دورة رقم ${offset + index}`,
        product_type: "course",
      }),
    );
    return route.fulfill({ json: { items, total: 150, limit, offset } });
  });
  await page.route("**/api/b2c/me/lms/courses**", (route) => route.fulfill({ json: { ...COURSES, items: [] } }));
  await signInCustomer(context, baseURL!);

  await page.goto("/students/access");
  await expect(page.locator("article")).toHaveCount(150, { timeout: 15_000 });
  expect(new Set(offsets)).toEqual(new Set([0, 100]));
});

test("the exams page shows recorded LMS results", async ({ page, context, baseURL }) => {
  await mockLms(page);
  await signInCustomer(context, baseURL!);

  await page.goto("/students/exams");
  await expect(page).toHaveURL(/\/students\/exams$/);
  await expect(page.getByRole("heading", { name: "اختباراتي", level: 1 })).toBeVisible();
  await expect(page.getByText("اختبار الوحدة الأولى").first()).toBeVisible();
  await expect(page.getByText("ناجح").first()).toBeVisible();
  await expect(page.locator('nav[aria-label="حسابي"] a[aria-current="page"]')).toContainText("اختباراتي");
});

test("the learning-progress page shows live LMS courses and quick numbers", async ({ page, context, baseURL }) => {
  await mockLms(page);
  await signInCustomer(context, baseURL!);

  await page.goto("/students/progress");
  await expect(page).toHaveURL(/\/students\/progress$/);
  await expect(page.getByRole("heading", { name: "تقدّم التعلّم", level: 1 })).toBeVisible();
  await expect(page.getByText("قوانين التسويق").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "ملخّص سريع" })).toBeVisible();
  await expect(page.locator('img[src*="course.emasteryacademy.com"]').first()).toBeVisible();
  await expect(page.locator('nav[aria-label="حسابي"] a[aria-current="page"]')).toContainText("تقدّم التعلّم");
});

test("an expired LMS session shows a reauthentication notice", async ({ page, context, baseURL }) => {
  await page.route("**/api/b2c/me/lms/summary", (route) => route.fulfill({ json: SUMMARY }));
  await page.route("**/api/b2c/me/lms/courses**", (route) => route.fulfill({ json: COURSES }));
  await page.route("**/api/b2c/me/lms/quizzes", (route) =>
    route.fulfill({
      status: 409,
      json: { detail: { code: "lms_reauth_required", message: "LMS session expired" } },
    }),
  );
  await signInCustomer(context, baseURL!);

  await page.goto("/students/exams");
  await expect(page.getByText("انتهت جلسة منصة التعلّم").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "تسجيل الدخول" })).toBeVisible();
});
