import type { ApiRequestContext } from "@/lib/api/client";

const FINGERPRINT_STORAGE_KEY = "mastery.client_fingerprint";
const FINGERPRINT_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function createRequestId(): string {
  return randomId();
}

export function getClientFingerprint(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const existing = window.localStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (FINGERPRINT_PATTERN.test(existing ?? "")) {
    return existing ?? undefined;
  }

  const fingerprint = randomId();
  window.localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
  return fingerprint;
}

export function getCustomerTrackingContext(): ApiRequestContext {
  return {
    clientFingerprint: getClientFingerprint(),
    requestId: createRequestId(),
  };
}

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
