# @ark/api-client

HTTP + auth for the backend (`api.arkinstitutebc.com`).

## Exports

```ts
import {
  api, API_URL,
  useCurrentUser, useLogin, useChangePassword, performLogout,
  queryClient, QueryProvider,
  type CurrentUser,
} from "@ark/api-client"
```

| Export | What |
|---|---|
| `api<T>(path, opts?)` | typed `fetch`. Auto-includes credentials. Throws on non-2xx. |
| `API_URL` | base URL from `VITE_API_URL` (fallback `http://localhost:4000`) |
| `useCurrentUser()` | TanStack Query hook → `/api/auth/me` |
| `useLogin()` | mutation → `/api/auth/login` |
| `useChangePassword()` | mutation → `/api/auth/change-password` |
| `performLogout(url?)` | POST logout + redirect to login |
| `queryClient` | shared QueryClient (30s stale, retry: 1) |
| `QueryProvider` | wraps app with `<QueryClientProvider>` |

## Env vars (per app)

```
VITE_API_URL=https://api.arkinstitutebc.com    # production
VITE_API_URL=http://localhost:4000             # local
```

## Cookie SSO

Backend sets cookie with `Domain=.arkinstitutebc.com` → log in once, all 7 portals know you.
