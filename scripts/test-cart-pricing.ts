/**
 * Checks the mock cart pricing engine (offers, add-ons, coupons, payment eligibility).
 * Run with `npm run test:cart`.
 */
import assert from "node:assert/strict";

import { buildQuote } from "../src/features/cart/model/pricing";
import type { ResolvedItem, ShopItemKind } from "../src/lib/shop/contract";

function item(kind: ShopItemKind, id: number, price: number | null, extra: Partial<ResolvedItem> = {}): ResolvedItem {
  return {
    key: `${kind}:${id}`,
    kind,
    id,
    title: `${kind} ${id}`,
    image: null,
    href: `/${kind}s/${id}`,
    tag: null,
    instructor: null,
    duration: null,
    courseCount: null,
    available: true,
    free: false,
    priceAmount: price,
    originalAmount: null,
    purchasable: kind !== "consultation" && price !== null && price > 0,
    ...extra,
  };
}

const catalog = new Map<string, ResolvedItem>(
  [
    item("course", 1, 100),
    item("course", 2, 69, { originalAmount: 129 }),
    item("diploma", 3, 400),
    item("package", 4, 33.33),
    item("course", 5, null, { free: true, purchasable: false }),
    item("consultation", 6, 150),
    item("course", 7, 50, { available: false }),
  ].map((entry) => [entry.key, entry]),
);

const quote = (keys: string[], coupon?: string | null, addons: Record<string, string[]> = {}) =>
  buildQuote({
    lines: keys.map((key) => ({ key, addons: (addons[key] ?? []) as never })),
    items: catalog,
    coupon,
    currency: "USD",
    now: Date.parse("2026-01-01T00:00:00Z"),
  });

const tests: [string, () => void][] = [
  [
    "offer price replaces the original and is reported as savings",
    () => {
      const q = quote(["course:2"]);
      assert.equal(q.lines[0].unitAmount, 69);
      assert.equal(q.lines[0].originalAmount, 129);
      assert.equal(q.totals.offerSavings, 60);
      assert.equal(q.totals.total, 69);
    },
  ],
  [
    "add-ons add to the line, only when the kind supports them",
    () => {
      const q = quote(["course:1", "package:4"], null, {
        "course:1": ["unlimited_access", "cpd_certificate"],
        "package:4": ["cpd_certificate"],
      });
      assert.equal(q.lines[0].addonsAmount, 64);
      assert.equal(q.lines[0].totalAmount, 164);
      // Packages take lifetime access only: the CPD request is ignored.
      assert.deepEqual(
        q.lines[1].addons.map((addon) => addon.code),
        ["unlimited_access"],
      );
      assert.equal(q.lines[1].addonsAmount, 0);
      assert.equal(q.totals.subtotal, 197.33);
    },
  ],
  [
    "cart coupon discounts every product, not the add-ons",
    () => {
      const q = quote(["course:1", "diploma:3"], "mastery10", { "course:1": ["unlimited_access"] });
      assert.equal(q.coupon?.status, "applied");
      assert.equal(q.coupon?.scope, "cart");
      assert.equal(q.lines[0].discountAmount, 10);
      assert.equal(q.lines[1].discountAmount, 40);
      assert.equal(q.totals.discount, 50);
      assert.equal(q.totals.total, 100 + 29 + 400 - 50);
    },
  ],
  [
    "single-product coupon hits the most expensive eligible line only",
    () => {
      const q = quote(["course:2", "course:1", "diploma:3"], "COURSE20");
      assert.equal(q.coupon?.scope, "line");
      assert.deepEqual(q.coupon?.appliedKeys, ["course:1"]);
      assert.equal(q.totals.discount, 20);
      assert.equal(q.lines.find((line) => line.key === "diploma:3")?.discountAmount, 0);
    },
  ],
  [
    "kind-limited coupon is refused when no line matches",
    () => {
      const q = quote(["course:1"], "DIPLOMA25");
      assert.equal(q.coupon?.status, "not_applicable");
      assert.equal(q.totals.discount, 0);
    },
  ],
  [
    "fixed coupon splits to the cent and respects its minimum",
    () => {
      const low = quote(["course:2"], "WELCOME15");
      assert.equal(low.coupon?.status, "min_not_met");
      const q = quote(["course:1", "course:2", "package:4"], "WELCOME15");
      assert.equal(q.coupon?.status, "applied");
      assert.equal(q.totals.discount, 15);
      const shares = q.lines.reduce((sum, line) => sum + Math.round(line.discountAmount * 100), 0);
      assert.equal(shares, 1500);
    },
  ],
  [
    "unknown and expired coupons are reported, not applied",
    () => {
      assert.equal(quote(["course:1"], "NOPE")?.coupon?.status, "invalid");
      assert.equal(quote(["course:1"], "<script>")?.coupon?.status, "invalid");
      assert.equal(quote(["course:1"], "SUMMER24")?.coupon?.status, "expired");
      assert.equal(quote(["course:1"], "  ")?.coupon, null);
    },
  ],
  [
    "free, inactive, unknown and consultation lines are left out",
    () => {
      const q = quote(["course:5", "consultation:6", "course:7", "course:999", "course:1", "course:1"]);
      assert.deepEqual(
        q.lines.map((line) => line.key),
        ["course:1"],
      );
      assert.deepEqual(
        q.unavailable.map((entry) => entry.reason),
        ["free", "not_purchasable", "inactive", "missing"],
      );
    },
  ],
  [
    "a 100% coupon leaves nothing to pay and no payment method",
    () => {
      const q = quote(["course:1"], "FREEPASS");
      assert.equal(q.totals.total, 0);
      assert.ok(q.paymentMethods.every((method) => !method.eligible));
    },
  ],
  [
    "pay-later plans follow their limits and split the total",
    () => {
      const q = quote(["course:1"]);
      const tabby = q.paymentMethods.find((method) => method.id === "tabby");
      assert.deepEqual(tabby?.installments, { count: 4, amount: 25 });
      const big = quote(["diploma:3", "course:1"], null, {});
      assert.equal(big.paymentMethods.find((method) => method.id === "card")?.eligible, true);
      const tiny = buildQuote({
        lines: [{ key: "course:9", addons: [] }],
        items: new Map([["course:9", item("course", 9, 5)]]),
        currency: "USD",
      });
      const tamara = tiny.paymentMethods.find((method) => method.id === "tamara");
      assert.equal(tamara?.eligible, false);
      assert.ok(tamara?.reason);
    },
  ],
];

let failed = 0;
for (const [name, run] of tests) {
  try {
    run();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}\n`, error);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed === 0 ? 0 : 1);
