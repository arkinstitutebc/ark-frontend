# apps/procurement

→ https://procurement.arkinstitutebc.com

## Pages

`/` PR list (with category badges), `/pr/:id`, `/pr/create` (4-axis classification + AttachmentUploader), `/pr/:id/edit` (pending-only), `/cash-voucher`, `/cash-voucher/new`, `/cash-voucher/:id`, `/orders`, `/orders/:id`, `/orders/create`, `/approvals` (Coordinator queue + Management queue, separation-of-duties guard), `/tutorials`

## Dev

From monorepo root: `bun install && bun run dev:procurement`. Backend must also be running ([`ark-services`](https://github.com/arkinstitutebc/ark-services)).

## What's app-specific vs shared

- **Local**: `pages/`, `components/modals/`, `components/layout/sidebar.tsx` (just `navItems`), `data/hooks/` (per-domain)
- **Shared (`@ark/ui`)**: Sidebar shell, TopBar, AuthGate, Modal, Input, Button, Card, Icons, QueryBoundary
- **Shared (`@ark/api-client`)**: `api()`, auth hooks, query client
- **Shared (`@ark/data-types`)**: types
- **Shared (`@ark/design-system`)**: globals.css

To fix something shared → edit `packages/<name>/` once, all apps inherit.

## Deploy

`git push` to monorepo main. CI deploys only changed apps.
