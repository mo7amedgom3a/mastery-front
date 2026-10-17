import "server-only";

import { cache } from "react";

import { getCatalogProduct } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { getLegacyProductContent } from "@/lib/api/product-content";
import { cachedRead, freshRead } from "@/lib/api/server-cache";

import { introVideoSource, mapB2CProductDetail } from "../model/mappers-b2c";
import { verifyIntroVideo } from "./intro-video";
import type { ProductDetailData } from "../model/types";

/** Keep in sync with the detail pages' `revalidate`. */
const PRODUCT_REVALIDATE_SECONDS = 300;

/**
 * The B2C course/diploma with this numeric id, mapped for the storefront page; null when it doesn't
 * exist. B2C is the source of truth (units/lessons, trainer, price); the published Course Studio page
 * is read by the legacy content endpoint. `preview` (the admin Studio) reads fresh, uncached data.
 */
export const getB2CProductDetail = cache(
  async (id: number, kind: "course" | "diploma", preview = false): Promise<ProductDetailData | null> => {
    const tag = `${kind}-${id}`;
    const options = preview ? freshRead([tag]) : cachedRead(PRODUCT_REVALIDATE_SECONDS, [tag]);

    let dto;
    try {
      dto = await getCatalogProduct(`${kind}-${id}`, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }

    const content = await getLegacyProductContent("course", id, options).catch(() => null);
    const data = mapB2CProductDetail(dto, id, content);
    data.product.introVideo = await verifyIntroVideo(introVideoSource(dto, content), preview);
    return data;
  },
);
