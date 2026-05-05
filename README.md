# Ark Institute — Frontend Monorepo

Bun workspace monorepo for all 7 ERP portals.

## Structure

```
ark-frontend/
├── apps/
│   ├── main/              → portal.arkinstitutebc.com    (login + card hub)
│   ├── training/          → training.arkinstitutebc.com  (batches, students)
│   ├── procurement/       → procurement.arkinstitutebc.com  (PR, PO, approvals)
│   ├── inventory/         → inventory.arkinstitutebc.com (stock, receiving)
│   ├── finance/           → finance.arkinstitutebc.com   (two-bank, P&L)
│   ├── billing/           → billing.arkinstitutebc.com   (TESDA receivables)
│   └── hr/                → hr.arkinstitutebc.com        (trainers, payroll)
├── packages/
│   ├── ui/                shared components (Sidebar, TopBar, Modal, Input, …)
│   ├── api-client/        api() + auth hooks (useCurrentUser, useLogin, useLogout)
│   ├── data-types/        shared types (Bank, Batch, Student, Transfer, …)
│   └── design-system/     globals.css, Tailwind theme, fonts
├── package.json           root with bun workspaces
├── biome.json             single source of truth
└── tsconfig.base.json     shared TS config
```

## Develop

```bash
bun install                  # one-time, installs everything via workspaces
bun run dev:training         # start training portal on :3001
bun run dev:main             # start main portal on :3000
# (other apps: dev:procurement, dev:inventory, dev:finance, dev:billing, dev:hr)
```

Backend lives in a separate repo: [arkinstitutebc/ark-services](https://github.com/arkinstitutebc/ark-services).
Local backend setup: see `ark-services/README.md`.

## Quality

```bash
bun run lint                 # biome check across whole repo
bun run typecheck            # tsc --noEmit per app
bun run format               # biome format --write
```

## Deploy

Push to `main` → GH Actions matrix builds only changed apps → deploys each to its Vercel project.
