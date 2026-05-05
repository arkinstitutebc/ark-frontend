# Ark Procurement Portal

Purchase request and order management portal for Ark Institute ERP.

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
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Pages

| Route | Page | Status |
|-------|------|--------|
| `/` | Dashboard | ✅ |
| `/approvals` | PR Approval Workflow | ✅ |
| `/approvals/[id]` | PR Details | ✅ |
| `/pr` | Purchase Requests List | ✅ |
| `/pr/create` | Create PR | ✅ |
| `/pr/[id]` | PR Details | ✅ |
| `/orders` | Purchase Orders | ✅ |
| `/orders/create` | Create PO | ✅ |
| `/orders/[id]` | PO Details | ✅ |

## Features
- ✅ Purchase Request (PR) creation with line items
- ✅ Approval workflow (pending → approved/rejected)
- ✅ Purchase Order (PO) generation
- ✅ Budget tracking per batch
- ✅ Category-based organization
