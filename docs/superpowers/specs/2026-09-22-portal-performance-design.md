# Portal Performance — Design

**Date:** 2026-09-22
**Status:** Approved for implementation
**Repos:** `ark-frontend`, `ark-services`

## Problem

Portals feel slow to load. Measurement shows the cause is *not* server compute.

Evidence gathered 2026-09-22 against production (`217.217.253.184`, Contabo, Singapore):

| Measurement | Value |
|---|---|
| VPS load average | `0.00, 0.00, 0.00` (94.3% idle) |
| Memory | 1.3 GiB used / 7.8 GiB |
| `ark_erp` database size | 13 MB (vs 128 MB `shared_buffers`) |
| API server processing | ~13 ms; pino logs `responseTime: 0` |
| Server-local `/api/auth/me` | 4 ms |
| Client RTT to VPS | ~60 ms |

The API is already fast. Loading time is spent on three things:

1. **Nothing is cacheable.** 17/17 assets on finance and 8/8 on login return no
   `cache-control`, no `etag`, no `last-modified`. Content-hashed immutable
   files are re-downloaded in full on every navigation — 105 KB per finance
   load, across 7 separate subdomain origins.
2. **SSR HTML and API JSON are uncompressed.** The Caddyfile has no `encode`
   directive. `size_on_wire` is byte-identical (6087) with and without
   `Accept-Encoding: br, gzip`. Assets are brotli'd only because Vike's own
   server does it; Caddy passes HTML and JSON through raw.
3. **A serialized auth waterfall.** `SubPortalShell` calls `useCurrentUser()`
   and `AuthGate` gates children behind `userQuery.isPending`, so page data
   queries cannot start until `/me` returns:
   `HTML → JS → /api/auth/me → page data` = ~4 round trips at 60 ms, with
   step 2 re-downloading every asset.

A Hono migration was considered and **rejected**: it would replace ~13 ms of
server time nobody waits on, while touching 159 endpoints across 14,273 LOC.
It addresses none of the three causes above.

## Goals

- Eliminate repeat asset downloads.
- Compress SSR HTML and API JSON.
- Remove the `/me` round trip from the critical path.
- Correct two documentation drifts found during inspection.

## Non-goals

- Migrating off Express 5. Explicitly dropped.
- Postgres tuning. A 13 MB database in 128 MB of `shared_buffers` has no
  measurable problem to solve.
- Moving hosting or adding a CDN.

## Design

### 1. Caching and compression (Caddy only, no app code)

Both fixes are edge config. Verified against Caddy's Caddyfile docs:
`encode` supports **`zstd` and `gzip` only — brotli is not a Caddyfile
encoder**. Caddy will not re-encode a response that already carries
`Content-Encoding`, so Vike's brotli on `/assets/*` is preserved and HTML and
JSON gain zstd/gzip.

Each portal block in `infra/caddy/Caddyfile.portals` becomes:

```caddyfile
finance.arkinstitutebc.com {
    encode zstd gzip
    header /assets/* >Cache-Control "public, max-age=31536000, immutable"
    reverse_proxy localhost:3005
}
```

The `>` defer flag sets the header after the proxy writes its own, so Vike
cannot override it. `/assets/*` only — SSR HTML keeps Vike's
`no-store, max-age=0`, which is correct for per-user pages.

The API block lives in `ark-services/scripts/setup-vps.sh` (the heredoc at
line 162), not in a tracked Caddyfile. It gains `encode zstd gzip`.

### 2. Removing the auth waterfall

Uses the Vike-documented auth pattern (`vike.dev/auth`), verified against
Vike 0.4.258 as installed.

- `pages/+onCreatePageContext.server.ts` runs per incoming request, reads
  `pageContext.headers.cookie`, and calls `http://localhost:4000/api/auth/me`
  — a 4 ms server-local call, replacing a 60 ms client round trip. Sets
  `pageContext.user`.
- `pages/+guard.ts` at the root of each app throws `redirect()` when
  `user` is null, so unauthenticated users never ship a page shell.
- `pages/+config.ts` gains `passToClient: ['user']`.
- `AuthGate` consumes `pageContext.user` instead of a pending query, and the
  TanStack cache is seeded with it so `useCurrentUser()` does not refetch.

Portals call the API rather than verifying JWTs themselves. This keeps
`JWT_SECRET` on the API only and avoids duplicating `src/lib/jwt.ts` logic
across 7 servers, at a cost of 4 ms.

Shared logic lives in one module exported from `@ark/api-client`; each app's
`+onCreatePageContext.server.ts` is a thin re-export rather than 7 copies.

**Resolved during implementation (2026-09-23):**

- *Cross-origin `redirect()` from a Vike guard* — **works**. Verified locally
  and in production: an unauthenticated request to any sub-portal returns
  `302` with `location: https://portal.arkinstitutebc.com/login`. The
  documented fallback was not needed.
- *`pageContext.json` on SPA navigation* — **it does fire**, ~423 B per
  client-side navigation. Accepted rather than reverted: the initial-load win
  is large and user-confirmed, and the request is small. The documented
  fallback (seed the TanStack cache, drop `user` from `passToClient`) is
  **not viable as written** — see below.
- *Seeding the TanStack cache from SSR is unsafe.* `packages/api-client/src/query-client.ts`
  exports a **module-level singleton** `QueryClient`, shared across every
  request on the server. Calling `setQueryData(["auth","me"], user)` during
  SSR would leak one user's session into another user's response. The
  implementation passes `ssrUser` through `pageContext` props instead, which
  is request-scoped and safe. Any future work on that fallback must first make
  the QueryClient per-request.

**The `main` portal is deliberately excluded from this pattern.** Unlike the
six sub-portals it has no `SubPortalShell`, handles auth per-page, and serves
genuinely public routes — `/login`, plus `/forms/student/@batchId` and
`/student/@batchId`, which back `forms.arkinstitutebc.com`. A blanket
`+guard.ts` there would break public student enrollment. Giving `main` the
same treatment needs its own design and is not covered by this spec.

### 3. Lazy exceljs — no change needed (verified 2026-09-23)

`chunk-C4zoc1yC.js` is 938 KB raw / 218 KB brotli (exceljs + jszip). The spec
assumed it loaded on page view; it does not. `pages/pnl/+Page.tsx:47` already
uses `await import("exceljs/dist/exceljs.min.js")` inside the export handler.

Verified in the build output and end to end:
- the chunk is **not** among the pnl entry's static imports
- it is reached via `import("../chunks/chunk-C4zoc1yC.js")` with an empty
  Vite preload-deps array
- serving `/pnl` to an authenticated user returns HTML with **zero**
  references to the chunk (14 assets, none of them exceljs)

The earlier inference came from the entry *referencing* the chunk, which is
just the dynamic-import mapping. No work required.

### 4. Logging — root cause was worse than described (fixed 2026-09-23)

The spec blamed verbose `pino-http` serialisers. That was real but secondary.

`bun build` **inlines `process.env.NODE_ENV` at build time**, and neither the
CI deploy nor `scripts/deploy-production.sh` sets it for the build step. The
ternary in `src/lib/logger.ts` therefore collapsed to its development branch
and the production bundle shipped with pino-pretty hardcoded:

```js
var logger = import_pino.default({ transport: { target: "pino-pretty", options: { colorize: true } } });
```

Production had been writing multi-line ANSI-coloured logs instead of JSON,
and paying pino-pretty's cost on every request. That, not the headers, drove
journald to 4.0 GB.

Fixes applied:
- `logger.ts` keys pretty output off an explicit `LOG_PRETTY` flag that bun
  does not substitute, so the decision is made at runtime. `bun run dev` sets
  `LOG_PRETTY=true`; production leaves it unset.
- `logger.ts` reads `LOG_LEVEL` (pino does not do this on its own).
- `app.ts` trims the `pino-http` req/res serialisers to method, url and
  status.
- journald gained `SystemMaxUse=500M` / `SystemKeepFree=1G`, so it cannot
  silently regrow.

Result: one request log went from a multi-line coloured block with ~25 header
fields to a single 192-byte JSON line. Journal vacuumed 4.0 GB → 483 MB, and
a 7-day `journalctl` aggregation that previously exceeded a 120 s timeout now
finishes in ~11 s.

### 5. Documentation drift

- `CLAUDE.md` workspace layout pairs production hostnames with **dev** ports
  (finance shown as 3004; production is 3005). `ark-frontend/README.md`
  already has a correct dev|prod table. Annotate CLAUDE.md and point at it.
- `AGENTS.md` states the documented SSH alias is `ark-vps`. That host does not
  exist — it is absent from `~/.ssh/config` and fails to resolve. Only
  `ark-api` works. Make `ark-api` the documented alias.

## Rollout

Ordered so the cheap, reversible, high-value work lands and is measured before
anything touches auth.

1. **Caddy** — edit Caddyfile, `caddy validate`, reload. No rebuild, no
   deploy. Rollback is one file plus `systemctl reload caddy`.
2. **Measure** — re-run the asset waterfall script; confirm `cache-control` on
   all assets and `content-encoding` on HTML. Expect repeat loads to drop from
   105 KB to ~0.
3. **Waterfall on finance only** — verify SSR auth, the redirect path, and the
   `pageContext.json` question above on one portal.
4. **Roll out to remaining 6** once finance is confirmed.
5. **Lazy exceljs, logging, docs** — independent, any time.

## Verification

- `bun run lint`, `bun run typecheck`, `bun run test:unit` in `ark-frontend`
- `bun run lint`, `bun run build` in `ark-services`
- Focused `bun run test:e2e` over login and a gated portal route, since auth
  flow changes are the main risk
- Asset waterfall script re-run against production after each phase

## Risks

- **Auth is the blast radius.** Every portal sits behind `AuthGate`. A mistake
  logs everyone out or, worse, lets an unauthenticated user render a shell.
  Mitigated by the finance-first rollout and E2E coverage of login.
- **`immutable` on a non-hashed asset would pin a stale file for a year.** The
  header is scoped to `/assets/*`, which Vike fills exclusively with
  content-hashed filenames. Any future unhashed file under that path would be
  a problem.
- Changing `packages/ui` rebuilds all 7 portals in CI.

---

## Follow-up work completed 2026-09-23

### Transactions date filter

Two behaviour issues found while fixing the 500, both pre-existing:

- **End date excluded part of the final day.** `BETWEEN … AND '2026-09-23'`
  resolves to midnight, dropping rows whose `transaction_date` is NULL and
  whose `created_at` falls later that day. Replaced with
  `>= start` / `< end + interval '1 day'`. Measured against production:
  filtering to `endDate=2026-09-21` returned **474 rows before, 475 after** —
  the old query was silently losing a real transaction.
- **No date-format validation.** `startDate`/`endDate` were `z.string()`, so
  `?startDate=banana` reached Postgres and produced a 500. Now
  `z.string().date()`, which also rejects impossible dates like `2026-02-31`.
  Verified the only frontend caller sends `YYYY-MM-DD`, so no regression.

### `bun build` inlines NODE_ENV — three production branches were wrong

Neither the CI deploy, `scripts/deploy-production.sh`, nor the `build` script
set `NODE_ENV`, so **every** `process.env.NODE_ENV === "development"` check
compiled to `true` in the shipped bundle:

| Source | Shipped as | Impact |
|---|---|---|
| `middleware/auth.ts:18` dev bypass | `!token && true && DEV_BYPASS === "true"` | Auth bypass gated on `DEV_BYPASS` alone. **Inert only because `DEV_BYPASS` is unset in production.** |
| `modules/auth/routes.ts:50` cookie | `secure: false` | Session cookie set without the `Secure` flag (HSTS mitigated it). |
| `middleware/error.ts:178` | always `err.message` | Internal errors returned to clients — this is why the transactions `TypeError` surfaced in the browser. |

Fixed by setting `NODE_ENV=production` in the `build` script itself (so every
build path inherits it), plus explicitly in `deploy-production.sh` and the CI
workflow. Verified in the deployed bundle: `DEV_BYPASS` is now **dead-code
eliminated (0 occurrences)**, `"Internal server error"` is present, and the
cookie compiles to `secure: true`.

**Lesson for future work:** `bun build` substitutes `process.env.NODE_ENV` at
build time. Any behaviour keyed off it is decided when the bundle is built,
not when it runs.
