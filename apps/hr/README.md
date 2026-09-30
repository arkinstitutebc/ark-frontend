# apps/hr

→ https://hr.arkinstitutebc.com

## Pages

`/` trainers and per-batch fee detail, `/trainer-fees`, `/employees`, `/attendance`, `/calendar` (holidays and leave), `/cash-advances`, `/payroll`, `/payroll/:period` (pay period detail), `/tutorials`.

Trainer and employee delete actions are guarded: trainer assignments/attendance/payroll and employee attendance/leave/payroll/cash advances must be retained.

## Dev

From monorepo root: `bun install && bun run dev:hr`. Backend must also be running ([`ark-services`](https://github.com/arkinstitutebc/ark-services)).

## What's app-specific vs shared

- **Local**: `pages/`, `components/modals/`, `components/layout/sidebar.tsx` (just `navItems`), `data/hooks/` (per-domain)
- **Shared (`@ark/ui`)**: Sidebar shell, TopBar, AuthGate, Modal, Input, Button, Card, Icons, QueryBoundary
- **Shared (`@ark/api-client`)**: `api()`, auth hooks, query client
- **Shared (`@ark/data-types`)**: types
- **Shared (`@ark/design-system`)**: globals.css

To fix something shared → edit `packages/<name>/` once, all apps inherit.

## Deploy

`git push` to monorepo main triggers CI. App-only changes rebuild that portal; shared `packages/**` changes rebuild all 7 portals.
