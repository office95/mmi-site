import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
