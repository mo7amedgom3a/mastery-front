/**
 * Transport selection for the labs API.
 *
 * - `mock` (default): an in-browser server with localStorage persistence.
 * - `live`: the FastAPI labs module (`/api/v1/labs`, `/api/v1/me/labs`) through the same-origin API
 *   client, with the anonymous lab id header for signed-out learners.
 *
 * The mock module is imported dynamically so a live build does not ship it in the main chunk.
 */
import { apiRequest } from "@/lib/api/client";

import { ANONYMOUS_HEADER, getAnonymousLabId } from "./anonymous";

import type { LabApiQuery } from "./contract";
import type { LabHttpMethod } from "./endpoints";

export type LabTransportOptions = {
  query?: LabApiQuery;
  body?: unknown;
  signal?: AbortSignal;
};

export type LabTransport = {
  readonly mode: "mock" | "live";
  request<T>(method: LabHttpMethod, path: string, options?: LabTransportOptions): Promise<T>;
};

export function getLabsApiMode(): "mock" | "live" {
  return process.env.NEXT_PUBLIC_LABS_API_MODE === "live" ? "live" : "mock";
}

let transportPromise: Promise<LabTransport> | null = null;

export function getLabTransport(): Promise<LabTransport> {
  transportPromise ??= createTransport();
  return transportPromise;
}

async function createTransport(): Promise<LabTransport> {
  if (getLabsApiMode() === "live") {
    return {
      mode: "live",
      request: <T,>(method: LabHttpMethod, path: string, options: LabTransportOptions = {}) => {
        const anonymousId = getAnonymousLabId();
        return apiRequest<T>(method, `/api/v1${path}`, {
          sameOrigin: true,
          query: options.query,
          body: options.body,
          signal: options.signal,
          headers: anonymousId ? { [ANONYMOUS_HEADER]: anonymousId } : undefined,
        });
      },
    };
  }

  const { getMockLabsServer } = await import("./mock/server");
  const server = getMockLabsServer();
  return {
    mode: "mock",
    request: <T,>(method: LabHttpMethod, path: string, options: LabTransportOptions = {}) =>
      server.request<T>(method, path, {
        query: options.query,
        body: options.body,
      }),
  };
}

/** Tests and HMR can drop the singleton without touching the persisted mock DB. */
export function resetLabTransport(): void {
  transportPromise = null;
}
