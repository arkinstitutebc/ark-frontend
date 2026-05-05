# @ark/api-client

Shared HTTP + auth client for talking to `api.arkinstitutebc.com`.

## Exports

| Export | What |
|---|---|
| `api<T>(path, opts?)` | Typed `fetch` wrapper. Auto-includes credentials. Throws on non-2xx. |
| `API_URL` | Resolved base URL (from `VITE_API_URL`, falls back to `http://localhost:4000`) |
| `useCurrentUser()` | TanStack Query hook for `/api/auth/me`. Returns `CurrentUser` or 401 error. |
| `useLogin()` | Mutation hook → POST `/api/auth/login` → invalidates auth queries |
| `useChangePassword()` | Mutation hook → POST `/api/auth/change-password` |
| `performLogout(mainPortalUrl?)` | Async function: POST logout + redirect to login page |
| `queryClient` | Shared TanStack QueryClient with project defaults |
| `QueryProvider` | Wraps app with `<QueryClientProvider>` |
| `CurrentUser` (type) | `{ id, email, role, firstName, lastName }` |

## Usage

In any portal's `+Layout.tsx`:

```tsx
import { QueryProvider, useCurrentUser } from "@ark/api-client"
import { AuthGate } from "@ark/ui"

function GatedShell(props) {
  const userQuery = useCurrentUser()
  return (
    <AuthGate userQuery={userQuery}>
      {props.children}
    </AuthGate>
  )
}

export function Layout(props) {
  return (
    <QueryProvider>
      <GatedShell>{props.children}</GatedShell>
    </QueryProvider>
  )
}
```

In a TopBar or settings page:

```tsx
import { performLogout, useChangePassword } from "@ark/api-client"

<button onClick={() => performLogout()}>Logout</button>
```

Per-app data hooks (e.g., `useBatches`, `useTransfers`) live in `apps/<name>/data/hooks/` — they call `api()` from this package but are scoped to their domain.

## Env var

Each app must set `VITE_API_URL` in its Vercel project (and `.env.local` for dev).

```
VITE_API_URL=https://api.arkinstitutebc.com    # production
VITE_API_URL=http://localhost:4000             # local
```

## Cookie-based SSO

The backend sets the JWT cookie with `Domain=.arkinstitutebc.com` (note leading dot). That means logging in on any one portal authenticates you on all 7 — the cookie travels across subdomains automatically.
