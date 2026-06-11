# ark-frontend

Bun workspace monorepo for the Ark ERP frontend: 7 Vike SSR portals plus shared UI,
API, type, and design-system packages. **Current**: v1.2.1
([CHANGELOG](./CHANGELOG.md))

## Layout

```
apps/                          one Vike SSR app per ERP portal
├── main/                      → portal.arkinstitutebc.com       login, SSO hub, /learn manuals
├── training/                  → training.arkinstitutebc.com     batches, students, attendance
├── procurement/               → procurement.arkinstitutebc.com  PR approval, PO workflow, petty cash
├── inventory/                 → inventory.arkinstitutebc.com    receiving, stock take, movements
├── finance/                   → finance.arkinstitutebc.com      disbursements, GL, RR, assets
├── billing/                   → billing.arkinstitutebc.com      TESDA billing, receivables
└── hr/                        → hr.arkinstitutebc.com           trainers, attendance, payroll

packages/                      shared, edit once
├── ui/                        Sidebar, TopBar, PageHeader, StatCard / InfoCard, DataTable, StatusBadge,
│                              Modal / ModalFooter / ConfirmDialog, Input, Select, Button, BackLink,
│                              AttachmentUploader, TutorialShell, AuthGate, QueryBoundary, createCrudHooks,
│                              theme + categoryTone helpers, Icons (lucide-solid)
├── api-client/                api(), useCurrentUser, useLogin, performLogout, queryClient, validateForm
├── data-types/                Bank, Batch, Student, Transfer, PR, PO, RR, GlAccount, etc.
└── design-system/             globals.css, Tailwind theme, semantic tokens
```

Backend: [`ark-services`](https://github.com/arkinstitutebc/ark-services).

## Dev

```bash
bun install                    # one-time, links workspaces
bun run dev:main               # local main portal on :3000
bun run dev:training           # :3001 (procurement :3002, inventory :3003, finance :3004, billing :3005, hr :3006)
bun run lint                   # biome
bun run test:unit              # Bun unit tests for shared API/form helpers
bun run typecheck              # tsc per workspace
bun run build                  # Vike production build for every app/package with a build script
bun run test:e2e               # Playwright portal smoke + focused E2E (LOCAL ONLY, NOT in CI)
bun run test:e2e:update        # update snapshots after intentional UI changes
```

You also need the backend running locally — see `ark-services/README.md`.

Copy an app's `.env.example` when you need local portal-link overrides. Production
uses each app's tracked `.env.production` for public URLs and systemd `PORT`.

## Theming (dark mode)

- Token system in `packages/design-system/src/globals.css` — `:root[data-theme="dark"]` overrides `--color-background`, `--color-foreground`, `--color-surface`, `--color-surface-muted`, `--color-border`, `--color-muted`. Brand colors (`--color-primary`, `--color-accent`) are identical in both themes.
- `<ThemeProvider>` from `@ark/ui` wraps every app's `+Layout.tsx`; tracks `light | dark | auto` (default `auto` follows OS) in `localStorage["ark-theme"]`.
- A no-FOUC inline script in each `+Head.tsx` sets `data-theme` BEFORE first paint.
- `<ThemeToggle />` lives in the shared `TopBar` (sub-portals) and the main app's `Navbar`.
- Use semantic utilities: `bg-surface`, `bg-surface-muted`, `text-foreground`, `text-muted`, `border-border`. Avoid `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*` in new code.

## Pipeline

- Pull requests run install, Biome, unit tests, and workspace typecheck through
  `.github/workflows/deploy.yml`.
- Pull requests that touch `apps/**` or `packages/**` also run
  `.github/workflows/bundle-size.yml`, building every portal and commenting bundle
  sizes for visibility.
- Pushes to `main` pass the same quality gate, then SSH to `ark-api`, pull
  `/opt/ark-portals/repo`, and run `infra/deploy.sh`.
- `infra/deploy.sh` path-filters changed files: `apps/<name>/**` rebuilds one
  portal, while `packages/**` rebuilds all 7 because shared code changed.
- Production is Vike SSR behind Caddy and systemd. Vercel project metadata is not
  part of the active deploy path.

## Production Ports

| Portal | Local dev | Production systemd |
|---|---:|---:|
| main | 3000 | 3001 |
| training | 3001 | 3002 |
| procurement | 3002 | 3003 |
| inventory | 3003 | 3004 |
| finance | 3004 | 3005 |
| billing | 3005 | 3006 |
| hr | 3006 | 3007 |

## Add a new portal

1. `cp -r apps/training apps/<name>` and rename in `package.json`
2. Edit `apps/<name>/components/layout/sidebar.tsx` (set `brandIcon`, `brandTitle`, `navItems`)
3. Provision a new systemd unit `ark-portal-<name>` on the VPS + add Caddy reverse-proxy block
4. Add the app to the path-filter in `.github/workflows/deploy.yml`
5. Add DNS + `.env.production` values for `PORT`, `VITE_API_URL`, and portal URLs

## Notes

- **SSO**: cookie set with `Domain=.arkinstitutebc.com` → log in once, all 7 portals work
- **Auth**: each app's `+Layout.tsx` wraps with `<AuthGate>` → 401 redirects to `portal.arkinstitutebc.com/login`
- Test logins: production seeded users are listed in `ark-services/src/db/seed-prod.ts`; ask Matt for current passwords.
