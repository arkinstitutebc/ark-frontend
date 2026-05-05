# @ark/api-client

HTTP + auth for the backend (`api.arkinstitutebc.com`).

## Exports

```ts
import {
  api, API_URL,
  useCurrentUser, useLogin, useChangePassword, performLogout,
  useAdminUsers, useAdminUser, useInviteUser, useUpdateUser,
  useDeactivateUser, useActivateUser, useResetUserPassword,
  type AdminUser, type AdminRole, type InviteUserInput,
  type UpdateUserInput, type UserWithTempPassword,
  validateForm,
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
| `useAdminUsers(includeInactive?)` | list users (admin role only) |
| `useAdminUser(id)` | single user by id |
| `useInviteUser()` | mutation → returns `{ user, tempPassword }` (one-time) |
| `useUpdateUser()` | mutation — patch firstName/lastName/role |
| `useDeactivateUser()` / `useActivateUser()` | mutations on `/users/:id/(de)activate` |
| `useResetUserPassword()` | mutation → returns new `{ user, tempPassword }` |
| `validateForm(schema, data)` | Zod helper → `{ success: true, data }` or `{ success: false, errors: { field: msg } }` |
| `queryClient` | shared QueryClient (30s stale, retry: 1) |
| `QueryProvider` | wraps app with `<QueryClientProvider>` |

## Env vars (per app)

```
VITE_API_URL=https://api.arkinstitutebc.com    # production
VITE_API_URL=http://localhost:4000             # local
```

## Cookie SSO

Backend sets cookie with `Domain=.arkinstitutebc.com` → log in once, all 7 portals know you.
