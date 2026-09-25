import { getApiBaseUrl } from "@/config/env";

const API_PREFIX = "/api/v1";

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;
type PathParams = Record<string, string | number>;

export type ApiRequestContext = {
  customerId?: string;
  rebuildToken?: string;
  requestId?: string;
};

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  body?: unknown;
  headers?: HeadersInit;
  path?: PathParams;
  query?: QueryParams;
  context?: ApiRequestContext;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export type ApiErrorBody = {
  detail?: unknown;
  [key: string]: unknown;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: {
      body?: ApiErrorBody | string;
      detail?: unknown;
      requestId?: string | null;
      retryAfter?: string | null;
      url?: string;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  method: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers: requestHeaders, path: pathParams, query, context, ...requestOptions } = options;
  const headers = buildHeaders(requestHeaders, context);
  const url = buildApiUrl(path, pathParams, query);

  if (body !== undefined && !isFormData(body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...requestOptions,
    method,
    headers,
    body: body === undefined ? undefined : serializeBody(body),
  });

  if (!response.ok) {
    throw await createApiError(response, url);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!hasJsonBody(response)) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return apiRequest<T>("GET", path, options);
}

function buildHeaders(headers: HeadersInit | undefined, context: ApiRequestContext | undefined): Headers {
  const builtHeaders = new Headers(headers);

  if (context?.customerId) {
    builtHeaders.set("X-Customer-Id", context.customerId);
  }

  if (context?.rebuildToken) {
    builtHeaders.set("X-Recommendation-Rebuild-Token", context.rebuildToken);
  }

  if (context?.requestId) {
    builtHeaders.set("X-Request-ID", context.requestId);
  }

  return builtHeaders;
}

function buildApiUrl(path: string, pathParams: PathParams | undefined, query: QueryParams | undefined): string {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = normalizeApiPath(interpolatePath(path, pathParams), baseUrl);
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      appendQueryParam(url, key, value);
    }
  }

  return url.toString();
}

function normalizeApiPath(path: string, baseUrl: string): string {
  const basePath = new URL(baseUrl).pathname.replace(/\/$/, "");
  const pathWithSlash = path.startsWith("/") ? path : `/${path}`;

  if (basePath.endsWith(API_PREFIX) && pathWithSlash.startsWith(API_PREFIX)) {
    return pathWithSlash.slice(API_PREFIX.length) || "/";
  }

  return pathWithSlash;
}

function interpolatePath(path: string, pathParams: PathParams | undefined): string {
  if (!pathParams) {
    return path;
  }

  return path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = pathParams[key];

    if (value === undefined) {
      throw new Error(`Missing path parameter: ${key}`);
    }

    return encodeURIComponent(String(value));
  });
}

function appendQueryParam(url: URL, key: string, value: QueryValue | QueryValue[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryParam(url, key, item);
    }
    return;
  }

  if (value === undefined || value === null) {
    return;
  }

  url.searchParams.append(key, String(value));
}

function serializeBody(body: unknown): BodyInit {
  return isFormData(body) ? body : JSON.stringify(body);
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function hasJsonBody(response: Response): boolean {
  return response.headers.get("Content-Type")?.includes("application/json") ?? false;
}

async function createApiError(response: Response, url: string): Promise<ApiError> {
  const body = await parseErrorBody(response);
  const detail = typeof body === "object" && body !== null ? body.detail : undefined;
  const message = typeof detail === "string" ? detail : `API request failed: ${response.status}`;

  return new ApiError(response.status, message, {
    body,
    detail,
    requestId: response.headers.get("X-Request-ID"),
    retryAfter: response.headers.get("Retry-After"),
    url,
  });
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | string | undefined> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return text;
  }
}
