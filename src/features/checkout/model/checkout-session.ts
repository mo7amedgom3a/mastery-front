import { useMemo, useSyncExternalStore } from "react";

/**
 * Browser-side bookkeeping for a checkout. Lives in sessionStorage: per tab, and gone when the tab
 * closes.
 *
 * - The idempotency key is tied to *what* is being bought (the fingerprint). A double click, a retry
 *   after a network error, or pressing "pay" again after coming back from Stripe sends the same key,
 *   so the backend returns the same order and Stripe session instead of opening a second one. A
 *   changed cart is a different fingerprint, hence a new key and a new order.
 * - The pending checkout (order and payment ids) is a fallback for the return page; the backend also
 *   puts both ids in the success URL.
 */

const KEY_PREFIX = "ma-checkout-key:";
const PENDING_KEY = "ma-checkout-pending";
const CELEBRATED_PREFIX = "ma-celebrated:";

export type PendingCheckout = { orderId: string; paymentIntentId: string; fingerprint: string };

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Blocked storage (privacy mode): keys then live for this page only, which still covers double clicks.
    return null;
  }
}

const memory = new Map<string, string>();

function read(key: string): string | null {
  const store = storage();
  try {
    return store ? store.getItem(key) : (memory.get(key) ?? null);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string | null): void {
  const store = storage();
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, value);
  } catch {
    // Quota or blocked: the in-memory copy above still applies.
  }
}

function newKey(): string {
  return `checkout-${crypto.randomUUID()}`;
}

/** The key for this checkout, created on first use and reused until it is retired. */
export function checkoutKey(fingerprint: string): string {
  const existing = read(KEY_PREFIX + fingerprint);
  if (existing) return existing;
  const key = newKey();
  write(KEY_PREFIX + fingerprint, key);
  return key;
}

/** A fresh key for the same checkout (the old one ended or belonged to another request). */
export function rotateCheckoutKey(fingerprint: string): string {
  const key = newKey();
  write(KEY_PREFIX + fingerprint, key);
  return key;
}

/** Called once the checkout reached a final state (paid or failed): the next attempt is a new order. */
export function retireCheckoutKey(fingerprint: string): void {
  write(KEY_PREFIX + fingerprint, null);
}

export function savePendingCheckout(pending: PendingCheckout): void {
  write(PENDING_KEY, JSON.stringify(pending));
}

export function readPendingCheckout(): PendingCheckout | null {
  return parsePending(read(PENDING_KEY));
}

function parsePending(raw: string | null): PendingCheckout | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PendingCheckout>;
    return typeof value.orderId === "string" && typeof value.paymentIntentId === "string"
      ? { orderId: value.orderId, paymentIntentId: value.paymentIntentId, fingerprint: value.fingerprint ?? "" }
      : null;
  } catch {
    return null;
  }
}

/** The order's checkout is over: forget its key and the pending ids. */
export function settleCheckout(orderId: string): void {
  const pending = readPendingCheckout();
  if (pending?.orderId !== orderId) return;
  if (pending.fingerprint) retireCheckoutKey(pending.fingerprint);
  write(PENDING_KEY, null);
}

/** True the first time it is asked for an order (per tab): the confetti plays once. */
export function claimCelebration(orderId: string): boolean {
  if (read(CELEBRATED_PREFIX + orderId)) return false;
  write(CELEBRATED_PREFIX + orderId, "1");
  return true;
}

const noSubscription = () => () => undefined;
const readPendingRaw = () => read(PENDING_KEY);
const unknownOnServer = () => undefined;

/** The checkout this tab started; `undefined` while rendering on the server (not known there). */
export function usePendingCheckout(): PendingCheckout | null | undefined {
  const raw = useSyncExternalStore(noSubscription, readPendingRaw, unknownOnServer);
  return useMemo(() => (raw === undefined ? undefined : parsePending(raw)), [raw]);
}
