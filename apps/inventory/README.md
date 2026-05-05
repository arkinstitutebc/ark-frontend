# Ark Inventory Portal

Stock tracking and receiving portal for Ark Institute ERP.

## Status: 🟡 In Progress

## Tech Stack
- SolidJS
- Vike (SSR framework)
- Tanstack Query
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

| Route | Page | Description |
|-------|------|-------------|
| `/` | Stock Dashboard | Main inventory overview with table |
| `/receiving` | Receiving | Receive goods from POs |
| `/movements` | Movements | Stock movement audit log |

## Features

### Stock Dashboard ✅
- Stock overview with stats cards (total items, low stock, total value)
- Current stock table with search and filter
- Status badges (In Stock, Low Stock, Out of Stock)
- View and Adjust buttons per row

### View Item Modal ✅
- Item details with status badge (colored dot)
- Gradient stock summary card (On Hand, Reorder At, Last Updated)
- Item Information section
- Batch Information section with PO reference
- Recent movements table (last 5)
- Scrollable content with max-h-[70vh]

### Adjust Stock Modal ✅
- Visual quantity comparison (Current → New)
- Color-coded change indicator (green for +, red for -)
- Quick adjust buttons (-10, -5, -1, Reset, +1, +5, +10)
- Manual quantity input with live feedback
- Reason dropdown with required validation
- Notes field (optional)
- Validates and updates stock via `updateStock()`
- Logs movements via `addMovement()`

### Receiving ✅
- PO list view (sent/partial status only)
- Breadcrumb navigation (All Orders / PO-XXX)
- Receiving summary card with totals
- Quick-fill buttons per item (All / Clear)
- Visual checkmark when item fully received
- Partial receipt support (receive some items now, rest later)
- Complete Receipt updates stock and logs movements

### Movements ✅
- Stock movement audit log table
- Filter by type (all/in/out/adjustment)
- Search by item name
- Stats cards showing totals

## Data Integration

Uses shared `@data` folder (not tracked in git):
- `data/inventory.json` - Stock items
- `data/movements.json` - Movement log
- `data/orders.json` - Purchase orders for receiving

Functions available:
- `getStockItems()` - Get all stock items
- `updateStock(id, quantity)` - Update quantity
- `addMovement(movement)` - Add stock movement
- `getPurchaseOrdersForReceiving()` - Get POs for receiving

## File Structure

```
inventory-portal/
├── components/
│   ├── adjust-stock-modal.tsx
│   ├── view-item-modal.tsx
│   ├── navbar.tsx
│   ├── footer.tsx
│   └── ui/ (reusable components)
└── pages/
    ├── index/+Page.tsx (Stock)
    ├── receiving/+Page.tsx
    └── movements/+Page.tsx
```

## Pending

- [ ] Edit item details
- [ ] Delete stock items
- [ ] Export to Excel
- [ ] Backend API integration

<!-- monorepo CI test -->
