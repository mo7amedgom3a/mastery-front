import { queryOptions } from "@tanstack/react-query";

import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import type { SuccessResponse } from "@/lib/api/operation-types";

type HealthOperation = "health_check_api_v1_health_get";
type DatabaseHealthOperation = "database_health_check_api_v1_health_database_get";

export type HealthResponse = SuccessResponse<HealthOperation>;
export type DatabaseHealthResponse = SuccessResponse<DatabaseHealthOperation>;

const healthPaths = {
  health: "/api/v1/health",
  database: "/api/v1/health/database",
} as const;

export const healthKeys = {
  all: ["health"] as const,
  status: () => [...healthKeys.all, "status"] as const,
  database: () => [...healthKeys.all, "database"] as const,
};

export function getHealth(options?: ApiRequestOptions): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("GET", healthPaths.health, {
    cache: "no-store",
    ...options,
  });
}

export function getDatabaseHealth(options?: ApiRequestOptions): Promise<DatabaseHealthResponse> {
  return apiRequest<DatabaseHealthResponse>("GET", healthPaths.database, {
    cache: "no-store",
    ...options,
  });
}

export const healthQueries = {
  status: () =>
    queryOptions({
      queryKey: healthKeys.status(),
      queryFn: ({ signal }) => getHealth({ signal }),
      staleTime: 15_000,
    }),
  database: () =>
    queryOptions({
      queryKey: healthKeys.database(),
      queryFn: ({ signal }) => getDatabaseHealth({ signal }),
      staleTime: 15_000,
    }),
};
