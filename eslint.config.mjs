import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/api/**/*.ts", "modules/**/server/*.service.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/prisma",
              message: "Prisma solo se importa desde repositories o infraestructura de base de datos.",
            },
          ],
          patterns: [
            {
              group: ["@/app/generated/prisma/**"],
              message: "Routes y services no deben depender directamente del cliente generado.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      // Existing forms synchronize editable drafts from async data. Keep the
      // React 19 migration visible without blocking unrelated feature work.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**",
    ".claude/**",
    "app/generated/prisma/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
