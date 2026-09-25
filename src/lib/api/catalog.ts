import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { PathParams, QueryParams, SuccessResponse } from "@/lib/api/operation-types";

type ProductTypesOperation = "product_types_api_v1_catalog_product_types_get";
type CategoriesOperation = "categories_api_v1_catalog_categories_get";
type CategoryOperation = "category_api_v1_catalog_categories__category_id__get";
type ProductsOperation = "products_api_v1_catalog_products_get";
type ProductOperation = "product_api_v1_catalog_products__slug__get";
type ResourceOperation = "resource_api_v1_catalog_resources__resource_id__get";
type RelatedResourcesOperation = "related_resources_api_v1_catalog_resources__resource_id__related_get";

export type CatalogProductTypesResponse = SuccessResponse<ProductTypesOperation>;
export type CatalogCategoriesResponse = SuccessResponse<CategoriesOperation>;
export type CatalogCategoryResponse = SuccessResponse<CategoryOperation>;
export type CatalogProductsParams = QueryParams<ProductsOperation>;
export type CatalogProductsResponse = SuccessResponse<ProductsOperation>;
export type CatalogProductResponse = SuccessResponse<ProductOperation>;
export type CatalogResourceResponse = SuccessResponse<ResourceOperation>;
export type CatalogRelatedResourcesParams = QueryParams<RelatedResourcesOperation>;
export type CatalogRelatedResourcesResponse = SuccessResponse<RelatedResourcesOperation>;

const catalogPaths = {
  productTypes: "/api/v1/catalog/product-types",
  categories: "/api/v1/catalog/categories",
  category: "/api/v1/catalog/categories/{category_id}",
  products: "/api/v1/catalog/products",
  product: "/api/v1/catalog/products/{slug}",
  resource: "/api/v1/catalog/resources/{resource_id}",
  relatedResources: "/api/v1/catalog/resources/{resource_id}/related",
} as const;

export const catalogKeys = {
  all: ["catalog"] as const,
  productTypes: () => [...catalogKeys.all, "product-types"] as const,
  categories: () => [...catalogKeys.all, "categories"] as const,
  category: (categoryId: string) => [...catalogKeys.categories(), categoryId] as const,
  products: (params?: CatalogProductsParams) => [...catalogKeys.all, "products", params ?? {}] as const,
  product: (slug: string) => [...catalogKeys.all, "products", slug] as const,
  resource: (resourceId: string) => [...catalogKeys.all, "resources", resourceId] as const,
  relatedResources: (resourceId: string, params?: CatalogRelatedResourcesParams) =>
    [...catalogKeys.resource(resourceId), "related", params ?? {}] as const,
};

export function getProductTypes(options?: ApiRequestOptions): Promise<CatalogProductTypesResponse> {
  return apiRequest<CatalogProductTypesResponse>("GET", catalogPaths.productTypes, options);
}

export function getCatalogCategories(options?: ApiRequestOptions): Promise<CatalogCategoriesResponse> {
  return apiRequest<CatalogCategoriesResponse>("GET", catalogPaths.categories, options);
}

export function getCatalogCategory(
  categoryId: PathParams<CategoryOperation>["category_id"],
  options?: ApiRequestOptions,
): Promise<CatalogCategoryResponse> {
  return apiRequest<CatalogCategoryResponse>("GET", catalogPaths.category, {
    ...options,
    path: { category_id: categoryId },
  });
}

export function getCatalogProducts(
  params?: CatalogProductsParams,
  options?: ApiRequestOptions,
): Promise<CatalogProductsResponse> {
  return apiRequest<CatalogProductsResponse>("GET", catalogPaths.products, {
    ...options,
    query: params,
  });
}

export function getCatalogProduct(slug: string, options?: ApiRequestOptions): Promise<CatalogProductResponse> {
  return apiRequest<CatalogProductResponse>("GET", catalogPaths.product, {
    ...options,
    path: { slug },
  });
}

export function getCatalogResource(
  resourceId: PathParams<ResourceOperation>["resource_id"],
  options?: ApiRequestOptions,
): Promise<CatalogResourceResponse> {
  return apiRequest<CatalogResourceResponse>("GET", catalogPaths.resource, {
    ...options,
    path: { resource_id: resourceId },
  });
}

export function getCatalogRelatedResources(
  resourceId: PathParams<RelatedResourcesOperation>["resource_id"],
  params?: CatalogRelatedResourcesParams,
  options?: ApiRequestOptions,
): Promise<CatalogRelatedResourcesResponse> {
  return apiRequest<CatalogRelatedResourcesResponse>("GET", catalogPaths.relatedResources, {
    ...options,
    path: { resource_id: resourceId },
    query: params,
  });
}

export const catalogQueries = {
  productTypes: () =>
    queryOptions({
      queryKey: catalogKeys.productTypes(),
      queryFn: ({ signal }) => getProductTypes({ signal }),
      staleTime: 10 * 60_000,
    }),
  categories: () =>
    queryOptions({
      queryKey: catalogKeys.categories(),
      queryFn: ({ signal }) => getCatalogCategories({ signal }),
      staleTime: 10 * 60_000,
    }),
  category: (categoryId: string) =>
    queryOptions({
      queryKey: catalogKeys.category(categoryId),
      queryFn: ({ signal }) => getCatalogCategory(categoryId, { signal }),
      staleTime: 10 * 60_000,
    }),
  products: (params?: CatalogProductsParams) =>
    queryOptions({
      queryKey: catalogKeys.products(params),
      queryFn: ({ signal }) => getCatalogProducts(params, { signal }),
      staleTime: 5 * 60_000,
    }),
  product: (slug: string) =>
    queryOptions({
      queryKey: catalogKeys.product(slug),
      queryFn: ({ signal }) => getCatalogProduct(slug, { signal }),
      staleTime: 5 * 60_000,
    }),
  resource: (resourceId: string) =>
    queryOptions({
      queryKey: catalogKeys.resource(resourceId),
      queryFn: ({ signal }) => getCatalogResource(resourceId, { signal }),
      staleTime: 5 * 60_000,
    }),
  relatedResources: (resourceId: string, params?: CatalogRelatedResourcesParams) =>
    queryOptions({
      queryKey: catalogKeys.relatedResources(resourceId, params),
      queryFn: ({ signal }) => getCatalogRelatedResources(resourceId, params, { signal }),
      staleTime: 5 * 60_000,
    }),
};
