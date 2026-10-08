# E2E Test Organization

Use Playwright specs here for portal-level flows that need a browser.

## Folders

- `smoke/`: cross-portal route and shell health.
- `core/`: main portal, auth, profile, theme, base URL, and shared UI behavior.
- `admin/`: admin user and notification workflows.
- `training/`, `procurement/`, `inventory/`, `finance/`, `billing/`, `hr/`: module-specific ERP workflows.

## Naming

- `*-smoke.spec.ts`: route health, rendering, and auth shell checks.
- `*-actions.spec.ts`: create/update/delete or approval workflows.
- `<module>/<feature>.spec.ts`: focused feature coverage, for example `finance/assets.spec.ts`.
- `<module>/actions.spec.ts`: module action workflows, for example `billing/actions.spec.ts`.
- `*-visual.spec.ts`: visual snapshots only. Keep these skipped unless `RUN_VISUAL_E2E=1`.

## Shared Setup

- `test-config.ts` owns portal base URLs and the API URL fallback.
- `auth-helper.ts` owns backend reachability checks and seeded admin login.
- `helpers.ts` owns browser/UI wait helpers.

The backend must be running locally on `:4000` with a current schema. Set
`E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` for the local test account. If the
database came from production, point the API at a disposable local clone, not
the pristine snapshot; these tests can create operational records.

Keep API mutations in focused specs and clean up test data when a flow creates users or long-lived records.

`bun run test:e2e:changed` selects module specs and preview servers from uncommitted
files, or from the latest commit when the worktree is clean. Set `E2E_BASE=<ref>`
to compare against a branch or commit. Shared app/test setup changes run the
whole suite; documentation-only changes skip browser tests. Pass Playwright
flags through, for example `bun run test:e2e:changed --project chromium-light`.

If another local app occupies Billing's default port 3005, set
`E2E_BILLING_PORT=3105` for the run. The Billing preview and test URL will both
use that port; do not stop an unrelated service just to run these tests.
