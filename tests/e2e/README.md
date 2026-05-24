# E2E Test Organization

Use Playwright specs here for portal-level flows that need a browser.

## Naming

- `*-smoke.spec.ts`: route health, rendering, and auth shell checks.
- `*-actions.spec.ts`: create/update/delete or approval workflows.
- `<module>-<feature>.spec.ts`: focused feature coverage, for example `finance-assets.spec.ts`.
- `*-visual.spec.ts`: visual snapshots only. Keep these skipped unless `RUN_VISUAL_E2E=1`.

## Shared Setup

- `test-config.ts` owns portal base URLs and the API URL fallback.
- `auth-helper.ts` owns backend reachability checks and seeded admin login.
- `helpers.ts` owns browser/UI wait helpers.

Keep API mutations in focused specs and clean up test data when a flow creates users or long-lived records.
