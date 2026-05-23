# Changelog

All notable changes to the ark-frontend monorepo (7 portals + 4 shared packages).

## [1.1.0] — 2026-05-23

First minor release since v1.0.0. Adds Reimbursement Module (Feature #4), Segmented Income Statement, GL Accounts admin, Procurement 3-signature approvals UI, and a major @ark/ui primitive consolidation that cut ~100 lines of duplicate UI across the 7 portals.

### Added

#### Finance portal
- Reimbursement Request module — list, create, detail (with inline action panel: verify / approve / reject / accounting note), approvals queue, sidebar wiring.
- Reimbursement create form: attachments uploader (direct-upload to Cloudinary).
- Reimbursement edit page (`/reimbursements/:id/edit`) with status-pending guard, full field hydration, attachment add/clear.
- Edit link on detail page visible only while status is pending.
- Segmented Income Statement page (`/income-statement`) with date-range picker (Current quarter / Last quarter / YTD), spreadsheet-style table with bold computed rows + primary-color highlights, "View PDF" button.
- GL Accounts admin page (`/gl-accounts`) — sectioned table by Cost of Services / Admin / Fixed Asset / Other, create/edit modal with code immutability after creation, soft-deactivate.
- Disbursement create form: grouped category dropdown by section + 4 classification dropdowns with smart-default pre-fill from the GL catalog.

#### Procurement portal
- PR form gains 4 accounting classification dropdowns + Date Needed.
- 3-signature approvals UI: Coordinator queue + Management queue, separation-of-duties guard.
- Item Specification + Remarks fields on create + edit forms.
- `prCode` shown on PO list, detail, and document modal (no more raw UUIDs).
- PO edit modal + inline PDF preview.

#### Inventory portal
- Stock Take page — bulk count UI with variance preview, single atomic submit.
- Receiving sends the PO line shape + PO Receipts section.
- Category badges with deterministic tone colors (matches procurement).

#### Main portal
- `/learn/<portal>` Learning Hub — every per-portal manual lives behind the main navbar so users stay in one tab.
- Sidebar Help link in every sub-portal points to its `/tutorials` page.
- Version chip in sidebar + main footer — reads from `package.json` via Vite, no extra config.

#### Users
- Position + Department fields on profile + admin invite/edit forms.

### Changed (@ark/ui consolidation)

Major dedup across the 7 portals — most of these started as 6-7 per-portal copies of the same component:

- `PageHeader` (with badge slot for detail pages) — rolled out across all portals.
- `StatCard` + `InfoCard` — replace ~50 KPI / info tiles.
- `DataTable` / `THead` / `Th` / `Tr` — replace 22 thead blocks.
- Unified `StatusBadge` — deleted 3 portal-specific status-badges files.
- `categoryTone` / `categoryToneClass` helpers — applied in procurement + inventory.
- `createCrudHooks` factory — migrated 8 domain hook files.
- `BackLink` — visible pill default, animated arrow on hover; migrated 14 callsites.
- `PageContainer` / `ModalFooter` / `ConfirmDialog` / form-style helpers — applied across the modal stack.
- `AttachmentUploader` promoted to `@ark/ui` with `signatureEndpoint` prop — procurement + finance share one implementation, per-app copies deleted (net **−106 lines**).
- Shared format helpers — replaced inline `formatCurrency` / `formatDate` everywhere.

### Fixed

- Procurement approve/reject modal honors action intent — required notes only on reject.
- Sub-portal topbar avatar + main navbar dropdown render uploaded `photoUrl` (fallback to icon when missing).
- Select dropdowns / `navigate()` instead of full reload across procurement modals.
- Vike routing: renamed `[id]` / `[period]` dirs to `@`-prefix convention.

### Infra

- 7 systemd units (`ark-portal-{main,training,procurement,inventory,finance,billing,hr}`) running Vike SSR behind Caddy.
- CI smart redeploy: rebuilds only apps whose source files changed; touching `packages/**` rebuilds all 7.

## [1.0.14] and earlier

Patch-bumped per shipment since v1.0.0. See `git log v1.0.0..v1.0.14` for the granular trail.
