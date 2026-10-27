import { expect, test, type Page } from "@playwright/test";

import { adminApi, json } from "./support";

/*
 * Admin classification reaches the storefront search: a course published with a sub-category of a field, a
 * new skill and new tags (one Arabic) is listed by `/search` filtered by the field (sub-categories roll up),
 * the sub-category, the skill and each tag; its page shows those as search links; and removing a tag in the
 * admin takes the course out of that tag's results. Needs FRONT_REVALIDATE_URL/SECRET on the backend and
 * REVALIDATE_SECRET on the storefront (otherwise the search cache needs up to 10 minutes). The course is
 * archived afterwards.
 */

type Category = { category_id: string; slug: string; name: string | null; parent_id: string | null };

async function listed(page: Page, url: string): Promise<string> {
  await page.goto(url);
  return page.locator("main").innerText();
}

test("a course classified in the admin is found by every search filter", async ({ page, baseURL }) => {
  const admin = await adminApi();
  const categories = await json<Category[]>(await admin.get("/api/v1/catalog/categories"));
  const field = categories.find((item) => !item.parent_id && categories.some((child) => child.parent_id === item.category_id));
  test.skip(!field, "no field (top-level category) with sub-categories in this database");
  const sub = categories.find((item) => item.parent_id === field!.category_id)!;

  const stamp = Date.now().toString(36);
  const title = `E2E بحث التصنيف ${stamp}`;
  const asciiTag = `e2e-tag-${stamp}`;
  const arabicTag = `وسم بحث ${stamp}`;
  const skill = await json<{ skill_id: string; slug: string }>(
    await admin.post("/api/v1/admin/catalog/skills", { data: { name_ar: `مهارة بحث ${stamp}`, name_en: `E2E Search Skill ${stamp}` } }),
  );
  const created = await json<{ ref: string; product: { slug: string } }>(
    await admin.post("/api/v1/admin/catalog/products", {
      data: {
        product_type: "course",
        title,
        price: 10,
        currency_code: "USD",
        published: true,
        category_ids: [sub.category_id],
        skill_ids: [skill.skill_id],
        keywords: [asciiTag, arabicTag],
      },
    }),
  );
  const ref = encodeURIComponent(created.ref);
  const search = (params: Record<string, string>) => `${baseURL}/search?${new URLSearchParams(params)}`;
  const poll = (url: string) => expect.poll(() => listed(page, url), { timeout: 30_000, intervals: [1_000, 2_000, 5_000] });

  try {
    await poll(search({ category: field!.slug })).toContain(title);
    await poll(search({ category: sub.slug })).toContain(title);
    await poll(search({ skill: skill.slug })).toContain(title);
    await poll(search({ tag: asciiTag })).toContain(title);
    await poll(search({ tag: arabicTag })).toContain(title);

    // A tag chip on the field's results (facet row or card) filters by that tag.
    await page.goto(search({ category: field!.slug }));
    await page.getByRole("link", { name: new RegExp(asciiTag) }).first().click();
    await expect(page).toHaveURL(new RegExp(`tag=${asciiTag}`));
    await expect(page.getByText(title)).toBeVisible();

    // The course page links its field, sub-category, skill and tags to the search.
    const id = created.product.slug.split("-")[1];
    await expect
      .poll(async () => {
        await page.goto(`${baseURL}/courses/${id}`);
        return page.locator("[data-topic]").allInnerTexts();
      }, { timeout: 30_000 })
      .toEqual(expect.arrayContaining([field!.name, sub.name, `مهارة بحث ${stamp}`, `#${asciiTag}`, `#${arabicTag}`]));
    await page.locator('[data-topic="skill"]').click();
    await expect(page).toHaveURL(new RegExp(`/search\\?skill=${skill.slug}`));
    await expect(page.getByText(title)).toBeVisible();

    // Removing a tag in the admin: the course page drops it, and the tag no longer lists the course. Once no
    // product carries the tag it leaves the facet catalog and the storefront ignores `?tag=` (all programs,
    // no active filter), so "not listed under that filter" is either outcome.
    await json(await admin.patch(`/api/v1/admin/catalog/products/${ref}`, { data: { keywords: [arabicTag] } }));
    await expect
      .poll(async () => {
        await page.goto(`${baseURL}/courses/${id}`);
        return page.locator('[data-topic="tag"]').allInnerTexts();
      }, { timeout: 30_000 })
      .toEqual([`#${arabicTag}`]);
    await expect
      .poll(async () => {
        const text = await listed(page, search({ tag: asciiTag }));
        const filtered = (await page.getByRole("link", { name: /^إزالة الفلتر/ }).count()) > 0;
        return filtered && text.includes(title);
      }, { timeout: 30_000 })
      .toBe(false);
    await poll(search({ tag: arabicTag })).toContain(title);
  } finally {
    await admin.post(`/api/v1/admin/catalog/products/${ref}/status`, { data: { status: "archived" } });
    await admin.dispose();
  }
});
