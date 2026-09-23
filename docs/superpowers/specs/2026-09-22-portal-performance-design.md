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

### 3. Lazy exceljs

`chunk-C4zoc1yC.js` is 938 KB raw / 218 KB brotli (exceljs + jszip) and is
already code-split to the P&L page. Move it behind a dynamic `import()` fired
on export click so visiting P&L does not pay for it.

### 4. Logging

`src/lib/logger.ts` constructs pino with no `level` option, so it defaults to
`info` — and pino does **not** read `LOG_LEVEL` on its own. `pino-http` then
writes full request and response header objects for every request. Journald
now holds **3.9 GB** spanning 2026-05-14 to 2026-09-22, large enough that
`journalctl` queries time out.

Setting an env var alone therefore fixes nothing. This needs a code change:
make the level configurable and stop serializing full headers.

```ts
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: ...
})
```

plus `pino-http` serializers that log method, url and status rather than the
whole header object. Then set `LOG_LEVEL=warn` in the production `.env`.

This is disk hygiene and log usability, not latency — the logging is not on
the critical path. Listed here because it was found during inspection and it
is actively blocking production diagnostics.

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
