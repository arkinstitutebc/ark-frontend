# @ark/ui

Shared SolidJS components used by all 7 portals.

## Exports

```ts
import {
  Sidebar, SidebarProvider, useSidebar, type NavItem, type SidebarProps,
  TopBar, type CurrentUser, type TopBarProps,
  AuthGate, type AuthGateProps,
  Modal, Input, Textarea, Button, Card, QueryBoundary, StatusBadge,
  Icons, PortalIcons,
  cn,
} from "@ark/ui"
```

| Export | Notes |
|---|---|
| `Sidebar` | parameterized — pass `brandIcon`, `brandTitle`, `navItems` |
| `TopBar` | takes `user` + `onLogout` |
| `AuthGate` | wraps app, redirects to portal/login on 401 |
| `Input` / `Textarea` | auto-IDs via `createUniqueId` |
| `Icons` | curated camelCase namespace (`Icons.bell`, `Icons.user`, …) |
| `PortalIcons` | mapping of portal name → icon (used in main-portal card grid) |
| `cn` | tailwind-merge + clsx |

## Add an icon

`src/icons.tsx`: import from `lucide-solid`, add camelCase key to the `Icons` object.

## When to add here

If 2+ apps would share it. Domain-specific stuff (e.g. `PrStatusBadge` for procurement) stays in the app.
