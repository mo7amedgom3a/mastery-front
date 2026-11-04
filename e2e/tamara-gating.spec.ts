import { expect, test, type Page } from "@playwright/test";

import { customerApi, json, signInCustomer } from "./support";

/*
 * Tamara's widget is a preview under the price. Mounting it loads Tamara's script, which fetches
 * the merchant widget configuration from their CDN, so it must not load for card payers. Both mount
 * sites — the cart and the Buy Now dialog — are covered.
 *
 * The eligibility response and the provider script are stubbed so the test exercises our mounting
 * decision, not the sandbox amount limits or Tamara's currently missing widget configuration.
 */

const TAMARA_OPTIONS = {
  available: true,
  country_code: "AE",
  currency_code: "AED",
  amount_minor: 14323,
  amount: 143.23,
  source_amount_minor: 3900,
  source_currency_code: "USD",
  conversion_rate: "3.6725",
  public_key: "e2e-public-key",
  environment: "sandbox",
  payment_types: [
    {
      name: "PAY_BY_INSTALMENTS",
      description: "Monthly payments. No late fees.",
      description_ar: "دفعات شهرية. بدون رسوم تأخير.",
      min_amount: 100,
      max_amount: 2000,
      currency: "AED",
      instalments: [3],
    },
  ],
  reason: null,
};

async function stubTamara(page: Page): Promise<void> {
  await page.route("**/api/b2c/payments/tamara/options*", (route) => route.fulfill({ json: TAMARA_OPTIONS }));
  // The script is not needed: the widget element's presence is what gates the provider request.
  await page.route("https://cdn-sandbox.tamara.co/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
}

async function openFirstCourse(page: Page): Promise<boolean> {
  await page.goto("/search?type=course");
  const course = page.locator('a[href*="/courses/"]').first();
  const visible = await course
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!visible) return false;
  await course.click();
  return true;
}

test("the cart mounts the Tamara widget only after Tamara is selected", async ({ page, context, baseURL }) => {
  const api = await customerApi();
  let itemId: string | undefined;
  try {
    const products = await json<{ items: { product_id: string; price: { amount: number } | null }[] }>(
      await api.get("/api/v1/catalog/products", { params: { product_type: "course", limit: 20 } }),
    );
    const product = products.items.find((item) => item.price);
    test.skip(!product, "no priced course to seed");

    const before = await json<{ lines: { product_id: string }[] }>(await api.get("/api/v1/cart"));
    if (!before.lines.some((line) => line.product_id === product!.product_id)) {
      const cart = await json<{ lines: { cart_item_id: string; product_id: string }[] }>(
        await api.post("/api/v1/cart/items", {
          data: { product_id: product!.product_id, quantity: 1, currency_code: "USD" },
        }),
      );
      itemId = cart.lines.find((line) => line.product_id === product!.product_id)?.cart_item_id;
    }

    await signInCustomer(context, baseURL!);
    await stubTamara(page);
    await page.goto("/students/cart");
    await expect(page.getByRole("heading", { name: "ملخّص الطلب" })).toBeVisible();

    await expect(page.locator("tamara-widget")).toHaveCount(0);

    const tamara = page.getByRole("radio", { name: "تمارا" });
    await expect(tamara).toBeEnabled();
    await tamara.check();
    await expect(page.locator("tamara-widget")).toHaveCount(1);
  } finally {
    // Leave the QA customer's account cart as it was, even when an assertion fails.
    if (itemId) await api.delete(`/api/v1/cart/items/${itemId}`).catch(() => undefined);
    await api.dispose();
  }
});

test("the Buy Now dialog mounts the Tamara widget only after Tamara is selected", async ({ page, context, baseURL }) => {
  await signInCustomer(context, baseURL!);
  await stubTamara(page);
  test.skip(!(await openFirstCourse(page)), "no course result to open");

  await page.getByRole("button", { name: "اشترِ الآن" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await expect(dialog.locator("tamara-widget")).toHaveCount(0);

  const tamara = dialog.getByRole("radio", { name: "تمارا" });
  await expect(tamara).toBeEnabled();
  await tamara.check();
  await expect(dialog.locator("tamara-widget")).toHaveCount(1);
});
