import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, SuccessResponse } from "@/lib/api/operation-types";

type ProductContentOperation = "product_content_api_v1_catalog_product_content__product_id__get";

/** A product page published from the admin's Course Studio: `meta` + BlockNote `blocks` (404 when none). */
export type ProductContentResponse = SuccessResponse<ProductContentOperation>;

const productContentPaths = {
  product: "/api/v1/catalog/product-content/{product_id}",
} as const;

/** The published Studio page of a B2C product; 404 when there is none. */
export function getProductContent(
  productId: PathParams<ProductContentOperation>["product_id"],
  options?: ApiRequestOptions,
): Promise<ProductContentResponse> {
  return apiRequest<ProductContentResponse>("GET", productContentPaths.product, {
    ...options,
    path: { product_id: productId },
  });
}
