/**
 * Affiliate / invite-a-friend attribution in the browser. The first `?ref=` a visitor arrives with
 * is kept (first touch, 30 days) in first-party storage, so it survives ad-blockers that stop
 * tolt.js; tolt.js adds its click and partner ids when it loads. The backend decides what counts.
 */

const STORAGE_KEY = "ma_ref";
const INFO_KEY = "ma_ref_info";
const COOKIE = "ma_ref";
const MAX_AGE_DAYS = 30;
const CODE = /^[a-z0-9][a-z0-9_-]{1,99}$/i;

type StoredRef = { ref: string; at: number };
type ToltData = { click_id?: string | null; partner_id?: string | null } | null | undefined;

export type ReferralPayload = { ref?: string | null; tolt_click_id?: string | null; tolt_partner_id?: string | null };

export type ResolvedReferral = {
  valid: boolean;
  referral_code: string;
  partner_kind?: string | null;
  partner_name?: string | null;
  discount_percent?: number | null;
  coupon_code?: string | null;
  message?: string | null;
};

export function readStoredReferralInfo(): ResolvedReferral | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INFO_KEY);
    return raw ? (JSON.parse(raw) as ResolvedReferral) : null;
  } catch {
    return null;
  }
}

export async function resolveReferral(code: string): Promise<ResolvedReferral | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/b2c/affiliates/referrals/resolve?code=${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as ResolvedReferral;
    if (data.valid) {
      window.localStorage.setItem(INFO_KEY, JSON.stringify(data));
      return data;
    }
  } catch {
    // Ignore resolution network failures
  }
  return null;
}

function readStored(): StoredRef | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredRef) : null;
    if (parsed && Date.now() - parsed.at < MAX_AGE_DAYS * 86_400_000) return parsed;
  } catch {
    // Blocked storage: fall back to the cookie below.
  }
  const match = document.cookie.match(/(?:^|;\s*)ma_ref=([^;]+)/);
  return match ? { ref: decodeURIComponent(match[1]), at: Date.now() } : null;
}

/** Called once per page load: remembers the first referral code the visitor arrived with. */
export function captureReferral(): void {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(window.location.search).get("ref")?.trim();
  if (!ref || !CODE.test(ref) || readStored()) return;
  const value: StoredRef = { ref: ref.toLowerCase(), at: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Cookie below still applies.
  }
  document.cookie = `${COOKIE}=${encodeURIComponent(value.ref)}; path=/; max-age=${MAX_AGE_DAYS * 86_400}; samesite=lax`;
}

/** What to send with sign-in and checkout; undefined when the visitor didn't come from a referral. */
export function currentReferral(): ReferralPayload | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = readStored();
  const tolt = (window as unknown as { tolt_data?: ToltData }).tolt_data;
  if (!stored && !tolt?.partner_id) return undefined;
  return {
    ref: stored?.ref ?? null,
    tolt_click_id: tolt?.click_id ?? null,
    tolt_partner_id: tolt?.partner_id ?? null,
  };
}
