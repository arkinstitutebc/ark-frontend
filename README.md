# ark-frontend

Bun workspace monorepo. All 7 ERP portals · **Current**: v1.1.0 ([CHANGELOG](./CHANGELOG.md))

## Layout

```
apps/                          one Vike SSR app per portal (deployed via systemd + Caddy on the VPS)
├── main/                      → portal.arkinstitutebc.com    (login + SSO hub + /learn manuals)
├── training/                  → training.arkinstitutebc.com
├── procurement/               → procurement.arkinstitutebc.com  (3-sig PR workflow, PO modal)
├── inventory/                 → inventory.arkinstitutebc.com   (stock take, category badges)
├── finance/                   → finance.arkinstitutebc.com     (P&L, Income Statement, GL Accounts, RR module)
├── billing/                   → billing.arkinstitutebc.com
└── hr/                        → hr.arkinstitutebc.com

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
bun run dev:training           # :3001 (also dev:main / dev:procurement / etc.)
bun run lint                   # biome
bun run typecheck              # tsc per workspace
bun run test:e2e               # Playwright dark-mode visual regression (LOCAL ONLY, NOT in CI)
bun run test:e2e:update        # update snapshots after intentional UI changes
```

You also need the backend running locally — see `ark-services/README.md`.

## Theming (dark mode)

- Token system in `packages/design-system/src/globals.css` — `:root[data-theme="dark"]` overrides `--color-background`, `--color-foreground`, `--color-surface`, `--color-surface-muted`, `--color-border`, `--color-muted`. Brand colors (`--color-primary`, `--color-accent`) are identical in both themes.
- `<ThemeProvider>` from `@ark/ui` wraps every app's `+Layout.tsx`; tracks `light | dark | auto` (default `auto` follows OS) in `localStorage["ark-theme"]`.
- A no-FOUC inline script in each `+Head.tsx` sets `data-theme` BEFORE first paint.
- `<ThemeToggle />` lives in the shared `TopBar` (sub-portals) and the main app's `Navbar`.
- Use semantic utilities: `bg-surface`, `bg-surface-muted`, `text-foreground`, `text-muted`, `border-border`. Avoid `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*` in new code.

## Deploy

`git push` main → CI smart matrix detects which apps changed, then SSHes to the VPS and rebuilds + restarts only those `ark-portal-*` systemd units. Touch `packages/**` → all 7 apps redeploy. (Legacy `.vercel/project.json` files in each app are unused; production runs Vike SSR on the VPS behind Caddy.)

## Add a new portal

1. `cp -r apps/training apps/<name>` and rename in `package.json`
2. Edit `apps/<name>/components/layout/sidebar.tsx` (set `brandIcon`, `brandTitle`, `navItems`)
3. Provision a new systemd unit `ark-portal-<name>` on the VPS + add Caddy reverse-proxy block
4. Add the app to the path-filter in `.github/workflows/deploy.yml`
5. Add DNS + `VITE_API_URL` env var

## Notes

- **SSO**: cookie set with `Domain=.arkinstitutebc.com` → log in once, all 7 portals work
- **Auth**: each app's `+Layout.tsx` wraps with `<AuthGate>` → 401 redirects to `portal.arkinstitutebc.com/login`
- Test logins + everything else: see workspace `STATUS.md`
