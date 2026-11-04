import { expect, test, type Page } from "@playwright/test";

import { qaExpertEmail, signInCustomer } from "./support";

/*
 * The student nav needs to know whether the signed-in customer is a consultation expert. It asks
 * the quiet capability route, never the expert-only profile, so ordinary customers must not see a
 * 403 on any student page. The expert account must still reach the expert area.
 */

async function forbiddenExpertProbes(page: Page): Promise<string[]> {
  const forbidden: string[] = [];
  page.on("response", (response) => {
    if (response.status() === 403 && new URL(response.url()).pathname.includes("/experts/me")) {
      forbidden.push(response.url());
    }
  });
  return forbidden;
}

test("a customer page never probes the expert-only profile", async ({ page, context, baseURL }) => {
  const forbidden = await forbiddenExpertProbes(page);
  await signInCustomer(context, baseURL!);

  await page.goto("/students");
  await expect(page.getByRole("navigation", { name: "حسابي" })).toBeVisible();
  await expect(page.getByRole("link", { name: "لوحة الخبير" })).toHaveCount(0);
  expect(forbidden).toEqual([]);
});

test("the expert capability flag reveals the expert nav link", async ({ page, context, baseURL }) => {
  await signInCustomer(context, baseURL!);
  // The QA customer has completed onboarding, so the dashboard (and its nav) renders.
  await page.route("**/api/b2c/experts/me/capability", (route) =>
    route.fulfill({ json: { is_expert: true, consultant_id: "00000000-0000-0000-0000-000000000001" } }),
  );

  await page.goto("/students");
  await expect(page.getByRole("link", { name: "لوحة الخبير" })).toBeVisible();
});

test("an expert reaches the expert dashboard without a not-linked state", async ({ page, context, baseURL }) => {
  const email = qaExpertEmail();
  test.skip(!email, "QA_EXPERT_EMAIL is not set");
  const forbidden = await forbiddenExpertProbes(page);
  await signInCustomer(context, baseURL!, email!);

  await page.goto("/expert");
  await expect(page).toHaveURL(/\/expert$/);
  await expect(page.getByText("هذا الحساب غير مرتبط بخبير")).toHaveCount(0);
  expect(forbidden).toEqual([]);
});
