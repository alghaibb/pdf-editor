import { config as loadEnv } from "dotenv"
import { defineConfig, devices } from "@playwright/test"

loadEnv()

/**
 * The core-loop test drives the real dev server against the real database
 * and R2 bucket, and WebViewer takes a while to boot in dev, hence the
 * generous timeouts.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 240_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
