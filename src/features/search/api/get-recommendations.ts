import "server-only";

import { cache } from "react";

import { getCatalogIndex } from "@/features/product-detail/api/get-catalog-index";
import { recommendationCard } from "@/features/product-detail/model/mappers";
import type { RailCardVM } from "@/features/product-detail/model/types";
import { getInstructorNames } from "@/lib/api/instructor-names";
import {
  getLandingRecommendations,
  getMyRecommendations,
  type LandingRecommendationsResponse,
} from "@/lib/api/recommendations";
import { searchProducts } from "@/lib/api/search";
import { cachedRead, valueOf } from "@/lib/api/server-cache";

import { mapResults } from "../model/mappers";
import { getSearchCatalog } from "./get-search-page";

export type RecommendationsData = {
  /** `personal`: built from this visitor's own history. `starter`: a first look across the catalog. */
  source: "personal" | "starter";
  cards: RailCardVM[];
};

/** Cards in the rail. */
const LIMIT = 12;
/** Fewer personal cards than this make a thin rail; the starter set is shown instead. */
const MIN_PERSONAL_CARDS = 4;
/** Starter cards taken from each of the largest categories. */
const PER_CATEGORY = 2;
const STARTER_REVALIDATE_SECONDS = 300;
const ACCESS_COOKIE = "b2c_access_token";

const read = cachedRead(STARTER_REVALIDATE_SECONDS, ["search"]);

export type Visitor = {
  /** The browser's own fingerprint (see `lib/customer-tracking`). */
  fingerprint: string | null;
  /** The signed-in customer's access token, when there is one. */
  accessToken: string | null;
};

/**
 * What the recommendation engine has for this visitor: the account's list when signed in, else the
 * browser's. Null unless it is really about them. The API answers a visitor it knows nothing about
 * with the same global list for everyone, flagged `personalized: false`.
 */
async function personalRecommendations({ fingerprint, accessToken }: Visitor): Promise<LandingRecommendationsResponse | null> {
  if (accessToken) {
    try {
      const page = await getMyRecommendations(
        { limit: LIMIT },
        { headers: { cookie: `${ACCESS_COOKIE}=${accessToken}` }, cache: "no-store" },
      );
      if (page.personalized) return page;
    } catch {
      // An expired session is not an error here: fall through to the browser's own history.
    }
  }
  // Never without a fingerprint: the API would fall back to this server's address, which is every
  // visitor's at once.
  if (!fingerprint) return null;
  try {
    const page = await getLandingRecommendations(
      { limit: LIMIT },
      { context: { clientFingerprint: fingerprint }, cache: "no-store" },
    );
    return page.personalized ? page : null;
  } catch (error) {
    console.error("[api] landing recommendations request failed", error);
    return null;
  }
}

/**
 * Recommendation items carry no artwork, link name or reliable price, so each card is rebuilt from
 * its legacy record, exactly like the rails on the detail pages.
 */
async function personalCards(visitor: Visitor): Promise<RailCardVM[]> {
  const page = await personalRecommendations(visitor);
  if (!page || page.items.length === 0) return [];

  const [catalog, instructors] = await Promise.allSettled([getCatalogIndex(), getInstructorNames(read)]);
  const index = valueOf(catalog, "catalog index");
  const names = valueOf(instructors, "instructor names") ?? undefined;
  const cards = new Map<string, RailCardVM>();
  for (const item of page.items) {
    const card = recommendationCard(item, index, names);
    if (card && !cards.has(card.key)) cards.set(card.key, card);
  }
  return [...cards.values()];
}

/**
 * The default rail for a visitor the engine doesn't know yet: the newest programs of the largest
 * categories, taken in turns so no single field fills the row. The same for everyone, so cached.
 */
const starterCards = cache(async (): Promise<RailCardVM[]> => {
  const catalog = await getSearchCatalog();
  const pages = await Promise.allSettled(
    catalog.topCategories.map((category) =>
      searchProducts({ category: [category.code], limit: PER_CATEGORY, personalize: false }, read),
    ),
  );
  const rows = pages.map((page, index) => {
    const response = valueOf(page, `starter ${catalog.topCategories[index].code}`);
    return response ? mapResults(response, catalog).cards : [];
  });

  const cards = new Map<string, RailCardVM>();
  for (let turn = 0; turn < PER_CATEGORY; turn++) {
    for (const row of rows) {
      const card = row[turn];
      if (card && !cards.has(card.key)) cards.set(card.key, card);
    }
  }
  return [...cards.values()].slice(0, LIMIT);
});

/** The visitor's recommendations when there are enough of them, else the starter set. */
export async function getSearchRecommendations(visitor: Visitor): Promise<RecommendationsData> {
  const personal = await personalCards(visitor);
  if (personal.length >= MIN_PERSONAL_CARDS) {
    return { source: "personal", cards: personal.slice(0, LIMIT) };
  }
  return { source: "starter", cards: await starterCards() };
}
