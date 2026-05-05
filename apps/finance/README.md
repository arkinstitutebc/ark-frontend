# Ark Finance Portal

Two-bank tracking and P&L management portal for Ark Institute ERP.

## Tech Stack
- SolidJS
- Vike (SSR framework)
- Tailwind CSS 4
- Lucide Icons

## Design System
- Primary: #193a7a (Ark Blue)
- Accent: #c80100 (Ark Red)
- Font: Montserrat

## Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
bun run preview
```

## Pages

| Route | Page | Status |
|-------|------|--------|
| `/` | Financial Overview Dashboard | ✅ |
| `/banks` | Bank Accounts & Transactions | ✅ |
| `/transfers` | Fund Transfers (Double-Entry) | ✅ |
| `/transfers/create` | Create New Transfer | ✅ |
| `/disbursements` | Cash Disbursements/Expenses | TODO |

## Two-Bank System

### Revenue Vault (Land Bank)
- Holds government funds, grants, AR payments
- Money IN: Income from TESDA/batches
- Money OUT: Transfers to Operational Hub only

### Operational Hub (Security Bank)
- Day-to-day operations spending
- Money IN: Transfers from Revenue Vault only
- Money OUT: Expenses (suppliers, rent, trainer fees, etc.)

## Data Layer

Located in `/ark-portals/data/`:
- `types/finance.ts` - TypeScript types
- `finance.json` - Transaction log
- `ar.json` - Accounts receivable
- `index.ts` - API functions

## Audit Features

- ✅ Immutable transaction log (no edits/deletes)
- ✅ Double-entry accounting for transfers
- ✅ Unique transaction IDs with timestamps
- ✅ User attribution (createdBy)
- ✅ Reference linking (PO, batch, AR)
- ✅ CSV export for accounting
- ✅ High-value approval notes (≥₱50,000)
