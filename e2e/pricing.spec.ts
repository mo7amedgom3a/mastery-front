import { expect, test } from "@playwright/test";

import { adminApi, json } from "./support";

/*
 * Admin pricing reaches the storefront: a price set in the admin is returned by the public catalog
 * (detail and list) and shown on the course page after the storefront cache is refreshed. Needs
 * FRONT_REVALIDATE_URL/SECRET on the backend and REVALIDATE_SECRET on the storefront. The old price is
 * restored afterwards.
 */

test("an admin price change shows on the course page", async ({ page, baseURL }) => {
  const admin = await adminApi();
  const list = await json<{ items: { product_id: string; slug: string }[] }>(
    await admin.get("/api/v1/admin/catalog/products", {
      params: { source: "b2c", status: "published", product_type: "course", price_min: 1, limit: 20 },
    }),
  );
  const product = list.items.find((item) => /^course-\d+$/.test(item.slug));
  test.skip(!product, "no priced published legacy-numbered course");
  const before = await json<{ amount: string; currency_code: string; compare_at_amount: string | null }>(
    await admin.get(`/api/v1/admin/pricing/products/${product!.product_id}`),
  );
  const next = Math.round(Number(before.amount)) + 7;
  try {
    await json(await admin.put(`/api/v1/admin/pricing/products/${product!.product_id}`, { data: { amount: next, currency_code: before.currency_code } }));

    const detail = await json<{ price: { amount: number } | null }>(await admin.get(`/api/v1/catalog/products/${product!.slug}`));
    expect(detail.price?.amount).toBe(next);
    const listing = await json<{ items: { slug: string; price: { amount: number } | null }[] }>(
      await admin.get("/api/v1/catalog/products", { params: { product_type: "course", limit: 100 } }),
    );
    const listed = listing.items.find((item) => item.slug === product!.slug);
    if (listed) expect(listed.price?.amount).toBe(next);

    const id = Number(product!.slug.split("-")[1]);
    await expect
      .poll(async () => {
        await page.goto(`${baseURL}/courses/${id}`);
        return page.locator("main").innerText();
      }, { timeout: 30_000 })
      .toContain(`$${next}`);
  } finally {
    await admin.put(`/api/v1/admin/pricing/products/${product!.product_id}`, {
      data: { amount: Number(before.amount), currency_code: before.currency_code, compare_at_amount: before.compare_at_amount },
    });
    await admin.dispose();
  }
});
