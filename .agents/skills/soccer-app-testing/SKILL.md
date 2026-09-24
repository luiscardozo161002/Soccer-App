---
name: soccer-app-testing
description: Test Soccer App features and regressions across Next.js routes, domain services, and browser flows. Use for auth, players, matches, cards, and sanctions test work.
---

# Soccer App testing

- Read only the domain code and tests involved in the requested flow. Follow `docs/coding-standards.md` and preserve the existing Vitest conventions.
- For domain rules, add focused tests beside the service or rules module. For API routes, cover authentication, authorization, Zod validation, business errors, and response contracts where relevant.
- For user-facing regressions, add Playwright tests that exercise the actual UI with role or label locators. Prioritize login, player folio and duplicate-name validation, scheduled match editing, and sanction visibility.
- Use disposable test data and an isolated database. Never run E2E tests against production or use real credentials. Do not reset a database or apply destructive migrations without explicit approval.
- Verify the focused test first, then run `pnpm verify`; run `pnpm build` when the change affects app integration. Report what was and was not exercised.
- Run browser smoke tests with `pnpm test:e2e`. They use local Microsoft Edge, a separate Next build directory, and an unreachable database URL; browser API responses are mocked. Authenticated flows need a disposable test database before claiming E2E coverage.

Inspired by alirezarezvani/claude-skills (MIT): `engineering-team/playwright-pro` and `engineering/skills/api-test-suite-builder`. This skill does not import their hooks, scripts, or tool permissions.
