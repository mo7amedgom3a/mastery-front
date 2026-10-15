import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, SuccessResponse } from "@/lib/api/operation-types";

type LegacyContentOperation = "legacy_product_content_api_v1_catalog_product_content_legacy__kind___legacy_id__get";

/** A product page published from the admin's Course Studio: `meta` + BlockNote `blocks` (404 when none). */
export type ProductContentResponse = SuccessResponse<LegacyContentOperation>;

const productContentPaths = {
  legacy: "/api/v1/catalog/product-content/legacy/{kind}/{legacy_id}",
} as const;

/** The published studio page of a legacy course/diploma (`course`) or package; 404 when there is none. */
export function getLegacyProductContent(
  kind: PathParams<LegacyContentOperation>["kind"],
  legacyId: number,
  options?: ApiRequestOptions,
): Promise<ProductContentResponse> {
  return apiRequest<ProductContentResponse>("GET", productContentPaths.legacy, {
    ...options,
    path: { kind, legacy_id: legacyId },
  });
}
