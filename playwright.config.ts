import { defineConfig } from "@playwright/test";

/**
 * Points at the static export served by `scripts/test-static.mjs`, never at a
 * dev server: these tests exist to check the artifact that ships.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
});
