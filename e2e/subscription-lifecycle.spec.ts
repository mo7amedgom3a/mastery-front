import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { customerApi, json, seedSubscription, signInCustomer } from "./support";

/*
 * The customer's subscription lifecycle on /students/subscription: cancel renewal at the end of the
 * period (access stays), undo it, then cancel now (the plan's programs close). The API confirms each
 * stored state. The QA customer gets a fresh subscription for the run.
 */

type Subscription = { status: string; cancel_at_period_end: boolean; auto_renew: boolean; canceled_at: string | null };

let customer: APIRequestContext;
let subscriptionId = "";

async function current(): Promise<Subscription> {
  return json<Subscription>(await customer.get(`/api/v1/subscriptions/me/${subscriptionId}`));
}

/** The seeded subscription's card: the newest live one is listed first. */
function card(page: Page) {
  return page.locator("main article").first();
}

test.describe.serial("customer subscription lifecycle", () => {
  test.beforeAll(async () => {
    customer = await customerApi();
    subscriptionId = await seedSubscription(customer);
  });

  test.afterAll(async () => {
    const state = await current().catch(() => null);
    if (state && (state.status === "active" || state.status === "past_due")) {
      await customer.post(`/api/v1/subscriptions/me/${subscriptionId}/cancel`, { data: { immediate: true } });
    }
    await customer.dispose();
  });

  test.beforeEach(async ({ context, baseURL }) => {
    await signInCustomer(context, baseURL!);
  });

  test("cancel at period end keeps access and can be undone", async ({ page }) => {
    await page.goto("/students/subscription");
    await card(page).getByRole("button", { name: "إلغاء الاشتراك" }).click();

    const dialog = page.getByRole("dialog", { name: "إلغاء الاشتراك" });
    await expect(dialog.getByRole("radio").first()).toBeChecked();
    await dialog.getByRole("button", { name: "تأكيد إلغاء التجديد" }).click();
    await expect(dialog).toBeHidden();

    await expect(card(page).getByText("ينتهي ولن يتجدد")).toBeVisible();
    await expect(card(page).getByText("البرامج المفتوحة لك")).toBeVisible();
    expect(await current()).toMatchObject({ status: "active", cancel_at_period_end: true, auto_renew: false });

    await card(page).getByRole("button", { name: "استئناف الاشتراك" }).click();
    await expect(card(page).getByText("تم استئناف اشتراكك")).toBeVisible();
    expect(await current()).toMatchObject({ status: "active", cancel_at_period_end: false, auto_renew: true, canceled_at: null });
  });

  test("keeping the subscription closes the dialog without changes", async ({ page }) => {
    await page.goto("/students/subscription");
    await card(page).getByRole("button", { name: "إلغاء الاشتراك" }).click();
    const dialog = page.getByRole("dialog", { name: "إلغاء الاشتراك" });
    await dialog.getByRole("button", { name: "الاحتفاظ بالاشتراك" }).click();
    await expect(dialog).toBeHidden();
    expect((await current()).cancel_at_period_end).toBe(false);
  });

  test("cancel now ends the subscription and its access", async ({ page }) => {
    await page.goto("/students/subscription");
    await card(page).getByRole("button", { name: "إلغاء الاشتراك" }).click();
    const dialog = page.getByRole("dialog", { name: "إلغاء الاشتراك" });
    await dialog.getByText("إلغاء الآن", { exact: true }).click();
    await dialog.getByRole("button", { name: "إلغاء الاشتراك الآن" }).click();
    await expect(dialog).toBeHidden();

    expect((await current()).status).toBe("canceled");
    const ended = page.locator("main article").filter({ hasText: "ملغي" }).first();
    await expect(ended).toBeVisible();
    await expect(ended.getByRole("button", { name: /إلغاء|استئناف/ })).toHaveCount(0);
    const access = await json<{ items: { source_id: string | null; status: string }[] }>(
      await customer.get("/api/v1/me/entitlements", { params: { limit: 100 } }),
    );
    const mine = access.items.filter((row) => row.source_id === subscriptionId);
    expect(mine.length).toBeGreaterThan(0);
    for (const row of mine) expect(row.status).toBe("revoked");
  });
});
