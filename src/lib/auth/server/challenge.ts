import "server-only";

import { getAuthCookieSecret } from "@/config/env";

import { CHALLENGE_MAX_AGE_SECONDS } from "./cookies";

/**
 * A sign-in waiting for its emailed code. `account` is what the backend answered for the login
 * name; null when it knows no such account, so that both cases leave the browser with a cookie
 * that looks the same.
 */
export type LoginChallenge = {
  loginName: string;
  account: { email: string; userId: string } | null;
  /** When the code was last sent (ms). */
  sentAt: number;
};

const IV_BYTES = 12;
/** Plaintext is padded to a multiple of this, so the cookie's length says nothing about its content. */
const BLOCK = 512;

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(getAuthCookieSecret()));
    return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
  })();
  // A missing secret must be reported on every attempt, not remembered as one rejected promise.
  keyPromise.catch(() => {
    keyPromise = null;
  });
  return keyPromise;
}

/** Encrypts and authenticates the challenge (AES-256-GCM) for the pending-login cookie. */
export async function sealChallenge(challenge: LoginChallenge): Promise<string> {
  const json = JSON.stringify(challenge);
  const plaintext = new TextEncoder().encode(json.padEnd(Math.ceil(json.length / BLOCK) * BLOCK, " "));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getKey(), plaintext));
  const sealed = new Uint8Array(iv.length + ciphertext.length);
  sealed.set(iv);
  sealed.set(ciphertext, iv.length);
  return Buffer.from(sealed).toString("base64url");
}

/** The challenge in a pending-login cookie; null when it is missing, forged, malformed or too old. */
export async function openChallenge(sealed: string | undefined): Promise<LoginChallenge | null> {
  if (!sealed) return null;
  let challenge: LoginChallenge;
  try {
    const bytes = new Uint8Array(Buffer.from(sealed, "base64url"));
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.subarray(0, IV_BYTES) },
      await getKey(),
      bytes.subarray(IV_BYTES),
    );
    challenge = JSON.parse(new TextDecoder().decode(plaintext)) as LoginChallenge;
  } catch {
    return null;
  }
  // The cookie's own lifetime is the browser's to honour; this one is checked here.
  const age = Date.now() - challenge.sentAt;
  if (!Number.isFinite(age) || age < 0 || age > CHALLENGE_MAX_AGE_SECONDS * 1000) return null;
  return challenge;
}
