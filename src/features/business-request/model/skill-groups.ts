import type { CatalogCategoriesResponse, OnboardingSkill } from "@/lib/api/catalog";

type Category = CatalogCategoriesResponse[number];
type Skill = OnboardingSkill;

export type SkillGroup = { id: string; name: string; arabic: Skill[]; english: Skill[] };

/** Keeps each skill in one selected category, with the Arabic and English names separated. */
export function groupRequestSkills(
  categories: readonly Category[],
  skills: readonly Skill[],
  categoryIds: readonly string[],
  otherCategorySelected: boolean,
): SkillGroup[] {
  const selected = categories.filter((category) => categoryIds.includes(category.category_id));
  const hasLinks = skills.some((skill) => skill.category_ids?.length);
  const showAll = (otherCategorySelected && selected.length === 0) || (!hasLinks && selected.length > 0);
  const groups = showAll
    ? [{ id: "other", name: otherCategorySelected && selected.length === 0 ? "مجال آخر" : "المهارات المتاحة", items: skills }]
    : selected.map((category) => ({
        id: category.category_id,
        name: category.name ?? category.slug,
        items: skills.filter((skill) => skill.category_ids?.includes(category.category_id)),
      }));

  const seen = new Set<string>();
  return groups.map((group) => {
    const unique = group.items.filter((skill) => {
      if (seen.has(skill.skill_id)) return false;
      seen.add(skill.skill_id);
      return true;
    });
    return {
      id: group.id,
      name: group.name,
      arabic: unique.filter((skill) => /[\u0600-\u06ff]/u.test(skill.name)),
      english: unique.filter((skill) => !/[\u0600-\u06ff]/u.test(skill.name)),
    };
  });
}
