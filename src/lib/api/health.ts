import { apiFetch } from "@/lib/api/client";
import type { HealthResponse } from "@/types/api";

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health", { cache: "no-store" });
}
