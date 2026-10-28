import type { Route } from "next";

import type { ProductType } from "@/features/search/model/params";
import { routes } from "@/config/routes";
import { parseCardSlug } from "@/lib/api/browse";
import type { CatalogMenuResponse } from "@/lib/api/catalog";
import { formatMoney } from "@/lib/format";

import type { ExploreMenuVM, MenuCategoryVM, MenuGroupVM, MenuProductVM } from "./types";

type MenuGroupDto = NonNullable<CatalogMenuResponse["groups"]>[number];
type MenuCategoryDto = NonNullable<MenuGroupDto["categories"]>[number];
type MenuProductDto = NonNullable<MenuCategoryDto["products"]>[number];

const GROUP_ORDER: readonly ProductType[] = ["course", "diploma", "package", "consultation"];

const GROUP_LABELS: Record<ProductType, string> = {
  course: "الدورات",
  diploma: "الدبلومات",
  package: "الباقات",
  consultation: "الاستشارات",
};

const GROUP_HREFS: Record<ProductType, Route> = {
  course: routes.courses,
  diploma: routes.diplomas,
  package: routes.packages,
  consultation: routes.consultations,
};

function isProductType(value: string): value is ProductType {
  return (GROUP_ORDER as readonly string[]).includes(value);
}

/** A card's detail page; null for B2C-native slugs without the numeric legacy id. */
function productHref(card: MenuProductDto): Route | null {
  const parsed = parseCardSlug(card.slug);
  if (!parsed) {
    return null;
  }
  switch (parsed.kind) {
    case "course":
      return routes.course(parsed.id, card.title);
    case "diploma":
      return routes.diploma(parsed.id, card.title);
    case "package":
      return routes.package(parsed.id);
    case "consultation":
      return routes.consultation(parsed.id);
  }
}

function mapProduct(card: MenuProductDto): MenuProductVM | null {
  const href = productHref(card);
  const title = card.title?.trim();
  if (!href || !title) {
    return null;
  }
  const amount = card.price?.amount ?? 0;
  const compareAt = card.price?.compare_at_amount ?? null;
  return {
    key: card.product_id,
    title,
    href,
    image: card.image,
    price: amount > 0 ? formatMoney(amount, card.price?.currency_code) : "مجاني",
    originalPrice: compareAt !== null && compareAt > amount ? formatMoney(compareAt, card.price?.currency_code) : null,
  };
}

function mapCategory(group: ProductType, dto: MenuCategoryDto): MenuCategoryVM {
  return {
    id: dto.category_id,
    slug: dto.slug,
    name: dto.name,
    href: routes.categoryOf(group, dto.slug),
    count: dto.product_count,
    products: (dto.products ?? []).map(mapProduct).filter((product): product is MenuProductVM => product !== null),
  };
}

function mapGroup(dto: MenuGroupDto): MenuGroupVM | null {
  const type = dto.product_type;
  if (!isProductType(type) || dto.count <= 0) {
    return null;
  }
  return {
    type,
    label: GROUP_LABELS[type],
    href: GROUP_HREFS[type],
    count: dto.count,
    categories: (dto.categories ?? []).map((category) => mapCategory(type, category)),
  };
}

export function mapExploreMenu(response: CatalogMenuResponse): ExploreMenuVM {
  const groups = (response.groups ?? [])
    .map(mapGroup)
    .filter((group): group is MenuGroupVM => group !== null)
    .sort((a, b) => GROUP_ORDER.indexOf(a.type) - GROUP_ORDER.indexOf(b.type));
  return { groups };
}
