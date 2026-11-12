/**
 * Pure ranking for the courses and diplomas a lab recommends. Kept free of React and API imports so
 * `scripts/test-labs.ts` can check the pinning rules directly.
 */

/** Closed cohorts stay in the catalog with this marker; recommend them last. */
const CLOSED = /انتهى التسجيل/;

type RankableCard = { slug: string; title?: string | null };

/** Relevance of a card to the lab: keyword hits in the title, earlier keywords weigh more. */
export function relevance(card: RankableCard, keywords: readonly string[]): number {
  const title = card.title ?? "";
  const hits = keywords.reduce((sum, keyword, index) => sum + (title.includes(keyword) ? keywords.length - index : 0), 0);
  return CLOSED.test(title) ? hits - 100 : hits;
}

/**
 * Cards to show, in order: the lab's featured slugs first (the courses it was built on), then the
 * best keyword matches. Missing or closed featured cards are skipped so the list never breaks.
 */
export function rankCards<T extends RankableCard>(
  cards: readonly T[],
  keywords: readonly string[],
  count: number,
  featured: readonly string[] = [],
): T[] {
  const used = new Set<string>();
  const pinned: T[] = [];
  for (const slug of featured) {
    if (used.has(slug)) continue;
    const card = cards.find((item) => item.slug === slug && !CLOSED.test(item.title ?? ""));
    if (!card) continue;
    pinned.push(card);
    used.add(slug);
  }
  const ranked = cards
    .filter((card) => !used.has(card.slug))
    .map((card, index) => ({ card, score: relevance(card, keywords), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.card);
  return [...pinned, ...ranked].slice(0, count);
}
