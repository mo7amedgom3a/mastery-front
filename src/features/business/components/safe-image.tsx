"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

/**
 * `next/image` that swaps to a placeholder when the upstream file is missing.
 *
 * Legacy media (company logos, course banners) is not guaranteed to exist; a broken logo tile or a
 * blank card would look worse than a branded placeholder, and the fallback keeps the layout intact.
 */
export function SafeImage({ fallback, alt, ...props }: ImageProps & { fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <>{fallback ?? null}</>;
  }
  return <Image {...props} alt={alt} onError={() => setFailed(true)} />;
}
