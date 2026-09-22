# Portal Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut portal loading time by making assets cacheable, compressing HTML and JSON, and removing the `/api/auth/me` round trip from the critical path.

**Architecture:** Two edge-config changes in Caddy (compression, immutable asset caching) that need no application code. Then a Vike server-side auth hook that resolves the session during SSR via a 4 ms server-local API call, replacing a 60 ms client round trip. Rolled out to finance first, then the remaining six.

**Tech Stack:** Caddy 2.11.2, Vike 0.4.258, vike-solid 0.7.18, SolidJS 1.9, TanStack Solid Query v5, Bun, Express 5 (retained), pino.

**Spec:** `docs/superpowers/specs/2026-09-22-portal-performance-design.md`

## Global Constraints

- **Caddy `encode` supports `zstd` and `gzip` only.** Brotli is not a Caddyfile encoder. Never write `encode zstd br gzip` — it will not parse.
- **`Cache-Control: immutable` is scoped to `/assets/*` only.** Vike fills that path exclusively with content-hashed filenames. SSR HTML keeps Vike's `no-store, max-age=0`.
- **Portals never verify JWTs.** They call `http://localhost:4000/api/auth/me`. `JWT_SECRET` stays on the API only.
- **A `packages/**` change rebuilds all 7 portals** (`infra/deploy.sh` path filter). An `infra/**` change rebuilds and restarts nothing.
- **Production ports are dev port + 1** (main dev 3000 → prod 3001 … hr dev 3006 → prod 3007). See `README.md` "Production Ports".
- Commit messages are single-line, no `Co-Authored-By` trailer.
- Lint is Biome: `bunx biome check .` must pass before every commit.

---

### Task 1: Caddy compression and immutable asset caching

The highest-value change and the only one that needs no rebuild. Land and
measure this before anything touches auth.

**Files:**
- Modify: `ark-frontend/infra/caddy/Caddyfile.portals`
- Modify: `ark-services/scripts/setup-vps.sh:162-166`
- Modify: `ark-frontend/infra/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` and `Content-Encoding: zstd|gzip` on SSR HTML and API JSON.

- [ ] **Step 1: Capture the "before" baseline**

The measurement script already exists from the inspection. Recreate it and
record the numbers so the improvement is provable:

```bash
cat > /tmp/wf.sh <<'EOF'
#!/bin/bash
B="$1"; D="$2"
curl -s "$B$D" -o /tmp/pg.html
echo "HTML on-wire bytes: $(wc -c < /tmp/pg.html)"
grep -oE '/assets/[^"]*\.(js|css)' /tmp/pg.html | sort -u > /tmp/assets.txt
tot=0; nocc=0; n=0
while IFS= read -r a; do
  [ -z "$a" ] && continue
  sz=$(curl -s -H 'Accept-Encoding: br, gzip' -o /dev/null -D /tmp/h.txt -w '%{size_download}' "$B$a")
  cc=$(grep -i '^cache-control' /tmp/h.txt | tr -d '\r')
  if [ -z "$cc" ]; then cc="(none)"; nocc=$((nocc+1)); fi
  tot=$((tot+sz)); n=$((n+1))
  printf "%-46s %8s  cc=%s\n" "$(basename "$a")" "$sz" "$cc"
done < /tmp/assets.txt
echo "TOTAL asset bytes: $tot across $n assets; $nocc without cache-control"
EOF
bash /tmp/wf.sh https://finance.arkinstitutebc.com /
```

Expected before: `TOTAL asset bytes: 105083 across 17 assets; 17 without cache-control`.

Also record HTML compression:

```bash
curl -s -H 'Accept-Encoding: br, gzip' -o /dev/null -w 'enc=%{size_download}\n' https://finance.arkinstitutebc.com/
curl -s -o /dev/null -w 'raw=%{size_download}\n' https://finance.arkinstitutebc.com/
```

Expected before: both identical (6087).

- [ ] **Step 2: Back up the live Caddyfile (this is the rollback)**

```bash
ssh ark-api 'cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d%H%M%S) && ls -la /etc/caddy/'
```

Rollback at any point is `cp` that file back plus `systemctl reload caddy` —
seconds, no git, no rebuild.

- [ ] **Step 3: Update the repo source of truth for portals**

Every block in `ark-frontend/infra/caddy/Caddyfile.portals` gains two lines.
Full file:

```caddyfile
# Ark portal reverse-proxy blocks — appended to /etc/caddy/Caddyfile.
# Caddy auto-issues and renews TLS certs via ACME for each portal hostname.
#
# Source of truth: ark-frontend/infra/caddy/Caddyfile.portals
# Install: see infra/README.md
#
# encode: Caddy's Caddyfile supports zstd and gzip only — there is no brotli
# encoder. Vike already brotlis /assets/*, and Caddy will not re-encode a
# response that already carries Content-Encoding, so this adds compression
# for SSR HTML without touching assets.
#
# header /assets/*: Vike emits content-hashed filenames there and sets no
# cache headers of its own, so every navigation re-downloaded ~105 KB. The
# `>` defer flag applies the header after the proxy writes its own.

(portal_common) {
    encode zstd gzip
    header /assets/* >Cache-Control "public, max-age=31536000, immutable"
}

portal.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3001
}

forms.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3001
}

training.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3002
}

procurement.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3003
}

inventory.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3004
}

finance.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3005
}

billing.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3006
}

hr.arkinstitutebc.com {
    import portal_common
    reverse_proxy localhost:3007
}
```

A Caddyfile snippet (`(name)` + `import`) keeps the two directives defined
once rather than repeated eight times.

- [ ] **Step 4: Update the API block generator**

In `ark-services/scripts/setup-vps.sh`, the heredoc at line 162 becomes:

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
api.arkinstitutebc.com {
    encode zstd gzip
    reverse_proxy localhost:4000
}
EOF
```

This only affects fresh VPS bootstraps. The running server is edited in
Step 5.

- [ ] **Step 5: Apply to the live server and validate BEFORE reloading**

`caddy validate` is the gate — a malformed Caddyfile must never reach a
reload.

```bash
ssh ark-api 'caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile'
```

Expected: `Valid configuration`. If it fails, fix the file; nothing has
changed yet because reload has not run.

- [ ] **Step 6: Reload Caddy**

```bash
ssh ark-api 'systemctl reload caddy && systemctl is-active caddy'
```

Expected: `active`. Reload is graceful — in-flight requests are not dropped.

- [ ] **Step 7: Measure the "after" and confirm the win**

```bash
bash /tmp/wf.sh https://finance.arkinstitutebc.com /
curl -sI -H 'Accept-Encoding: gzip' https://finance.arkinstitutebc.com/ | grep -i content-encoding
curl -sI -H 'Accept-Encoding: gzip' https://api.arkinstitutebc.com/api/health | grep -i content-encoding
```

Expected after:
- `0 without cache-control` (was 17)
- `content-encoding: gzip` or `zstd` on the portal HTML (was absent)
- `content-encoding` present on the API response (was absent)
- Asset `cc=public, max-age=31536000, immutable`

Confirm brotli on assets was **not** broken:

```bash
curl -sI -H 'Accept-Encoding: br' https://finance.arkinstitutebc.com/assets/static/Layout.BGcWX6y3.css | grep -i content-encoding
```

Expected: still `br`.

- [ ] **Step 8: Verify all 7 portals still serve**

```bash
for h in portal training procurement inventory finance billing hr; do
  printf "%-12s " "$h"
  curl -s -o /dev/null -w '%{http_code}\n' "https://$h.arkinstitutebc.com/"
done
```

Expected: `200` for all seven.

- [ ] **Step 9: Commit (two repos, scoped separately)**

```bash
cd ark-frontend
git add infra/caddy/Caddyfile.portals infra/README.md
git commit -m "perf(infra): compress responses and cache hashed assets immutably"

cd ../ark-services
git add scripts/setup-vps.sh
git commit -m "perf(infra): enable response compression on the api caddy block"
```

**Rollback:** `ssh ark-api 'cp /etc/caddy/Caddyfile.bak.<stamp> /etc/caddy/Caddyfile && systemctl reload caddy'`. Takes seconds. The commits are inert on their own — `infra/**` triggers no rebuild.

---

### Task 2: SSR auth resolver in @ark/api-client

Pure logic with no Vike or Solid dependency, so it is unit-testable in
isolation. Nothing wires it up yet — this task ships a tested module only.

**Files:**
- Create: `ark-frontend/packages/api-client/src/ssr-auth.ts`
- Create: `ark-frontend/packages/api-client/src/ssr-auth.test.ts`
- Modify: `ark-frontend/packages/api-client/src/index.ts`

**Interfaces:**
- Consumes: `CurrentUser` from `./auth`.
- Produces:
  - `type SsrAuthResult = { status: "authenticated"; user: CurrentUser } | { status: "unauthenticated" } | { status: "unknown" }`
  - `resolveUserFromCookie(cookie: string | undefined, apiUrl?: string): Promise<SsrAuthResult>`

The three-state result is deliberate. A 401 means definitely logged out and
must redirect. A network failure means *unknown* — the API being briefly
unreachable must not log every user out. On `unknown` the page renders and
the existing client-side `AuthGate` decides, exactly as it does today.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-client/src/ssr-auth.test.ts`:

```ts
import { afterEach, describe, expect, mock, test } from "bun:test"
import { resolveUserFromCookie } from "./ssr-auth"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  mock.restore()
})

const user = {
  id: "u1",
  email: "a@b.com",
  role: "admin" as const,
  firstName: "A",
  lastName: "B",
}

describe("resolveUserFromCookie()", () => {
  test("returns unauthenticated when no cookie is present", async () => {
    const fetchMock = mock(async () => new Response(null, { status: 200 }))
    globalThis.fetch = fetchMock as typeof fetch

    const result = await resolveUserFromCookie(undefined)

    expect(result).toEqual({ status: "unauthenticated" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("returns the user and forwards the cookie on 200", async () => {
    const fetchMock = mock(async () => Response.json(user, { status: 200 }))
    globalThis.fetch = fetchMock as typeof fetch

    const result = await resolveUserFromCookie("token=abc", "http://localhost:4000")

    expect(result).toEqual({ status: "authenticated", user })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("http://localhost:4000/api/auth/me")
    expect((init.headers as Record<string, string>).cookie).toBe("token=abc")
  })

  test("returns unauthenticated on 401", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 401 })) as typeof fetch

    expect(await resolveUserFromCookie("token=bad")).toEqual({ status: "unauthenticated" })
  })

  test("returns unknown when the API is unreachable, so users are not logged out", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("ECONNREFUSED")
    }) as typeof fetch

    expect(await resolveUserFromCookie("token=abc")).toEqual({ status: "unknown" })
  })

  test("returns unknown on a 5xx from the API", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 503 })) as typeof fetch

    expect(await resolveUserFromCookie("token=abc")).toEqual({ status: "unknown" })
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
cd ark-frontend && bun test packages/api-client/src/ssr-auth.test.ts
```

Expected: FAIL — cannot resolve module `./ssr-auth`.

- [ ] **Step 3: Implement the module**

Create `packages/api-client/src/ssr-auth.ts`:

```ts
import type { CurrentUser } from "./auth"

/**
 * Portals and the API share a VPS, so SSR resolves the session over loopback
 * (~4ms) instead of making the browser pay a ~60ms round trip to /api/auth/me.
 */
const INTERNAL_API_URL = "http://localhost:4000"

export type SsrAuthResult =
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  /** API unreachable — fall back to the client-side gate rather than logging everyone out. */
  | { status: "unknown" }

export async function resolveUserFromCookie(
  cookie: string | undefined,
  apiUrl: string = INTERNAL_API_URL,
): Promise<SsrAuthResult> {
  if (!cookie) return { status: "unauthenticated" }

  let res: Response
  try {
    res = await fetch(`${apiUrl}/api/auth/me`, { headers: { cookie } })
  } catch {
    return { status: "unknown" }
  }

  if (res.status === 401 || res.status === 403) return { status: "unauthenticated" }
  if (!res.ok) return { status: "unknown" }

  try {
    return { status: "authenticated", user: (await res.json()) as CurrentUser }
  } catch {
    return { status: "unknown" }
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
cd ark-frontend && bun test packages/api-client/src/ssr-auth.test.ts
```

Expected: 5 pass.

- [ ] **Step 5: Export from the package barrel**

Add to `packages/api-client/src/index.ts`, keeping the existing alphabetical
export-block ordering (place it after the `./rbac` block, before `./validate`):

```ts
export { resolveUserFromCookie, type SsrAuthResult } from "./ssr-auth"
```

- [ ] **Step 6: Run lint, typecheck and the full unit suite**

```bash
cd ark-frontend && bunx biome check . && bun run test:unit && bun run --filter '*' typecheck
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add packages/api-client/src/ssr-auth.ts packages/api-client/src/ssr-auth.test.ts packages/api-client/src/index.ts
git commit -m "feat(api-client): add ssr auth resolver for server-side session lookup"
```

**Rollback:** `git revert`. The module is exported but unused, so this commit changes no runtime behavior. It does rebuild all 7 portals (a `packages/**` change) — expect that in CI.

---

### Task 3: Make AuthGate accept a server-resolved user

Backward compatible. `AuthGate` keeps working exactly as today when no
`ssrUser` is passed, so the six portals not yet migrated are unaffected.

**Files:**
- Modify: `ark-frontend/packages/ui/src/layout/auth-gate.tsx`
- Modify: `ark-frontend/packages/ui/src/layout/sub-portal-shell.tsx`
- Create: `ark-frontend/packages/ui/src/layout/auth-gate.test.tsx`

**Interfaces:**
- Consumes: `CurrentUser` from `@ark/api-client`.
- Produces: `AuthGateProps.ssrUser?: CurrentUser | null` and `SubPortalShellProps.ssrUser?: CurrentUser | null`.

Semantics of `ssrUser`:
- `CurrentUser` → render immediately, no pending state, no spinner.
- `null` or omitted → today's behavior: wait on `userQuery`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/layout/auth-gate.test.tsx`. This asserts the one
behavior that matters — that a server-resolved user removes the loading
state entirely:

```tsx
import { describe, expect, test } from "bun:test"
import { render } from "solid-js/web"
import { AuthGate } from "./auth-gate"

const user = {
  id: "u1",
  email: "a@b.com",
  role: "admin" as const,
  firstName: "A",
  lastName: "B",
}

const pendingQuery = { isPending: true, isError: false, data: undefined } as never

function renderToString(node: () => unknown) {
  const host = document.createElement("div")
  render(node as never, host)
  return host.innerHTML
}

describe("AuthGate", () => {
  test("renders children immediately when ssrUser is supplied, despite a pending query", () => {
    const html = renderToString(() => (
      <AuthGate userQuery={pendingQuery} ssrUser={user}>
        <p>content</p>
      </AuthGate>
    ))

    expect(html).toContain("content")
  })

  test("shows the loading fallback when no ssrUser and the query is pending", () => {
    const html = renderToString(() => (
      <AuthGate userQuery={pendingQuery}>
        <p>content</p>
      </AuthGate>
    ))

    expect(html).not.toContain("content")
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
cd ark-frontend && bun test packages/ui/src/layout/auth-gate.test.tsx
```

Expected: FAIL — `ssrUser` is not a known prop, first assertion fails.

- [ ] **Step 3: Implement in auth-gate.tsx**

Add `ssrUser` to the props interface:

```tsx
export interface AuthGateProps {
  /** A useQuery result for /api/auth/me. AuthGate handles loading/error states. */
  userQuery: CreateQueryResult<CurrentUser, Error>
  children: JSX.Element
  /** URL of main portal for redirect on 401. Defaults to env var. */
  mainPortalUrl?: string
  allowedRoles?: readonly UserRole[]
  /** Session resolved during SSR. When set, renders without waiting on userQuery. */
  ssrUser?: CurrentUser | null
}
```

Resolve the effective user from either source, and suppress the redirect
effect when SSR already proved the session:

```tsx
  const resolved = () => props.ssrUser ?? props.userQuery.data

  createEffect(() => {
    if (typeof window === "undefined") return
    if (props.ssrUser) return
    if (!props.userQuery.isError) return
    const returnTo = encodeURIComponent(window.location.href)
    window.location.href = `${portal()}/login?return=${returnTo}`
  })

  const hasAccess = () => {
    const u = resolved()
    return !props.allowedRoles || (!!u && props.allowedRoles.includes(u.role))
  }

  return (
    <Show
      when={props.ssrUser || (!props.userQuery.isPending && !props.userQuery.isError)}
      fallback={
        <div class="flex h-screen items-center justify-center">
          <PageLoading />
        </div>
      }
    >
      <Show when={hasAccess()} fallback={<NoPortalAccess mainPortalUrl={portal()} />}>
        {props.children}
      </Show>
    </Show>
  )
```

- [ ] **Step 4: Thread ssrUser through SubPortalShell**

In `packages/ui/src/layout/sub-portal-shell.tsx`, add `ssrUser?: CurrentUser | null`
to its props and forward it:

```tsx
    <AuthGate userQuery={userQuery} allowedRoles={props.allowedRoles} ssrUser={props.ssrUser}>
```

Import the type: `import type { CurrentUser } from "@ark/api-client"`.

- [ ] **Step 5: Run the tests and confirm they pass**

```bash
cd ark-frontend && bun test packages/ui/src/layout/auth-gate.test.tsx
```

Expected: 2 pass. If the Solid render helper does not work under `bun test`
in this repo, check how `packages/ui/src/data/create-crud-hooks.test.ts`
sets up its environment and match that pattern rather than inventing a new one.

- [ ] **Step 6: Full checks**

```bash
cd ark-frontend && bunx biome check . && bun run test:unit && bun run --filter '*' typecheck
```

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/layout/auth-gate.tsx packages/ui/src/layout/sub-portal-shell.tsx packages/ui/src/layout/auth-gate.test.tsx
git commit -m "feat(ui): let auth gate accept a server-resolved session"
```

**Rollback:** `git revert`. No portal passes `ssrUser` yet, so behavior is unchanged in production.

---

### Task 4: Wire SSR auth into the finance portal only

The first task that changes real behavior, on one portal, so the open
`pageContext.json` question gets answered before six more portals inherit it.

**Files:**
- Create: `ark-frontend/apps/finance/pages/+onCreatePageContext.server.ts`
- Create: `ark-frontend/apps/finance/pages/+guard.ts`
- Modify: `ark-frontend/apps/finance/pages/+config.ts`
- Modify: `ark-frontend/apps/finance/pages/+Layout.tsx`

**Interfaces:**
- Consumes: `resolveUserFromCookie`, `SsrAuthResult` (Task 2); `SubPortalShellProps.ssrUser` (Task 3).
- Produces: `pageContext.user: CurrentUser | null` on every finance page, passed to the client.

- [ ] **Step 1: Add the server-side context hook**

Create `apps/finance/pages/+onCreatePageContext.server.ts`:

```ts
import { resolveUserFromCookie } from "@ark/api-client"
import type { CurrentUser } from "@ark/api-client"
import type { PageContextServer } from "vike/types"

export async function onCreatePageContext(pageContext: PageContextServer) {
  const result = await resolveUserFromCookie(pageContext.headers?.cookie)
  pageContext.user = result.status === "authenticated" ? result.user : null
  pageContext.authResolved = result.status !== "unknown"
}

declare global {
  namespace Vike {
    interface PageContext {
      user?: CurrentUser | null
      /** False when the API was unreachable — the client gate decides instead. */
      authResolved?: boolean
    }
  }
}
```

- [ ] **Step 2: Add the route guard**

Create `apps/finance/pages/+guard.ts`. It redirects only when SSR is
*certain* the visitor is logged out — `authResolved === false` falls through
to the client gate:

```ts
import { redirect } from "vike/abort"
import type { PageContextServer } from "vike/types"

export function guard(pageContext: PageContextServer) {
  if (!pageContext.authResolved) return
  if (pageContext.user) return

  const portal = import.meta.env.VITE_MAIN_PORTAL_URL ?? "https://portal.arkinstitutebc.com"
  throw redirect(`${portal}/login`)
}
```

**Verify during this step, do not assume:** Vike's `redirect()` is documented
for internal paths. Confirm it emits a cross-origin `Location` header to the
main portal. Test with:

```bash
curl -sI https://finance.arkinstitutebc.com/ | grep -iE '^(HTTP|location)'
```

Expected: `302` (or `307`) plus `location: https://portal.arkinstitutebc.com/login`.
If Vike refuses a cross-origin redirect, drop `+guard.ts` and let `AuthGate`
handle the redirect client-side as it does today — the SSR speedup in Step 3
does not depend on the guard.

- [ ] **Step 3: Expose the user to the client**

Modify `apps/finance/pages/+config.ts`:

```ts
import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  server: true,
  passToClient: ["user", "authResolved"],
  title: "Finance Portal | Ark Institute",
  description: "Two-bank tracking and P&L management",
} satisfies Config
```

- [ ] **Step 4: Consume it in the layout**

Modify `apps/finance/pages/+Layout.tsx` to read `pageContext` and pass the
user down:

```tsx
import { usePageContext } from "vike-solid/usePageContext"
```

and inside `Layout`:

```tsx
  const pageContext = usePageContext()
```

then on the shell:

```tsx
        <SubPortalShell
          sidebar={<Sidebar />}
          topBar={<PortalTopBar />}
          allowedRoles={["admin", "director"]}
          ssrUser={pageContext.user}
        >
```

- [ ] **Step 5: Build and preview locally**

```bash
cd ark-frontend/apps/finance && bun run build && bun run preview
```

Expected: build succeeds. The preview server needs a reachable API at
`localhost:4000`; start `ark-services` with `bun run dev` first, or expect
`status: "unknown"` and the old client-side behavior — which is itself the
correct fallback and worth confirming.

- [ ] **Step 6: Full checks**

```bash
cd ark-frontend && bunx biome check . && bun run test:unit && bun run --filter '*' typecheck
```

- [ ] **Step 7: Commit and push finance only**

```bash
git add apps/finance/pages/
git commit -m "perf(finance): resolve session during ssr to drop the auth round trip"
git push origin main
```

CI runs biome, unit tests and typecheck, then rebuilds finance only
(`apps/finance/**` is not a `packages/**` change) and health-checks all 7.

- [ ] **Step 8: Verify in production**

```bash
curl -s -o /dev/null -w 'ttfb=%{time_starttransfer} code=%{http_code}\n' https://finance.arkinstitutebc.com/
ssh ark-api 'journalctl -u ark-portal-finance -n 30 --no-pager -o cat'
```

Then log in through a browser and confirm: no auth spinner on load, page data
appears without a second wait, and a hard refresh keeps you logged in.

**Answer the open question here:** with devtools open, navigate between two
finance pages client-side and check whether a `pageContext.json` request
fires. Record the result in the spec. If it does and it is on the critical
path, seed the TanStack cache from `pageContext.user` and drop `user` from
`passToClient`.

**Rollback:** `git revert <sha> && git push origin main` — CI rebuilds finance and restarts it. For an immediate fix without waiting on CI: `ssh ark-api 'cd /opt/ark-portals/repo && sudo -u ark git reset --hard <prev-sha> && PREV_SHA=<new> NEW_SHA=<prev> bash infra/deploy.sh'`.

---

### Task 5: Roll out SSR auth to the remaining six portals

Only after Task 4 is confirmed working in production for at least one
business day.

**Files:**
- Create, for each of `main`, `training`, `procurement`, `inventory`, `billing`, `hr`:
  - `ark-frontend/apps/<name>/pages/+onCreatePageContext.server.ts`
  - `ark-frontend/apps/<name>/pages/+guard.ts`
- Modify, for each: `pages/+config.ts`, `pages/+Layout.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–4.
- Produces: identical SSR auth behavior across all 7.

- [ ] **Step 1: Copy the finance files into each app**

The three files are identical across apps except `+config.ts`, which keeps
each app's own `title` and `description`, and `+Layout.tsx`, which keeps each
app's own `allowedRoles` and `Sidebar`.

**`main` is the exception:** it hosts `/login`, so a guard that redirects
unauthenticated users to `/login` would loop. Its `+guard.ts` must exempt the
login route:

```ts
import { redirect } from "vike/abort"
import type { PageContextServer } from "vike/types"

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"]

export function guard(pageContext: PageContextServer) {
  if (PUBLIC_PATHS.some((p) => pageContext.urlPathname.startsWith(p))) return
  if (!pageContext.authResolved) return
  if (pageContext.user) return
  throw redirect("/login")
}
```

Confirm the real public route list against `apps/main/pages/` before writing
this — do not assume those three paths.

- [ ] **Step 2: Full checks**

```bash
cd ark-frontend && bunx biome check . && bun run test:unit && bun run --filter '*' typecheck
```

- [ ] **Step 3: Commit and push**

```bash
git add apps/
git commit -m "perf(portals): resolve session during ssr across remaining portals"
git push origin main
```

- [ ] **Step 4: Verify all seven**

```bash
for h in portal training procurement inventory finance billing hr; do
  printf "%-12s " "$h"
  curl -s -o /dev/null -w 'code=%{http_code} ttfb=%{time_starttransfer}\n' "https://$h.arkinstitutebc.com/"
done
```

Then log in and click through every portal, including a cross-portal
navigation, confirming no unexpected logout.

**Rollback:** `git revert <sha> && git push origin main`. Finance is untouched by this revert if it was committed separately in Task 4.

---

### Task 6: Load exceljs on demand

Independent of everything above. `chunk-C4zoc1yC.js` is 938 KB raw / 218 KB
brotli (exceljs + jszip) and is already split to the P&L page, so visiting
P&L pays for it even without exporting.

**Files:**
- Modify: `ark-frontend/apps/finance/pages/pnl/+Page.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: no exceljs in the P&L entry chunk.

- [ ] **Step 1: Record the current chunk graph**

```bash
cd ark-frontend/apps/finance && bun run build
grep -l "chunk-C4zoc1yC" dist/client/assets/entries/*.js
ls -la dist/client/assets/chunks/chunk-C4zoc1yC.js
```

Note which entry pulls it in. The hash will differ after a rebuild — find the
exceljs chunk with:

```bash
for f in dist/client/assets/chunks/*.js; do
  if grep -qc "jszip" "$f" 2>/dev/null; then echo "$f $(wc -c < "$f")"; fi
done
```

- [ ] **Step 2: Move the runtime import inside the export handler**

`apps/finance/pages/pnl/+Page.tsx:3` already imports only a type
(`import type { Cell } from "exceljs"`), which is erased at build time and is
fine to keep. Find the value import of `exceljs` in that file and move it
into the export click handler:

```tsx
  const handleExport = async () => {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    // ... existing export logic unchanged
  }
```

- [ ] **Step 3: Rebuild and confirm the chunk left the entry**

```bash
cd ark-frontend/apps/finance && bun run build
grep -l "jszip" dist/client/assets/entries/*.js || echo "OK: exceljs no longer in any entry"
```

Expected: `OK: exceljs no longer in any entry`. The chunk still exists — it is
now fetched on click instead of on page load.

- [ ] **Step 4: Verify the export still works**

Run the portal locally, open P&L, click export, and confirm the downloaded
`.xlsx` opens with the expected rows. This is a user-visible feature; a build
check alone is not sufficient.

- [ ] **Step 5: Full checks and commit**

```bash
cd ark-frontend && bunx biome check . && bun run test:unit && bun run --filter '*' typecheck
git add apps/finance/pages/pnl/+Page.tsx
git commit -m "perf(finance): load exceljs on export instead of page load"
```

**Rollback:** `git revert`. Affects the finance portal only.

---

### Task 7: Stop pino writing full headers on every request

Not a latency fix. Journald holds **3.9 GB** spanning 2026-05-14 to
2026-09-22, large enough that `journalctl` queries time out — which actively
blocks production diagnostics.

**Files:**
- Modify: `ark-services/src/lib/logger.ts`
- Modify: `ark-services/src/app.ts:35`
- Modify: `ark-services/.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: `logger` honouring `LOG_LEVEL`; request logs carrying method, url and status rather than full header objects.

- [ ] **Step 1: Make the level configurable**

`src/lib/logger.ts` currently passes no `level`, so pino defaults to `info`
and does **not** read `LOG_LEVEL` on its own:

```ts
import pino from "pino";

export const logger = pino({
	level: process.env.LOG_LEVEL ?? "info",
	transport:
		process.env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
});
```

- [ ] **Step 2: Trim the request serializers**

In `src/app.ts:35`, replace `app.use(pinoHttp({ logger }))` with:

```ts
	app.use(
		pinoHttp({
			logger,
			serializers: {
				req: (req) => ({ method: req.method, url: req.url }),
				res: (res) => ({ statusCode: res.statusCode }),
			},
		}),
	);
```

- [ ] **Step 3: Document the env var**

Add to `.env.example`:

```
# pino log level — trace|debug|info|warn|error|fatal. Production uses warn.
LOG_LEVEL=info
```

- [ ] **Step 4: Checks**

```bash
cd ark-services && bun run lint && bun run build && bun test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger.ts src/app.ts .env.example
git commit -m "chore(logging): make log level configurable and stop logging full headers"
```

- [ ] **Step 6: Set the production level and reclaim disk**

This is a production change — do it only with explicit approval:

```bash
ssh ark-api 'grep -q "^LOG_LEVEL=" /opt/ark-services/.env || echo "LOG_LEVEL=warn" >> /opt/ark-services/.env'
ssh ark-api 'systemctl restart ark-api && systemctl is-active ark-api'
ssh ark-api 'curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/health'
ssh ark-api 'journalctl --vacuum-size=500M && journalctl --disk-usage'
```

Expected: `active`, `200`, and disk usage down from 3.9 GB.

**Rollback:** remove the `LOG_LEVEL` line from `/opt/ark-services/.env` and restart, plus `git revert` for the code. Vacuumed journal entries are gone permanently — that is the intended outcome, but it is not reversible.

---

### Task 8: Correct the documentation drift

**Files:**
- Modify: `/Users/mattenarle/dev/ark/CLAUDE.md:109-117`
- Modify: `/Users/mattenarle/dev/ark/AGENTS.md`
- Modify: `ark-frontend/infra/README.md` (if Task 1 did not already cover it)

Both root files live in `/Users/mattenarle/dev/ark`, which is **not a git
repository**. Edit them; there is nothing to commit.

- [ ] **Step 1: Fix the port drift in CLAUDE.md**

The workspace-layout block pairs production hostnames with **dev** ports —
finance reads `port 3004` but production runs 3005. `ark-frontend/README.md`
already carries a correct dev|prod table. Annotate the block:

```
├── apps/                # ports below are LOCAL DEV; production is dev+1
│   ├── main/          # portal.arkinstitutebc.com        dev 3000 (prod 3001)
│   ├── training/      # training.arkinstitutebc.com      dev 3001 (prod 3002)
│   ├── procurement/   # procurement.arkinstitutebc.com   dev 3002 (prod 3003)
│   ├── inventory/     # inventory.arkinstitutebc.com     dev 3003 (prod 3004)
│   ├── finance/       # finance.arkinstitutebc.com       dev 3004 (prod 3005)
│   ├── billing/       # billing.arkinstitutebc.com       dev 3005 (prod 3006)
│   └── hr/            # hr.arkinstitutebc.com            dev 3006 (prod 3007)
```

Add below the block: `See ark-frontend/README.md "Production Ports" for the authoritative table.`

- [ ] **Step 2: Fix the SSH alias in AGENTS.md**

It reads: *"The documented SSH alias is `ark-vps`; older environments may
still use `ark-api`."* That is backwards — `ark-vps` is absent from
`~/.ssh/config` and fails to resolve; only `ark-api` works. Replace with:

```
- Production runs on the Ark VPS. The SSH alias is `ark-api` (defined in
  `~/.ssh/config`, pointing at the Contabo host in Singapore). There is no
  `ark-vps` alias.
```

- [ ] **Step 3: Verify the claim still holds before saving**

```bash
ssh -o ConnectTimeout=6 -o BatchMode=yes ark-api 'hostname'
ssh -o ConnectTimeout=6 -o BatchMode=yes ark-vps 'hostname' 2>&1 | head -1
```

Expected: `vmi3278110` for the first; `Could not resolve hostname` for the second.

**Rollback:** re-edit. Untracked files, no git involved.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| 1. Caching and compression | Task 1 |
| 2. Removing the auth waterfall | Tasks 2, 3, 4, 5 |
| 3. Lazy exceljs | Task 6 |
| 4. Logging | Task 7 |
| 5. Documentation drift | Task 8 |
| Rollout order (Caddy → measure → finance → six) | Task order 1 → 4 → 5 |
| Open item: `pageContext.json` on SPA nav | Task 4, Step 8 |

**Type consistency:** `resolveUserFromCookie` / `SsrAuthResult` (Task 2) are
used under those exact names in Tasks 4 and 5. `ssrUser` is the prop name in
Tasks 3, 4 and 5. `pageContext.user` and `pageContext.authResolved` are
declared in Task 4 Step 1 and read in Task 4 Steps 2 and 4 and in Task 5.

**Known-unverified items**, flagged in place rather than assumed:
- Cross-origin `redirect()` from a Vike guard (Task 4, Step 2) — has a
  documented fallback.
- Whether `passToClient: ["user"]` adds a `pageContext.json` request on SPA
  navigation (Task 4, Step 8) — has a documented fallback.
- Whether `bun test` can render Solid components in this repo (Task 3,
  Step 5) — instruction is to match the existing test's setup.
