# @ark/api-client

HTTP + auth for the backend (`api.arkinstitutebc.com`).

## Exports

```ts
import {
  api, API_URL,
  useCurrentUser, performLogin, loginRedirectTarget, useChangePassword, useUpdateMe,
  useUploadAvatar, performLogout, resolveUserFromCookie, isPublicPath,
  useAdminUsers, useAdminUser, useInviteUser, useUpdateUser,
  useDeactivateUser, useActivateUser, useResetUserPassword,
  useNotifications, useMarkRead, useMarkAllRead,
  type AdminUser, type AdminRole, type InviteUserInput,
  type UpdateUserInput, type UserWithTempPassword,
  type Notification,
  validateForm,
  getQueryClient, QueryProvider,
  type CurrentUser, type UpdateMeInput, type LoginCredentials, type SsrAuthResult,
} from "@ark/api-client"
```

| Export | What |
|---|---|
| `api<T>(path, opts?)` | typed `fetch`. Auto-includes credentials. Throws on non-2xx. |
| `API_URL` | base URL from `VITE_API_URL` (fallback `http://localhost:4000`) |
| `useCurrentUser()` | TanStack Query hook → `/api/auth/me` |
| `performLogin(credentials)` | POST `/api/auth/login`; session arrives as an httpOnly cookie |
| `loginRedirectTarget(user, search, origins)` | where to send someone after login. `?return=` is attacker-controllable, so it is honoured only for a relative path or a known portal origin |
| `useChangePassword()` | mutation → `/api/auth/change-password` |
| `useUpdateMe()` | mutation → current-user profile fields |
| `useUploadAvatar()` | mutation → avatar upload |
| `performLogout(url?)` | POST logout + redirect to login |
| `useAdminUsers(includeInactive?)` | list users (admin role only) |
| `useAdminUser(id)` | single user by id |
| `useInviteUser()` | mutation → returns `{ user, tempPassword }` (one-time) |
| `useUpdateUser()` | mutation — patch firstName/lastName/role |
| `useDeactivateUser()` / `useActivateUser()` | mutations on `/users/:id/(de)activate` |
| `useResetUserPassword()` | mutation → returns new `{ user, tempPassword }` |
| `useNotifications()` | list current user's notifications |
| `useMarkRead()` / `useMarkAllRead()` | notification read-state mutations |
| `validateForm(schema, data)` | Zod helper → `{ success: true, data }` or `{ success: false, errors: { field: msg } }` |
| `getQueryClient()` | fresh QueryClient **per request on the server**, singleton in the browser (30s stale, retry: 1). A module-level client would share one cache across every SSR request and leak between users. |
| `QueryProvider` | wraps app with `<QueryClientProvider>`. Pass `session={pageContext.user}` to seed the SSR-resolved session so `useCurrentUser()` resolves from cache instead of refetching on hydration. |
| `resolveUserFromCookie(cookie, apiUrl?)` | server-side session lookup for Vike's `+onCreatePageContext.server.ts`. Returns `authenticated` / `unauthenticated` / `unknown` — `unknown` (API unreachable) must not log anyone out. |
| `isPublicPath(pathname, prefixes)` | prefix match at a path-segment boundary, for `+guard.ts` allowlists |

## Env vars (per app)

```
VITE_API_URL=https://api.arkinstitutebc.com    # production
VITE_API_URL=http://localhost:4000             # local
```

## Cookie SSO

Backend sets cookie with `Domain=.arkinstitutebc.com` → log in once, all 7 portals know you.
