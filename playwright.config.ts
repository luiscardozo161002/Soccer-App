import { randomBytes } from "node:crypto";
import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL } from "./e2e/test-env";

const e2eJwtSecret = randomBytes(32).toString("hex");
process.env.SOCCER_E2E_JWT_SECRET = e2eJwtSecret;
const localDataTest = process.env.SOCCER_LOCAL_DATA_TEST === "1";
const localDatabaseUrl = process.env.DATABASE_URL;
if (localDataTest && (!localDatabaseUrl || !["localhost", "127.0.0.1", "::1"].includes(new URL(localDatabaseUrl).hostname))) {
  throw new Error("Local data tests require a loopback DATABASE_URL");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: E2E_BASE_URL,
    ...devices["Desktop Chrome"],
    channel: "msedge",
  },
  webServer: {
    command: "pnpm exec next dev --webpack --disable-source-maps --hostname 127.0.0.1 --port 3137",
    url: E2E_BASE_URL + "/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SOCCER_E2E: "1",
      JWT_SECRET: e2eJwtSecret,
      DATABASE_URL: localDataTest ? localDatabaseUrl! : "postgresql://e2e:e2e@127.0.0.1:1/e2e_no_database",
      APP_URL: E2E_BASE_URL,
    },
  },
});
