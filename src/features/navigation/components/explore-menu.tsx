"use client";

import { useExploreMenu } from "./menu-context";
import { ExploreMenuPanel } from "./explore-menu-panel";

/** The header's explore cascade, fed by the root layout's menu data. */
export function ExploreMenu() {
  const menu = useExploreMenu();
  if (!menu || menu.groups.length === 0) {
    return null;
  }
  return <ExploreMenuPanel groups={menu.groups} />;
}
