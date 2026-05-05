# Ark Frontend

Bun workspace monorepo. All 7 ERP portals + shared packages in one place.

## What's here

```
ark-frontend/
├── apps/                              one Vercel project per app
│   ├── main/                          → portal.arkinstitutebc.com    (login + card hub)
│   ├── training/                      → training.arkinstitutebc.com  (batches, students)
│   ├── procurement/                   → procurement.arkinstitutebc.com
│   ├── inventory/                     → inventory.arkinstitutebc.com
│   ├── finance/                       → finance.arkinstitutebc.com
│   ├── billing/                       → billing.arkinstitutebc.com
│   └── hr/                            → hr.arkinstitutebc.com
└── packages/                          shared, edited 1× → all apps inherit
    ├── ui/                            Sidebar, TopBar, Modal, Input, Button, Card, Icons, AuthGate, QueryBoundary
    ├── api-client/                    api(), useCurrentUser, useLogin, useChangePassword, performLogout
    ├── data-types/                    Bank, Batch, Student, Transfer, PR, PO, etc.
    └── design-system/                 globals.css, Tailwind theme, fonts
```

Backend lives separately at [`arkinstitutebc/ark-services`](https://github.com/arkinstitutebc/ark-services). Landing site at [`arkinstitutebc/ark-landing-site`](https://github.com/arkinstitutebc/ark-landing-site).

## Develop

One-time:
```bash
bun install                            # links all workspace packages
```

Run a portal locally (each on its own port):
```bash
bun run dev:main                       # :3000
bun run dev:training                   # :3001
bun run dev:procurement                # :3002
bun run dev:inventory                  # :3003
bun run dev:finance                    # :3004
bun run dev:billing                    # :3005
bun run dev:hr                         # :3006
```

You also need the backend running locally — see [`ark-services/README.md`](https://github.com/arkinstitutebc/ark-services).

## Quality

```bash
bun run lint                           # biome check across whole repo
bun run typecheck                      # tsc --noEmit per app + package
bun run format                         # biome --write
```

## Deploy

`git push` to main. CI:

1. **detect** — figures out which apps changed (path filter on `apps/<name>/**` and `packages/**`)
2. **quality** — biome + typecheck across whole repo
3. **deploy / \<app\>** — for each changed app, vercel pull + build + deploy via matrix

Apps with no source change → not redeployed (saves CI minutes). Touch `packages/**` → all apps redeploy (since they all depend on shared packages).

Each app has `.vercel/project.json` committed so CI knows which Vercel project to deploy to.

## Add a new portal

1. `cp -r apps/training apps/<name>`
2. Update `apps/<name>/package.json` (rename, keep workspace deps)
3. Edit `apps/<name>/components/layout/sidebar.tsx` — set `brandIcon`, `brandTitle`, `navItems`
4. Add a Vercel project + commit its `.vercel/project.json`
5. Add the app to the `paths-filter` matrix in `.github/workflows/deploy.yml`
6. Wire DNS + `VITE_API_URL` env var in Vercel

## Architecture notes

- **Cookie-based SSO**: auth cookie set with `Domain=.arkinstitutebc.com` so it travels across all subdomains
- **Sub-portals require auth**: `<AuthGate>` in each `+Layout.tsx` redirects to `portal.arkinstitutebc.com/login` on 401
- **Shared deps**: `@ark/*` packages are workspace symlinks; edit once, all apps see the change next bundle

## Test accounts (local + prod, all password `changeme`)

| Email | Role |
|---|---|
| `matt@arkinstitutebc.com` | admin |
| `heart@arkinstitutebc.com` | admin |
| `camille@arkinstitutebc.com` | admin |
| `shine@arkinstitutebc.com` | director |
| `patrick@arkinstitutebc.com` | trainer |
| `edward@arkinstitutebc.com` | trainer |

## More

- Production status: see top-level `STATUS.md` in workspace
- Architecture decisions: `.claude/plans/00-architecture-overview.md`
- DB schema: `.claude/plans/01-database-schema.md`
- Financial integrity: `.claude/plans/04-financial-data-integrity.md`
