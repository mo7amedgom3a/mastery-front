"use client";

import { MobileExploreMenu } from "./mobile-explore-menu";
import { useExploreMenu } from "./menu-context";

/** The drawer's explore section, fed by the root layout's menu data. */
export function MobileExploreMenuSection({ popoverId }: { popoverId: string }) {
  const menu = useExploreMenu();
  if (!menu || menu.groups.length === 0) {
    return null;
  }
  return <MobileExploreMenu groups={menu.groups} popoverId={popoverId} />;
}
