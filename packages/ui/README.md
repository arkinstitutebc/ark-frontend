# @ark/ui

Shared SolidJS UI components used by all 7 portals.

## Components

| Export | What | Notes |
|---|---|---|
| `Sidebar` | Sidebar shell | Each app passes `brandIcon`, `brandTitle`, `navItems` |
| `SidebarProvider`, `useSidebar` | Collapse + mobile-open state | localStorage-persisted |
| `TopBar` | Top header | Wraps user dropdown + logout button |
| `AuthGate` | Wraps app, redirects on 401 | Pass `userQuery` from `@ark/api-client` |
| `Modal` | Standard modal shell | |
| `Input`, `Textarea` | Inputs with labels + error states | Auto-IDs via `createUniqueId` |
| `Button` | Variant-based button | |
| `Card` | Standard card container | |
| `QueryBoundary` | Loading/error/success states | Wraps TanStack Query results |
| `StatusBadge` | Generic status pill | |
| `Icons` | Curated camelCase icon namespace | `Icons.bell`, `Icons.user`, etc. |
| `PortalIcons` | Icons keyed by portal name | Used in main-portal card grid |
| `cn` | tailwind-merge + clsx wrapper | |

## Usage

```tsx
import { Sidebar, type NavItem } from "@ark/ui"
import { Folder, Users } from "lucide-solid"

const navItems: NavItem[] = [
  { id: "batches", label: "Batches", href: "/", icon: Folder },
  { id: "students", label: "Students", href: "/students", icon: Users },
]

<Sidebar
  brandIcon={Folder}
  brandTitle="Training"
  brandSubtitle="Batches & Enrollments"
  navItems={navItems}
/>
```

## Adding a new icon

Edit `src/icons.tsx`:
1. Import the icon from `lucide-solid`
2. Add to the `Icons` object with a camelCase key

Then `bun install` from monorepo root to refresh the symlink (usually unnecessary, only on dep changes).

## When to put something here vs in an app

- **Here**: anything that 2+ apps would benefit from sharing (UI primitives, layout shells, helpers)
- **In the app**: pages, app-specific modals, domain-specific components (e.g., `PrStatusBadge` lives in procurement-portal)
