# apps/training

→ https://training.arkinstitutebc.com

## Pages

`/` batches list and creation, `/board` separate batch status board (drag whole cards between columns; collapse columns), `/batch/:id` batch detail (gross/98% summary, NTP, roster, attendance, assessments, guarded delete), `/students` (auto STU-YYYY-NNNNN codes), `/settings` training schemes, `/tutorials`.

Batch detail no longer embeds Billing or Budget Control panels; receivable actions belong in Billing. `LEGACY` identifies older batches with no recorded scheme and is not offered when creating a batch. Delete is rejected when a batch has dependent operational or paid billing history.

## Dev

From monorepo root: `bun install && bun run dev:training`. Backend must also be running ([`ark-services`](https://github.com/arkinstitutebc/ark-services)).

## What's app-specific vs shared

- **Local**: `pages/`, `components/modals/`, `components/layout/sidebar.tsx` (just `navItems`), `data/hooks/` (per-domain)
- **Shared (`@ark/ui`)**: Sidebar shell, TopBar, AuthGate, Modal, Input, Button, Card, Icons, QueryBoundary
- **Shared (`@ark/api-client`)**: `api()`, auth hooks, query client
- **Shared (`@ark/data-types`)**: types
- **Shared (`@ark/design-system`)**: globals.css

To fix something shared → edit `packages/<name>/` once, all apps inherit.

## Deploy

`git push` to monorepo main triggers CI. App-only changes rebuild that portal; shared `packages/**` changes rebuild all 7 portals.
