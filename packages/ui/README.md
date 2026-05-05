# @ark/ui

Shared SolidJS components used by all 7 portals.

## Exports

```ts
import {
  Sidebar, SidebarProvider, useSidebar, type NavItem, type SidebarProps,
  TopBar, type CurrentUser, type TopBarProps,
  AuthGate, type AuthGateProps,
  ThemeProvider, ThemeToggle, useTheme, NO_FOUC_SCRIPT,
  type ThemePreference, type EffectiveTheme,
  Modal, Input, Textarea, Button, Card, QueryBoundary, StatusBadge,
  Icons, PortalIcons,
  cn,
} from "@ark/ui"
```

| Export | Notes |
|---|---|
| `Sidebar` | parameterized — pass `brandIcon`, `brandTitle`, `navItems` |
| `TopBar` | takes `user` + `onLogout`, includes `<ThemeToggle compact />` |
| `AuthGate` | wraps app, redirects to portal/login on 401 |
| `ThemeProvider` | wrap `+Layout.tsx` once. Light/dark/auto, localStorage `ark-theme`, OS sync via `matchMedia` |
| `ThemeToggle` | 3-state segmented control (Sun · Monitor · Moon). Pass `compact` to hide labels under sm. |
| `useTheme()` | `{ preference, effective, setTheme }` |
| `NO_FOUC_SCRIPT` | inline JS — render in `+Head.tsx` via `<script innerHTML={NO_FOUC_SCRIPT} />` so theme is set before first paint |
| `Input` / `Textarea` | auto-IDs via `createUniqueId`; theme-aware (`bg-surface text-foreground placeholder:text-muted`) |
| `Icons` | curated camelCase namespace (`Icons.bell`, `Icons.sun`, …). NEVER use emoji literals — add to this map instead. |
| `PortalIcons` | mapping of portal name → icon (used in main-portal card grid) |
| `cn` | tailwind-merge + clsx |

## Add an icon

`src/icons.tsx`: import from `lucide-solid`, add camelCase key to the `Icons` object. Re-export from `index.ts` if it's a new top-level component.

## Dark mode for new components

Use semantic utilities — `bg-surface`, `bg-surface-muted`, `text-foreground`, `text-muted`, `border-border`, `placeholder:text-muted`. Avoid raw `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`. The token cascade in `@ark/design-system/globals.css` flips them automatically per theme.

## When to add here

If 2+ apps would share it. Domain-specific stuff (e.g. `PrStatusBadge` for procurement) stays in the app.
