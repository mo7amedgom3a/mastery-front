import { QueryClient } from "@tanstack/react-query";

import {
  ApiError,
  apiRequest,
  getCurrentAuthUser,
  catalogKeys,
  customerKeys,
  login,
  logout as authLogout,
  refreshSession,
  register,
  getCatalogCategories,
  getCatalogCategory,
  getCatalogProduct,
  getCatalogProducts,
  getCatalogRelatedResources,
  getCatalogResource,
  getDatabaseHealth,
  getHealth,
  getLegacyCategories,
  getLegacyCategory,
  getLegacyCategoryCourses,
  getLegacyCategoryInstructors,
  getLegacyConsultation,
  getLegacyConsultations,
  getLegacyCourse,
  getLegacyCoursePrices,
  getLegacyCourses,
  getLegacyDiploma,
  getLegacyDiplomas,
  getLegacyInsights,
  getLegacyInstructor,
  getLegacyInstructorCategories,
  getLegacyInstructorCourses,
  getLegacyInstructorDiplomas,
  getLegacyInstructorPackages,
  getLegacyInstructors,
  getLegacyLandingPage,
  getLegacyPackage,
  getLegacyPackages,
  getLegacyRelatedResources,
  getLegacyResourceRecommendations,
  getLandingRecommendations,
  getLearningProfile,
  getMe,
  getMyRecommendations,
  getOnboardingQuestions,
  getProductRecommendations,
  getProductTypes,
  getRecommendationContext,
  getRecommendationRebuildJob,
  getSearchInstructorDetails,
  getSearchInstructors,
  getSearchOptions,
  getSearchProductDetails,
  getSkills,
  getWishlistItems,
  healthKeys,
  healthQueries,
  recommendationKeys,
  searchKeys,
  searchProducts,
  advancedSearch,
  updateMe,
  upsertLearningProfile,
  setTargetSkills,
  completeOnboarding,
  addWishlistItem,
  removeWishlistItem,
  rebuildRecommendations,
  verifyTwoFactor,
} from "../src/lib/api";

const DEFAULT_CUSTOMER_ID = "F6A8D4F2-FC4F-4126-B4DD-C520F4289107";
const args = new Set(process.argv.slice(2));
const includeMutations = args.has("--include-mutations");
const includeAdmin = args.has("--include-admin");
const failOnSkip = args.has("--fail-on-skip");
const customerId = process.env.API_TEST_CUSTOMER_ID ?? DEFAULT_CUSTOMER_ID;
const authToken = process.env.API_TEST_AUTH_TOKEN;
const rebuildToken = process.env.RECOMMENDATION_REBUILD_TOKEN;

type TestStatus = "pass" | "fail" | "skip";

type TestResult = {
  name: string;
  status: TestStatus;
  ms: number;
  detail?: string;
};

type Page<T> = {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
};

type CatalogProduct = {
  product_id: string;
  slug: string;
  resource_id?: string | null;
  category_id?: string | null;
};

type LegacyItem = {
  id: number;
};

type TestContext = {
  catalogProduct?: CatalogProduct;
  catalogCategoryId?: string;
  catalogResourceId?: string;
  legacyCategoryId?: number;
  legacyCourseId?: number;
  legacyDiplomaId?: number;
  legacyPackageId?: number;
  legacyConsultationId?: number;
  legacyInstructorId?: number;
  searchProductSlug?: string;
  searchTrainerId?: number;
  recommendationJobId?: string;
  wishlistProductId?: string;
  skillIds?: string[];
  onboardingQuestion?: Record<string, unknown>;
};

type LiveTest = {
  name: string;
  mutates?: boolean;
  admin?: boolean;
  auth?: boolean;
  run: (ctx: TestContext) => Promise<void>;
};

class SkipTest extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkipTest";
  }
}

async function main() {
  console.log(`API base URL: ${process.env.API_BASE_URL ?? "http://localhost:8000/api/v1"}`);
  console.log("Customer auth: cookie/JWT credentials");
  console.log(`Mutating endpoint tests: ${includeMutations ? "enabled" : "skipped"}`);
  console.log(`Admin endpoint tests: ${includeAdmin ? "enabled" : "skipped"}`);
  console.log(`Authenticated endpoint tests: ${authToken ? "enabled" : "skipped"}`);

  const results: TestResult[] = [];
  const ctx: TestContext = {};

  for (const test of clientBehaviorTests()) {
    results.push(await runTest(test.name, () => test.run(ctx)));
  }

  for (const test of liveEndpointTests()) {
    if (test.mutates && !includeMutations) {
      results.push({ name: test.name, status: "skip", ms: 0, detail: "Run with --include-mutations" });
      continue;
    }

    if (test.auth && !authToken) {
      results.push({ name: test.name, status: "skip", ms: 0, detail: "Set API_TEST_AUTH_TOKEN" });
      continue;
    }

    if (test.admin && (!includeAdmin || !rebuildToken)) {
      results.push({
        name: test.name,
        status: "skip",
        ms: 0,
        detail: "Run with --include-admin and RECOMMENDATION_REBUILD_TOKEN",
      });
      continue;
    }

    results.push(await runTest(test.name, () => test.run(ctx)));
  }

  printSummary(results);

  const failed = results.some((result) => result.status === "fail");
  const skipped = results.some((result) => result.status === "skip");

  if (failed || (failOnSkip && skipped)) {
    process.exitCode = 1;
  }
}

function clientBehaviorTests(): LiveTest[] {
  return [
    {
      name: "client builds URLs, query params, JSON headers, and context headers",
      run: async () => {
        const originalFetch = globalThis.fetch;
        let capturedUrl = "";
        let capturedHeaders: Headers | undefined;
        let capturedBody = "";

        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          capturedUrl = String(input);
          capturedHeaders = new Headers(init?.headers);
          capturedBody = String(init?.body);
          return jsonResponse({ ok: true });
        }) as typeof fetch;

        try {
          await apiRequest("POST", "/api/v1/health", {
            body: { ping: true },
            query: { a: [1, 2], b: true, empty: null },
            context: {
              rebuildToken: "test-rebuild-token",
              requestId: "api-layer-test",
            },
          });
        } finally {
          globalThis.fetch = originalFetch;
        }

        assert(capturedUrl.includes("/api/v1/health?"), "expected /api/v1/health URL");
        assert(!capturedUrl.includes("/api/v1/api/v1"), "URL must not double-prefix /api/v1");
        assert(capturedUrl.includes("a=1") && capturedUrl.includes("a=2"), "array query params missing");
        assert(capturedUrl.includes("b=true"), "boolean query param missing");
        assert(!capturedUrl.includes("empty="), "null query params should be omitted");
        assert(capturedHeaders?.get("Content-Type") === "application/json", "Content-Type should be JSON");
        assert(!capturedHeaders?.has("X-Customer-Id"), "customer identity must not be sent as a header");
        assert(capturedHeaders?.get("X-Recommendation-Rebuild-Token") === "test-rebuild-token", "rebuild header missing");
        assert(capturedHeaders?.get("X-Request-ID") === "api-layer-test", "request id header missing");
        assert(capturedBody === JSON.stringify({ ping: true }), "JSON body was not serialized");
      },
    },
    {
      name: "client maps backend errors to ApiError with request metadata",
      run: async () => {
        const originalFetch = globalThis.fetch;

        globalThis.fetch = (async () =>
          jsonResponse(
            { detail: "Too many requests" },
            {
              status: 429,
              headers: {
                "Retry-After": "60",
                "X-Request-ID": "rate-limit-test",
              },
            },
          )) as typeof fetch;

        try {
          await apiRequest("GET", "/api/v1/health");
          throw new Error("Expected apiRequest to throw");
        } catch (error) {
          assert(error instanceof ApiError, "expected ApiError");
          assert(error.status === 429, "expected 429 status");
          assert(error.message === "Too many requests", "expected backend detail message");
          assert(error.details.retryAfter === "60", "expected Retry-After metadata");
          assert(error.details.requestId === "rate-limit-test", "expected X-Request-ID metadata");
        } finally {
          globalThis.fetch = originalFetch;
        }
      },
    },
    {
      name: "auth client sends cookies and maps auth endpoint contracts",
      run: async () => {
        const originalFetch = globalThis.fetch;
        const calls: Array<{ url: string; init?: RequestInit }> = [];

        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          calls.push({ url: String(input), init });

          if (String(input).endsWith("/auth/register")) {
            return jsonResponse({ registered: true, provider: "legacy_email", provider_response: "Did" });
          }

          if (String(input).endsWith("/auth/login")) {
            return jsonResponse({ email: "customer@example.test", userId: "100497", requires2fa: true });
          }

          if (String(input).endsWith("/auth/2fa/check") || String(input).endsWith("/auth/refresh")) {
            return jsonResponse({
              customer: {
                customer_id: customerId,
                email: "customer@example.test",
                status: "active",
                full_name: "Customer",
              },
              provider: "legacy_email",
              tokens: {
                access_token: "redacted-access",
                refresh_token: "redacted-refresh",
                token_type: "bearer",
                expires_in: 900,
                refresh_expires_in: 864000,
              },
              legacy: null,
            });
          }

          if (String(input).endsWith("/auth/me")) {
            return jsonResponse({
              customer_id: customerId,
              email: "customer@example.test",
              status: "active",
              full_name: "Customer",
            });
          }

          if (String(input).endsWith("/auth/logout")) {
            return new Response(null, { status: 204 });
          }

          return jsonResponse({ detail: "unexpected auth test URL" }, { status: 500 });
        }) as typeof fetch;

        try {
          await register({
            email: "customer@example.test",
            password: "secret123!",
            repassword: "secret123!",
            fullname: "Customer",
            acceptterms: true,
          });
          await login({ loginName: "customer@example.test" });
          await verifyTwoFactor({ email: "customer@example.test", userId: "100497", code: "123456" });
          await refreshSession();
          await getCurrentAuthUser();
          await authLogout();
        } finally {
          globalThis.fetch = originalFetch;
        }

        assert(calls.length === 6, `expected 6 auth calls, got ${calls.length}`);
        assert(calls.every((call) => call.init?.credentials === "include"), "auth calls must include cookies");
        assert(calls.some((call) => call.url.endsWith("/api/v1/auth/2fa/check")), "2FA path was not called");
        assert(calls.some((call) => call.init?.method === "POST" && call.url.endsWith("/api/v1/auth/logout")), "logout POST was not called");
      },
    },
    {
      name: "React Query caching reuses fresh query data",
      run: async () => {
        const originalFetch = globalThis.fetch;
        let calls = 0;

        globalThis.fetch = (async () => {
          calls += 1;
          return jsonResponse({
            status: "ok",
            service: "api-test",
            version: "test",
            environment: "test",
          });
        }) as typeof fetch;

        try {
          const queryClient = new QueryClient();
          await queryClient.prefetchQuery(healthQueries.status());
          await queryClient.prefetchQuery(healthQueries.status());
        } finally {
          globalThis.fetch = originalFetch;
        }

        assert(calls === 1, `expected one fetch call for fresh cached query, got ${calls}`);
        assertStableKey(healthKeys.status(), healthKeys.status(), "health status key");
        assertStableKey(catalogKeys.products({ limit: 1 }), catalogKeys.products({ limit: 1 }), "catalog products key");
        assertStableKey(customerKeys.me(), customerKeys.me(), "customer key");
        assertStableKey(recommendationKeys.landing({ limit: 1 }), recommendationKeys.landing({ limit: 1 }), "recommendation key");
        assertStableKey(searchKeys.results({ q: "test", limit: 1 }), searchKeys.results({ q: "test", limit: 1 }), "search key");
      },
    },
  ];
}

function liveEndpointTests(): LiveTest[] {
  return [
    { name: "GET /api/v1/health", run: async () => assertObject(await getHealth()) },
    { name: "GET /api/v1/health/database", run: async () => assertObject(await getDatabaseHealth()) },
    { name: "GET /api/v1/catalog/product-types", run: async () => assertArray(await getProductTypes()) },
    { name: "GET /api/v1/catalog/categories", run: async (ctx) => {
      const categories = await getCatalogCategories();
      assertArray(categories);
      ctx.catalogCategoryId = firstValue(categories, "category_id");
    } },
    { name: "GET /api/v1/catalog/categories/{category_id}", run: async (ctx) => {
      const categoryId = requireValue(ctx.catalogCategoryId, "No catalog category_id from /catalog/categories");
      assertObject(await getCatalogCategory(categoryId));
    } },
    { name: "GET /api/v1/catalog/products", run: async (ctx) => {
      const page = await getCatalogProducts({ limit: 5, offset: 0 });
      assertPage(page);
      const product = page.items[0] as CatalogProduct | undefined;
      if (product) {
        ctx.catalogProduct = product;
        ctx.searchProductSlug = product.slug;
        ctx.catalogResourceId = product.resource_id ?? undefined;
        ctx.wishlistProductId = product.product_id;
      }
    } },
    { name: "GET /api/v1/catalog/products/{slug}", run: async (ctx) => {
      const product = requireValue(ctx.catalogProduct, "No catalog product from /catalog/products");
      const detail = await getCatalogProduct(product.slug);
      assertObject(detail);
      const resourceId = firstValue<string>((detail as { resources?: Record<string, unknown>[] }).resources ?? [], "resource_id");
      ctx.catalogResourceId = resourceId ?? ctx.catalogResourceId;
    } },
    { name: "GET /api/v1/catalog/resources/{resource_id}", run: async (ctx) => {
      const resourceId = requireValue(ctx.catalogResourceId, "No resource_id from catalog product/detail data");
      assertObject(await getCatalogResource(resourceId));
    } },
    { name: "GET /api/v1/catalog/resources/{resource_id}/related", run: async (ctx) => {
      const resourceId = requireValue(ctx.catalogResourceId, "No resource_id from catalog product/detail data");
      assertObject(await getCatalogRelatedResources(resourceId, { limit: 5 }));
    } },
    { name: "GET /api/v1/me", auth: true, run: async () => assertObject(await getMe(customerOptions())) },
    { name: "PATCH /api/v1/me", auth: true, mutates: true, run: async () => {
      const me = await getMe(customerOptions());
      assertObject(await updateMe({
        full_name: me.full_name ?? undefined,
        country_code: me.country_code ?? undefined,
        preferred_currency: me.preferred_currency ?? undefined,
        preferred_locale: me.preferred_locale ?? undefined,
      }, customerOptions()));
    } },
    { name: "GET /api/v1/me/learning-goal-profile", auth: true, run: async () => assertObject(await getLearningProfile(customerOptions())) },
    { name: "PUT /api/v1/me/learning-goal-profile", auth: true, mutates: true, run: async () => {
      assertObject(await upsertLearningProfile({
        goal: "API layer smoke test",
        domain: "frontend api integration",
        current_level: "testing",
        daily_study_minutes: 15,
        target_skill_ids: [],
      }, customerOptions()));
    } },
    { name: "GET /api/v1/me/skills", auth: true, run: async (ctx) => {
      const skills = await getSkills();
      assertArray(skills);
      ctx.skillIds = skills.slice(0, 2).map((skill) => String((skill as { skill_id?: string }).skill_id)).filter(Boolean);
    } },
    { name: "PUT /api/v1/me/skills", auth: true, mutates: true, run: async (ctx) => {
      assertArray(await setTargetSkills({ skill_ids: ctx.skillIds ?? [], source: "api-layer-test" }, customerOptions()));
    } },
    { name: "GET /api/v1/me/onboarding/questions", auth: true, run: async (ctx) => {
      const questions = await getOnboardingQuestions();
      assertArray(questions);
      ctx.onboardingQuestion = questions[0] as Record<string, unknown> | undefined;
    } },
    { name: "POST /api/v1/me/onboarding/answers", auth: true, mutates: true, run: async (ctx) => {
      const question = requireValue(ctx.onboardingQuestion, "No onboarding question from /me/onboarding/questions");
      const questionId = String(question.question_id);
      const options = (question.options as Record<string, unknown>[] | undefined) ?? [];
      const firstOption = options[0];
      assertArray(await completeOnboarding({
        answers: [{
          question_id: questionId,
          answer_key: firstOption ? String(firstOption.key) : "api-layer-test",
          answer_text: firstOption ? undefined : "API layer smoke test",
          selected_skill_ids: ctx.skillIds ?? [],
          raw_answer: firstOption ?? { source: "api-layer-test" },
        }],
      }, customerOptions()));
    } },
    { name: "GET /api/v1/me/recommendation-context", auth: true, run: async () => assertObject(await getRecommendationContext(customerOptions())) },
    { name: "GET /api/v1/me/wishlist", auth: true, run: async () => assertPage(await getWishlistItems({ limit: 5, offset: 0 }, customerOptions())) },
    { name: "POST /api/v1/me/wishlist", auth: true, mutates: true, run: async (ctx) => {
      const productId = requireValue(ctx.wishlistProductId, "No product_id from /catalog/products");
      assertObject(await addWishlistItem({ product_id: productId }, customerOptions()));
    } },
    { name: "DELETE /api/v1/me/wishlist/{product_id}", auth: true, mutates: true, run: async (ctx) => {
      const productId = requireValue(ctx.wishlistProductId, "No product_id from /catalog/products");
      await removeWishlistItem(productId, customerOptions());
    } },
    { name: "GET /api/v1/legacy/landing-page", run: async () => assertObject(await getLegacyLandingPage()) },
    { name: "GET /api/v1/legacy/insights", run: async () => assertObject(await getLegacyInsights()) },
    { name: "GET /api/v1/legacy/categories", run: async (ctx) => {
      const page = await getLegacyCategories({ limit: 5, offset: 0 });
      assertPage(page);
      ctx.legacyCategoryId = firstId(page.items);
    } },
    { name: "GET /api/v1/legacy/categories/{category_id}", run: async (ctx) => assertObject(await getLegacyCategory(requireValue(ctx.legacyCategoryId, "No legacy category id"))) },
    { name: "GET /api/v1/legacy/categories/{category_id}/courses", run: async (ctx) => assertPage(await getLegacyCategoryCourses(requireValue(ctx.legacyCategoryId, "No legacy category id"), { limit: 5, offset: 0 })) },
    { name: "GET /api/v1/legacy/categories/{category_id}/instructors", run: async (ctx) => assertPage(await getLegacyCategoryInstructors(requireValue(ctx.legacyCategoryId, "No legacy category id"), { limit: 5, offset: 0 })) },
    { name: "GET /api/v1/legacy/instructors", run: async (ctx) => {
      const page = await getLegacyInstructors({ limit: 5, offset: 0 });
      assertPage(page);
      ctx.legacyInstructorId = firstId(page.items);
    } },
    { name: "GET /api/v1/legacy/instructors/{instructor_id}", run: async (ctx) => assertObject(await getLegacyInstructor(requireValue(ctx.legacyInstructorId, "No legacy instructor id"))) },
    { name: "GET /api/v1/legacy/instructors/{instructor_id}/courses", run: async (ctx) => assertPage(await getLegacyInstructorCourses(requireValue(ctx.legacyInstructorId, "No legacy instructor id"), { limit: 5, offset: 0 })) },
    { name: "GET /api/v1/legacy/instructors/{instructor_id}/diplomas", run: async (ctx) => assertPage(await getLegacyInstructorDiplomas(requireValue(ctx.legacyInstructorId, "No legacy instructor id"), { limit: 5, offset: 0 })) },
    { name: "GET /api/v1/legacy/instructors/{instructor_id}/packages", run: async (ctx) => assertPage(await getLegacyInstructorPackages(requireValue(ctx.legacyInstructorId, "No legacy instructor id"), { limit: 5, offset: 0 })) },
    { name: "GET /api/v1/legacy/instructors/{instructor_id}/categories", run: async (ctx) => assertPage(await getLegacyInstructorCategories(requireValue(ctx.legacyInstructorId, "No legacy instructor id"), { limit: 5, offset: 0 })) },
    { name: "GET /api/v1/legacy/courses", run: async (ctx) => {
      const page = await getLegacyCourses({ limit: 5, offset: 0 });
      assertPage(page);
      ctx.legacyCourseId = firstId(page.items);
    } },
    { name: "GET /api/v1/legacy/courses/{course_id}", run: async (ctx) => assertObject(await getLegacyCourse(requireValue(ctx.legacyCourseId, "No legacy course id"))) },
    { name: "GET /api/v1/legacy/courses/{course_id}/prices", run: async (ctx) => assertArray(await getLegacyCoursePrices(requireValue(ctx.legacyCourseId, "No legacy course id"))) },
    { name: "GET /api/v1/legacy/diplomas", run: async (ctx) => {
      const page = await getLegacyDiplomas({ limit: 5, offset: 0 });
      assertPage(page);
      ctx.legacyDiplomaId = firstId(page.items);
    } },
    { name: "GET /api/v1/legacy/diplomas/{diploma_id}", run: async (ctx) => assertObject(await getLegacyDiploma(requireValue(ctx.legacyDiplomaId, "No legacy diploma id"))) },
    { name: "GET /api/v1/legacy/packages", run: async (ctx) => {
      const page = await getLegacyPackages({ limit: 5, offset: 0 });
      assertPage(page);
      ctx.legacyPackageId = firstId(page.items);
    } },
    { name: "GET /api/v1/legacy/packages/{package_id}", run: async (ctx) => assertObject(await getLegacyPackage(requireValue(ctx.legacyPackageId, "No legacy package id"))) },
    { name: "GET /api/v1/legacy/consultations", run: async (ctx) => {
      const page = await getLegacyConsultations({ limit: 5, offset: 0 });
      assertPage(page);
      ctx.legacyConsultationId = firstId(page.items);
    } },
    { name: "GET /api/v1/legacy/consultations/{consultation_id}", run: async (ctx) => assertObject(await getLegacyConsultation(requireValue(ctx.legacyConsultationId, "No legacy consultation id"))) },
    { name: "GET /api/v1/legacy/resources/{resource_type}/{legacy_id}/related", run: async (ctx) => assertObject(await getLegacyRelatedResources({ resource_type: "course", legacy_id: requireValue(ctx.legacyCourseId, "No legacy course id") }, { limit: 5 })) },
    { name: "GET /api/v1/legacy/resources/{resource_type}/{legacy_id}/recommendations", run: async (ctx) => assertObject(await getLegacyResourceRecommendations({ resource_type: "course", legacy_id: requireValue(ctx.legacyCourseId, "No legacy course id") }, { limit: 5 })) },
    { name: "GET /api/v1/recommendations/products/{slug}", run: async (ctx) => assertObject(await getProductRecommendations(requireValue(ctx.searchProductSlug, "No product slug"), { limit: 5 })) },
    { name: "GET /api/v1/recommendations/me", auth: true, run: async () => assertObject(await getMyRecommendations({ limit: 5 }, customerOptions())) },
    { name: "GET /api/v1/recommendations/landing", run: async () => assertObject(await getLandingRecommendations({ limit: 5 })) },
    { name: "POST /api/v1/recommendations/rebuild", admin: true, mutates: true, run: async (ctx) => {
      const job = await rebuildRecommendations(rebuildOptions());
      assertObject(job);
      ctx.recommendationJobId = String((job as { job_id?: string }).job_id ?? "");
    } },
    { name: "GET /api/v1/recommendations/rebuild/{job_id}", admin: true, run: async (ctx) => {
      const jobId = requireValue(ctx.recommendationJobId, "No rebuild job id from rebuild POST");
      assertObject(await getRecommendationRebuildJob(jobId, rebuildOptions()));
    } },
    { name: "GET /api/v1/search", run: async (ctx) => {
      const page = await searchProducts({ q: "a", limit: 5, offset: 0 });
      assertPage(page);
      const product = page.items.find((item) => Boolean((item as { slug?: string | null }).slug)) as { slug?: string | null } | undefined;
      ctx.searchProductSlug = product?.slug ?? ctx.searchProductSlug;
    } },
    { name: "POST /api/v1/search", run: async () => assertPage(await advancedSearch({
      q: "a",
      expert_instructor_only: false,
      sort: "relevance",
      search_mode: "hybrid",
      include_debug: false,
      personalize: true,
      limit: 5,
      offset: 0,
    })) },
    { name: "GET /api/v1/search/options", run: async () => assertObject(await getSearchOptions({ limit: 10 })) },
    { name: "GET /api/v1/search/instructors", run: async (ctx) => {
      const instructors = await getSearchInstructors({ limit: 5, offset: 0 });
      assertArray(instructors);
      ctx.searchTrainerId = firstValue(instructors, "legacy_trainer_id");
    } },
    { name: "GET /api/v1/search/products/{slug}/details", run: async (ctx) => assertObject(await getSearchProductDetails(requireValue(ctx.searchProductSlug, "No product slug"))) },
    { name: "GET /api/v1/search/instructors/{trainer_id}/details", run: async (ctx) => assertObject(await getSearchInstructorDetails(requireValue(ctx.searchTrainerId, "No search trainer id"))) },
  ];
}

async function runTest(name: string, run: () => Promise<void>): Promise<TestResult> {
  const startedAt = performance.now();

  try {
    await run();
    return { name, status: "pass", ms: elapsed(startedAt) };
  } catch (error) {
    if (error instanceof SkipTest) {
      return { name, status: "skip", ms: elapsed(startedAt), detail: error.message };
    }

    return {
      name,
      status: "fail",
      ms: elapsed(startedAt),
      detail: formatError(error),
    };
  }
}

function customerOptions() {
  return authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
}

function rebuildOptions() {
  return { context: { rebuildToken: requireValue(rebuildToken, "Missing RECOMMENDATION_REBUILD_TOKEN") } };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertArray(value: unknown, message = "expected array response"): asserts value is unknown[] {
  assert(Array.isArray(value), message);
}

function assertObject(value: unknown): asserts value is Record<string, unknown> {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), "expected object response");
}

function assertPage<T>(value: unknown): asserts value is Page<T> {
  assertObject(value);
  assertArray((value as Page<T>).items, "expected paginated response with items array");
}

function assertStableKey(a: readonly unknown[], b: readonly unknown[], label: string) {
  assert(JSON.stringify(a) === JSON.stringify(b), `${label} is not stable`);
}

function firstId(items: unknown[]): number | undefined {
  return firstValue(items, "id");
}

function firstValue<T extends string | number>(items: unknown[], key: string): T | undefined {
  for (const item of items) {
    if (typeof item === "object" && item !== null && key in item) {
      const value = (item as Record<string, unknown>)[key];

      if (typeof value === "string" || typeof value === "number") {
        return value as T;
      }
    }
  }

  return undefined;
}

function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined || value === "") {
    throw new SkipTest(message);
  }

  return value;
}

function elapsed(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    const requestId = error.details.requestId ? ` requestId=${error.details.requestId}` : "";
    const retryAfter = error.details.retryAfter ? ` retryAfter=${error.details.retryAfter}` : "";
    return `ApiError ${error.status}: ${error.message}${requestId}${retryAfter}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function printSummary(results: TestResult[]) {
  const passed = results.filter((result) => result.status === "pass").length;
  const failed = results.filter((result) => result.status === "fail").length;
  const skipped = results.filter((result) => result.status === "skip").length;

  console.log("");
  console.log("API layer test results");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log("");

  for (const result of results) {
    const mark = result.status === "pass" ? "PASS" : result.status === "skip" ? "SKIP" : "FAIL";
    const detail = result.detail ? ` - ${result.detail}` : "";
    console.log(`${mark} ${result.name} (${result.ms}ms)${detail}`);
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
