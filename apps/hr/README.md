# HR & Payroll Portal

Trainer profiles, attendance, semi-monthly payroll.

**Production**: https://hr.arkinstitutebc.com
**Part of**: [`ark-frontend`](../../README.md) monorepo

## Pages

| Route | Purpose |
|---|---|
| `/` | Trainer roster |
| `/attendance` | Attendance sheet (biometric or manual) |
| `/payroll` | Payroll periods |
| `/payroll/[period]` | Period detail with entries + export |

## Develop

From the monorepo root:
```bash
bun install                # one-time
bun run dev:hr           # this app on its dedicated port
```

You also need the backend running — see [`ark-services`](https://github.com/arkinstitutebc/ark-services).

## What's app-specific vs shared

- **App-specific**: `pages/` (vike routes), `components/modals/`, `components/layout/sidebar.tsx` (just the navItems), `data/hooks/` (per-domain TanStack Query hooks)
- **Shared from `@ark/ui`**: Sidebar shell, TopBar, Modal, Input, Button, Card, Icons, AuthGate, QueryBoundary
- **Shared from `@ark/api-client`**: `api()`, `useCurrentUser()`, `useLogin()`, `performLogout()`, query client
- **Shared from `@ark/data-types`**: type definitions
- **Shared from `@ark/design-system`**: `globals.css`, Tailwind theme

To fix something shared (Sidebar styling, Input behavior, etc.) → edit `packages/<name>/` once → all apps inherit.

## Deploy

`git push` to monorepo main. CI matrix detects which apps changed and only deploys those.
