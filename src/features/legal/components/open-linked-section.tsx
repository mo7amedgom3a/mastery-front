"use client";

import { useEffect } from "react";

/** Opens the `<details>` section a URL fragment points to, so it isn't left closed after the jump. */
function openTarget(hash: string) {
  const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (target instanceof HTMLDetailsElement) target.open = true;
}

/**
 * Browsers scroll to a closed disclosure without opening it. This opens it on arrival (`/terms#refund`)
 * and on in-page links, including a second click on the same link, which fires no `hashchange`.
 */
export function OpenLinkedSection() {
  useEffect(() => {
    openTarget(window.location.hash);
    const onHashChange = () => openTarget(window.location.hash);
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (link) openTarget(link.hash);
    };
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
