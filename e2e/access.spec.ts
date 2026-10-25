import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { adminApi, json, qa, signInCustomer } from "./support";

/*
 * The customer's side of admin access controls. The QA admin gives the QA customer a short (10-day)
 * course with paid extensions on, and the access page must then show: the extend offer, a suspension
 * (with the frozen days), the access back after reinstatement, and the revocation. The course's own
 * settings are restored afterwards.
 */

type Product = {
  product: { product_id: string; slug: string; title: string | null };
  b2c: {
    access_duration_days: number | null;
    extension_enabled: boolean;
    extension_price: number | null;
    extension_duration_days?: number | null;
  } | null;
};

let admin: APIRequestContext;
let customerRef = "";
let productRef = "";
let original: Product["b2c"] = null;
let entitlementId = "";
let orderId = "";

async function setStatus(action: "suspend" | "reinstate" | "revoke") {
  await json(await admin.post(`/api/v1/admin/entitlements/${entitlementId}/${action}`, { data: { reason: `e2e ${action}` } }));
}

async function openTab(page: Page, label: string) {
  await page.goto("/students/access");
  await page.getByRole("button", { name: label, exact: true }).click();
}

test.describe.serial("customer access after admin actions", () => {
  test.beforeAll(async () => {
    admin = await adminApi();
    const customers = await json<{ items: { ref: string; email: string | null; source: string }[] }>(
      await admin.get("/api/v1/admin/customers", { params: { query: qa().customer, limit: 5 } }),
    );
    customerRef = customers.items.find((row) => row.source === "b2c" && row.email?.toLowerCase() === qa().customer.toLowerCase())!.ref;
    const options = await json<{ product_id: string; owned: boolean; title: string | null }[]>(
      await admin.get(`/api/v1/admin/customers/${customerRef}/grant-options`, { params: { product_type: "course", limit: 50 } }),
    );
    const option = options.find((row) => !row.owned && row.title);
    test.skip(!option, "no course left to grant");
    productRef = `b2c:${option!.product_id}`;
    original = (await json<Product>(await admin.get(`/api/v1/admin/catalog/products/${productRef}`))).b2c;
    await json(
      await admin.patch(`/api/v1/admin/catalog/products/${productRef}`, {
        data: { access_duration_days: 10, extension_enabled: true, extension_duration_days: 30, extension_price: 9 },
      }),
    );
    const grants = await json<{ order_id: string; product_id: string; status: string }[]>(
      await admin.post(`/api/v1/admin/customers/${customerRef}/grants`, { data: { product_id: option!.product_id, reason: "e2e: customer access" } }),
    );
    orderId = grants.find((row) => row.product_id === option!.product_id && row.status === "active")!.order_id;
    const page = await json<{ items: { entitlement_id: string }[] }>(
      await admin.get(`/api/v1/admin/customers/${customerRef}/entitlements`, { params: { product_id: option!.product_id } }),
    );
    entitlementId = page.items[0].entitlement_id;
  });

  test.afterAll(async () => {
    if (orderId) await admin.delete(`/api/v1/admin/customers/${customerRef}/grants/${orderId}`);
    if (productRef && original) {
      await admin.patch(`/api/v1/admin/catalog/products/${productRef}`, {
        data: {
          access_duration_days: original.access_duration_days,
          extension_enabled: original.extension_enabled,
          ...(original.extension_duration_days ? { extension_duration_days: original.extension_duration_days } : {}),
          ...(original.extension_price != null ? { extension_price: original.extension_price } : {}),
        },
      });
    }
    await admin?.dispose();
  });

  test.beforeEach(async ({ context, baseURL }) => {
    await signInCustomer(context, baseURL!);
  });

  test("access ending soon offers a paid extension", async ({ page }) => {
    await openTab(page, "الفعّال");
    const extend = page.getByRole("button", { name: /^تمديد الوصول:/ }).first();
    await expect(extend).toBeVisible();
    await extend.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("تمديد الوصول");
    await expect(dialog.getByRole("radio").first()).toBeVisible();
    await expect(dialog).toContainText(/\$9(\.00)?/);
    // No purchase in e2e: close before checkout.
    await dialog.getByRole("button", { name: "إغلاق" }).click();
  });

  test("a suspension shows with the frozen days and no way in", async ({ page }) => {
    await setStatus("suspend");
    await openTab(page, "الموقوف");
    const card = page.getByRole("article").filter({ hasText: "وصولك موقوف مؤقتاً" });
    await expect(card).toBeVisible();
    await expect(card).toContainText(/أيامك المتبقية/);
    await expect(card.getByRole("button", { name: /كمّل التعلّم/ })).toHaveCount(0);
    await expect(card.getByRole("link", { name: "تواصل مع الدعم" })).toBeVisible();
  });

  test("reinstated access is active again", async ({ page }) => {
    await setStatus("reinstate");
    await openTab(page, "الموقوف");
    await expect(page.getByRole("article").filter({ hasText: "وصولك موقوف مؤقتاً" })).toHaveCount(0);
    await openTab(page, "الفعّال");
    await expect(page.getByRole("button", { name: /^تمديد الوصول:/ }).first()).toBeVisible();
  });

  test("revoked access is listed as ended", async ({ page }) => {
    await setStatus("revoke");
    await openTab(page, "الموقوف");
    await expect(page.getByRole("article").filter({ hasText: "تم إلغاء وصولك" }).first()).toBeVisible();
  });
});
