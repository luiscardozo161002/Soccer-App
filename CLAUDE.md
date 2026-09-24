# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev                          # predev runs `prisma migrate deploy`, then `next dev`
pnpm typecheck                    # next typegen + tsc --noEmit
pnpm lint                         # eslint
pnpm test                         # vitest run (all *.test.ts)
pnpm test:watch                   # vitest watch mode
pnpm exec vitest run path/to/x.test.ts   # single test file
pnpm verify                       # typecheck && lint && test — run before considering a feature done
pnpm ci                           # verify && build
pnpm db:bootstrap-admin           # creates the admin user — NOT idempotent, run once per database
pnpm db:seed-clausura-caliope     # idempotent seed: active season, teams, fields for the current tournament
```

Tests live next to the code they cover (`modules/<domain>/**/*.test.ts`), not in a separate `__tests__` tree.

## Architecture

Domain-modular monolith, Next.js 16 App Router serving both the frontend and the API. Strict
one-way layering, enforced by convention, not by tooling:

```bash
UI → hooks/client (modules/<domain>/hooks) → route (app/api/v1/**) → service → repository → Prisma
```

A layer never skips the next one or imports upward. Only repositories import Prisma.

- **`app/`** — composition only: layouts, pages, and Route Handlers. No business logic.
  - `(landing)/` — public site (standings, schedule, teams), no session required.
  - `(platform)/admin/` — admin panel, session-gated by `proxy.ts`.
  - `login/`, `forgot-password/`, `reset-password/` — public auth pages.
  - `api/v1/**` — Route Handlers; each one is thin: parse/validate with Zod, call a service, return
    the envelope (see below). Never touches Prisma directly.
- **`modules/<domain>/`** — where domain code actually lives (`auth`, `cards`, `fields`, `matches`,
  `players`, `sanctions`, `seasons`, `settings`, `standings`, `teams`, `users`). Each module can
  have `client/` (HTTP client + query keys), `hooks/` (TanStack Query), `server/`
  (service + repository), plus `*.schema.ts` (Zod, shared client/server) and `*.types.ts`. New
  features go here, not in `lib/` or loose in `app/`.
- **`components/`** — feature-grouped visual components (`teams/`, `matches/`, `players/`, ...)
  mirroring the `modules/` domain names. `components/ui/` is the one deliberate exception:
  generic, business-logic-free primitives (Table, Modal, Field, Pagination). `components/auth/`
  holds `AuthShell`/`BrandPanel`, the shared visual shell for login/forgot/reset/404.
- **`lib/`** — cross-cutting infrastructure that isn't owned by any single domain: `auth/session.ts`
  (JWT sign/verify), `http/` (generic fetch client + `API_ROUTES` constants), `middleware/
  error-handler.ts` (`withErrorHandling`, the uniform error envelope), `query/query-keys.ts`
  (query-key factories), `security/rate-limit.ts` (Redis with in-memory fallback),
  `observability/logger.ts`, `constants/`.
- **`proxy.ts`** (repo root) — replaces the classic `middleware.ts` in this Next.js version. Single
  entry point for all cross-cutting request logic: redirects unauthenticated `/admin/*` to
  `/login?next=...`, requires a session for any non-GET under `/api/v1/*` (plus GET on
  `/api/v1/users`, since it lists admin accounts), and applies IP-based rate limiting to the three
  auth POST endpoints. There is no composable per-route middleware stack in this version — see
  `AGENTS.md` before assuming otherwise.

### API contract

Every Route Handler returns the same envelope — see `docs/arquitectura.md` §4 for the full status
code table and error-code conventions:

```jsonc
{ "success": true, "data": [...], "meta": { "page": 1, "pageSize": 20, "totalItems": 84, "totalPages": 5 } }
{ "success": false, "error": { "code": "MATCH_RESULT_LOCKED", "message": "...", "details": null } }
```

Business errors throw `ApiError` with a stable `code`; `withErrorHandling` also translates `ZodError`
→ 422 and known Prisma errors (FK/unique violation, not found) → 409/404 automatically.

### Notable domain rules

- Standings are never stored — computed per request from `Match` rows via a parametrized
  `prisma.$queryRaw` in `modules/standings/server/standings.repository.ts`.
- `Match.category` is derived from the home team at creation time; both teams in a match must share
  a category (enforced in `match.service.ts`).
- A red card (`Card`) has at most one `Sanction`. Registering a match result applies/advances
  sanctions for both teams inside the same transaction as the result write.
- `role` exists on `User` but only `"admin"` is in real use today — no differentiated permissions
  yet, aside from the `arbitro` write-scope check in `proxy.ts`.

For the full layered diagram, data model, and API endpoint list, see `docs/arquitectura.md`. For
naming conventions and the definition of done for a new feature, see `docs/coding-standards.md`.
