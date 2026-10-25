import { randomUUID } from "node:crypto";

import { expect, request as playwrightRequest, type APIRequestContext, type BrowserContext } from "@playwright/test";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

export function qa() {
  const key = process.env.QA_LOGIN_KEY;
  const admin = process.env.QA_ADMIN_EMAIL;
  const customer = process.env.QA_CUSTOMER_EMAIL;
  if (!key || !admin || !customer) {
    throw new Error("Set QA_LOGIN_KEY, QA_ADMIN_EMAIL and QA_CUSTOMER_EMAIL to run the e2e tests");
  }
  return { key, admin, customer };
}

const fingerprint = { "X-Client-Fingerprint": `e2e-${randomUUID()}` };

async function json<T>(response: Awaited<ReturnType<APIRequestContext["get"]>>): Promise<T> {
  expect(response.ok(), `${response.url()} → ${response.status()} ${await response.text()}`).toBeTruthy();
  return (await response.json()) as T;
}

/** A backend client signed in as the QA admin (bearer token). */
export async function adminApi(): Promise<APIRequestContext> {
  const anon = await playwrightRequest.newContext({ baseURL: API_URL, extraHTTPHeaders: fingerprint });
  const login = await json<{ tokens: { access_token: string } }>(
    await anon.post("/api/v1/admin/auth/qa/login", { data: { email: qa().admin, key: qa().key } }),
  );
  await anon.dispose();
  return playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { ...fingerprint, Authorization: `Bearer ${login.tokens.access_token}` },
  });
}

/** Signs the browser in as the QA customer: the storefront reads these cookies (see `src/lib/auth/cookie-names.ts`). */
export async function signInCustomer(context: BrowserContext, baseURL: string): Promise<void> {
  const anon = await playwrightRequest.newContext({ baseURL: API_URL, extraHTTPHeaders: fingerprint });
  const login = await json<{ tokens: { access_token: string; refresh_token: string } }>(
    await anon.post("/api/v1/auth/qa/login", { data: { email: qa().customer, key: qa().key } }),
  );
  await anon.dispose();
  const url = new URL(baseURL);
  await context.addCookies([
    { name: "b2c_access_token", value: login.tokens.access_token, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "b2c_session", value: "1", domain: url.hostname, path: "/", sameSite: "Lax" },
    { name: "b2c_refresh_token", value: login.tokens.refresh_token, domain: url.hostname, path: "/api/auth", httpOnly: true, sameSite: "Strict" },
  ]);
}

export { json };
