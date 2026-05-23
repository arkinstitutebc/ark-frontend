# apps/main

→ https://portal.arkinstitutebc.com

## Pages

`/` SSO hub + portal cards, `/login`, `/profile` (avatar + position/department), `/admin/users` (admin only — invite, edit, deactivate, reset password), `/admin/users/:id`, `/learn` Learning Hub, `/learn/{training,procurement,inventory,finance,billing,hr}` per-portal manuals

## Dev

From monorepo root: `bun install && bun run dev:main`. Backend must also be running ([`ark-services`](https://github.com/arkinstitutebc/ark-services)).

## What's app-specific vs shared

- **Local**: `pages/`, `components/modals/`, `components/layout/sidebar.tsx` (just `navItems`), `data/hooks/` (per-domain)
- **Shared (`@ark/ui`)**: Sidebar shell, TopBar, AuthGate, Modal, Input, Button, Card, Icons, QueryBoundary
- **Shared (`@ark/api-client`)**: `api()`, auth hooks, query client
- **Shared (`@ark/data-types`)**: types
- **Shared (`@ark/design-system`)**: globals.css

To fix something shared → edit `packages/<name>/` once, all apps inherit.

## Deploy

`git push` to monorepo main. CI deploys only changed apps.
