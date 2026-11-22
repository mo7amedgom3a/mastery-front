/**
 * Anonymous lab identity for the live API.
 *
 * Learners may run labs before signing in. The browser keeps a random id in localStorage and sends
 * it as `X-Lab-Anonymous-Id`; after sign-in, `claimAnonymousLabs` moves those sessions, attempts
 * and badges to the account once (`POST /me/labs/claim`).
 */
import { apiRequest } from "@/lib/api/client";

const KEY = "ma-lab-anon";
const CLAIMED_KEY = "ma-lab-anon-claimed";
export const ANONYMOUS_HEADER = "X-Lab-Anonymous-Id";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

let memoryId: string | null = null;

export function getAnonymousLabId(): string | null {
  if (typeof window === "undefined") return null;
  const store = storage();
  const existing = store?.getItem(KEY) ?? memoryId;
  if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
  const created = randomId();
  memoryId = created;
  try {
    store?.setItem(KEY, created);
  } catch {
    // Private mode / quota: keep the id for this page only.
  }
  return created;
}

let claimPromise: Promise<boolean> | null = null;

/** Claim anonymous runs into the signed-in account; a 401 (signed out) just means "not yet". */
export function claimAnonymousLabs(): Promise<boolean> {
  claimPromise ??= (async () => {
    const store = storage();
    const id = store?.getItem(KEY);
    if (!id || store?.getItem(CLAIMED_KEY) === id) return false;
    try {
      await apiRequest("POST", "/api/v1/me/labs/claim", { sameOrigin: true, body: { anonymous_id: id } });
      store?.setItem(CLAIMED_KEY, id);
      return true;
    } catch {
      return false;
    } finally {
      claimPromise = null;
    }
  })();
  return claimPromise;
}
