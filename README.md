# ark-frontend

Bun workspace monorepo. All 7 ERP portals.

## Layout

```
apps/                          one Vercel project per app
├── main/                      → portal.arkinstitutebc.com    (login + hub)
├── training/                  → training.arkinstitutebc.com
├── procurement/               → procurement.arkinstitutebc.com
├── inventory/                 → inventory.arkinstitutebc.com
├── finance/                   → finance.arkinstitutebc.com
├── billing/                   → billing.arkinstitutebc.com
└── hr/                        → hr.arkinstitutebc.com

packages/                      shared, edit once
├── ui/                        Sidebar, TopBar, Modal, Input, Button, Card, Icons, AuthGate, QueryBoundary
├── api-client/                api(), useCurrentUser, useLogin, performLogout, queryClient
├── data-types/                Bank, Batch, Student, Transfer, PR, PO, etc.
└── design-system/             globals.css, Tailwind theme
```

Backend: [`ark-services`](https://github.com/arkinstitutebc/ark-services).

## Dev

```bash
bun install                    # one-time, links workspaces
bun run dev:training           # :3001 (also dev:main / dev:procurement / etc.)
bun run lint                   # biome
bun run typecheck              # tsc per workspace
```

You also need the backend running locally — see `ark-services/README.md`.

## Deploy

`git push` main → CI matrix detects changed apps + deploys only those via Vercel CLI.

Touch `packages/**` → all 7 apps redeploy.

## Add a new portal

1. `cp -r apps/training apps/<name>` and rename in `package.json`
2. Edit `apps/<name>/components/layout/sidebar.tsx` (set `brandIcon`, `brandTitle`, `navItems`)
3. Create the Vercel project, commit `apps/<name>/.vercel/project.json`
4. Add the app to the path-filter in `.github/workflows/deploy.yml`
5. Add DNS + `VITE_API_URL` env var

## Notes

- **SSO**: cookie set with `Domain=.arkinstitutebc.com` → log in once, all 7 portals work
- **Auth**: each app's `+Layout.tsx` wraps with `<AuthGate>` → 401 redirects to `portal.arkinstitutebc.com/login`
- Test logins + everything else: see workspace `STATUS.md`
