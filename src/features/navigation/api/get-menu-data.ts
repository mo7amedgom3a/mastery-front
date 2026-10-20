import "server-only";

import { cache } from "react";

import { getCatalogMenu } from "@/lib/api/catalog";
import { cachedRead } from "@/lib/api/server-cache";

import { mapExploreMenu } from "../model/mappers";
import type { ExploreMenuVM } from "../model/types";

/** The header menu changes with the catalog, not with every deploy: a slow revalidate is enough. */
const MENU_REVALIDATE_SECONDS = 600;
const read = cachedRead(MENU_REVALIDATE_SECONDS, []);

/**
 * The explore menu's data, read once per request (the desktop and mobile menus share it) and
 * cached with the rest of the catalog. A failed read returns null so the header still renders.
 */
export const getExploreMenu = cache(async (): Promise<ExploreMenuVM | null> => {
  try {
    return mapExploreMenu(await getCatalogMenu({ per_category: 4 }, read));
  } catch (error) {
    console.error("[menu] catalog menu request failed", error);
    return null;
  }
});
