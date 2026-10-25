import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests of what a customer sees after admin actions, against the running dev stack: this app
 * (`npm run dev`, :3000) and the backend (:8000). The QA customer is signed in by cookie injection and
 * state is arranged through the backend admin API with the QA admin. They change dev data (and restore
 * it), so never point them at production.
 *
 *   QA_ADMIN_EMAIL=… QA_CUSTOMER_EMAIL=… QA_LOGIN_KEY=… npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_FRONT_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
