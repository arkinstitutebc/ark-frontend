# Finance Portal

Two-bank tracking (Revenue Vault + Operational Hub) and per-batch P&L.

**Production**: https://finance.arkinstitutebc.com
**Part of**: [`ark-frontend`](../../README.md) monorepo

## Pages

| Route | Purpose |
|---|---|
| `/` | Overview (balances, AR, recent txns) |
| `/banks` | Bank detail + filtered transactions |
| `/transfers` | Transfer list |
| `/transfers/create` | Internal transfer (double-entry) |
| `/disbursements` | Operational expenses |
| `/disbursements/create` | Record an expense |
| `/pnl` | Per-batch profit and loss report |

## Develop

From the monorepo root:
```bash
bun install                # one-time
bun run dev:finance           # this app on its dedicated port
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
