import "dotenv/config";
import { defineConfig } from "vitest/config";

// Unlike `next dev`/`next build`, Vitest doesn't load .env on its own — tests
// that read process.env (ej. the APP_URL origin check in the refresh route)
// would silently run against undefined vars locally while CI sets them
// explicitly. Loading .env here keeps local `pnpm test` and CI consistent;
// in CI there's no .env file, so this is a no-op and the workflow's own env
// vars stand.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    passWithNoTests: false,
  },
});
