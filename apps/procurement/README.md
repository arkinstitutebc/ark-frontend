# apps/procurement

→ https://procurement.arkinstitutebc.com

## Pages

`/` PR list, `/pr/:id`, `/pr/create` (Operations/Assets taxonomy), `/pr/:id/edit` (pending-only), `/approvals` (single approval that generates a pending PO), `/orders`, `/orders/:id` (confirm and acknowledge), `/liquidation` (all PO statuses, receipt upload for acknowledged POs, Finance review, completed history), `/expense-settings`, `/cash-voucher`, `/cash-voucher/new`, `/cash-voucher/:id`, `/tutorials`. Cash-voucher liquidation remains in its own flow.

Pending PR edits use the same expense type, subtype, item, and batch choices as
creation. Historical requests without a catalog item can still receive detail-only
edits; choosing a new classification validates it against the active catalog.

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

`git push` to monorepo main triggers CI. App-only changes rebuild that portal; shared `packages/**` changes rebuild all 7 portals.
