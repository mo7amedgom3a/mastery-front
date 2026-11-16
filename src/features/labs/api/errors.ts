/** Errors returned by the labs API (mock and live), shaped like FastAPI's `detail` payloads. */
export type LabApiErrorDetails = {
  status: number;
  code: string;
  detail?: unknown;
  requestId?: string;
  url?: string;
};

export class LabApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: unknown;
  readonly requestId?: string;
  readonly url?: string;

  constructor(message: string, details: LabApiErrorDetails) {
    super(message);
    this.name = "LabApiError";
    this.status = details.status;
    this.code = details.code;
    this.detail = details.detail;
    this.requestId = details.requestId;
    this.url = details.url;
  }
}

export function isLabApiError(error: unknown): error is LabApiError {
  return error instanceof LabApiError;
}

/** Human-readable message from a mock/live error, for the small inline error states. */
export function labErrorMessage(error: unknown, fallback = "تعذّر إكمال الطلب. حاول مرة أخرى."): string {
  if (error instanceof LabApiError) {
    if (typeof error.detail === "string" && error.detail.trim()) return error.detail;
    if (error.detail && typeof error.detail === "object" && "message" in error.detail) {
      const message = (error.detail as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
