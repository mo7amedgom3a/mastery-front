/**
 * FAQ quality gate for the landing page.
 *
 * The CMS occasionally contains placeholder rows ("deserunt", "do laborum") or two questions
 * sharing one answer. Those were emitted verbatim as FAQPage markup, which is worse than no FAQ at
 * all: search engines and AI answer engines either ignore the block or quote nonsense. Keep only
 * real, distinct Arabic Q&As; the landing page falls back to its curated list when fewer than two
 * survive.
 */
export type FaqLike = { question: string; answer: string };

const LOREM =
  /\b(?:lorem|ipsum|dolor|deserunt|laborum|consectetur|adipiscing|elit|sed do|eiusmod)\b/i;
const JUNK_ONLY = /^(?:test|testing|asdf|qwerty|sample|placeholder|x{3,})$/i;
const ARABIC = /[\u0600-\u06FF]/;

function normalize(value: string): string {
  return value
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

export function isUsableFaq(faq: FaqLike): boolean {
  const question = faq.question.trim();
  const answer = faq.answer.trim();
  if (question.length < 8 || answer.length < 25) return false;
  // Arabic content only: this also drops an English "test" row without rejecting real Arabic copy.
  if (!ARABIC.test(question) || !ARABIC.test(answer)) return false;
  if (JUNK_ONLY.test(question) || JUNK_ONLY.test(answer)) return false;
  if (LOREM.test(question) || LOREM.test(answer)) return false;
  return true;
}

export function sanitizeFaqs(faqs: readonly FaqLike[], max = 10): FaqLike[] {
  const seenQuestions = new Set<string>();
  const seenAnswers = new Set<string>();
  const usable: FaqLike[] = [];

  for (const faq of faqs) {
    if (!isUsableFaq(faq)) continue;
    const question = faq.question.trim();
    const answer = faq.answer.trim();
    const questionKey = normalize(question);
    const answerKey = normalize(answer);
    // The same question twice, or two questions with one canned answer, adds no value.
    if (seenQuestions.has(questionKey) || seenAnswers.has(answerKey)) continue;
    seenQuestions.add(questionKey);
    seenAnswers.add(answerKey);
    usable.push({ question, answer });
    if (usable.length >= max) break;
  }

  return usable;
}
