# @ark/ui

Shared SolidJS components used by all 7 portals.

## Exports

```ts
import {
  Sidebar, SidebarProvider, useSidebar, type NavItem, type SidebarProps,
  TopBar, PortalTopBar, SubPortalShell, type CurrentUser, type TopBarProps,
  AuthGate, type AuthGateProps, PageContainer, PageHeader, BackLink,
  ThemeProvider, ThemeToggle, useTheme, NO_FOUC_SCRIPT,
  type ThemePreference, type EffectiveTheme,
  Modal, ModalFooter, ConfirmDialog, QueryBoundary, TableSkeleton,
  Input, Textarea, Select, Button, Field, AttachmentUploader,
  Card, InfoCard, StatCard, DataTable, THead, Th, Tr, StatusBadge,
  TutorialShell, type TutorialAction, type TutorialSection,
  Icons, PortalIcons, formatPeso, formatDatePH, categoryToneClass,
  cn,
} from "@ark/ui"
```

| Export | Notes |
|---|---|
| `Sidebar` | parameterized — pass `brandIcon`, `brandTitle`, `navItems` |
| `TopBar` | takes `user` + `onLogout`, includes `<ThemeToggle compact />` |
| `PortalTopBar` / `SubPortalShell` | smart portal shell pieces wired to auth, notifications, and logout |
| `AuthGate` | wraps app. Takes `ssrUser` (session resolved during SSR) and renders immediately when present; otherwise waits on `useCurrentUser()` and redirects to portal/login on 401. A live 401 always wins, so sessions expiring mid-use still redirect. |
| `PageContainer` / `PageHeader` / `BackLink` | standard page framing and detail-page navigation |
| `ThemeProvider` | wrap `+Layout.tsx` once. Light/dark/auto, localStorage `ark-theme`, OS sync via `matchMedia` |
| `ThemeToggle` | 3-state segmented control (Sun · Monitor · Moon). Pass `compact` to hide labels under sm. |
| `useTheme()` | `{ preference, effective, setTheme }` |
| `NO_FOUC_SCRIPT` | inline JS — render in `+Head.tsx` via `<script innerHTML={NO_FOUC_SCRIPT} />` so theme is set before first paint |
| `Input` / `Textarea` / `Select` / `Field` | theme-aware form primitives |
| `AttachmentUploader` | shared Cloudinary/direct-upload attachment control |
| `DataTable` / `THead` / `Th` / `Tr` | table primitives with consistent spacing |
| `StatCard` / `InfoCard` / `Card` | repeated KPI and information panels |
| `Modal` / `ModalFooter` / `ConfirmDialog` / `TableSkeleton` | feedback and loading primitives |
| `TutorialShell` | shared manual layout for sub-portal `/tutorials` and main `/learn/<portal>` pages |
| `Icons` | curated camelCase namespace (`Icons.bell`, `Icons.sun`, …). NEVER use emoji literals — add to this map instead. |
| `PortalIcons` | mapping of portal name → icon (used in main-portal card grid) |
| `formatPeso` / `formatDatePH` / `categoryToneClass` | cross-portal formatting and tone helpers |
| `cn` | tailwind-merge + clsx |

## Add an icon

`src/icons.tsx`: import from `lucide-solid`, add camelCase key to the `Icons` object. Re-export from `index.ts` if it's a new top-level component.

## Dark mode for new components

Use semantic utilities — `bg-surface`, `bg-surface-muted`, `text-foreground`, `text-muted`, `border-border`, `placeholder:text-muted`. Avoid raw `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`. The token cascade in `@ark/design-system/globals.css` flips them automatically per theme.

## When to add here

If 2+ apps would share it. Domain-specific stuff (e.g. `PrStatusBadge` for procurement) stays in the app.

## SSR hydration

Keep optional JSX slots stable between server render and client hydration. `PageHeader` renders its `action` in a stable container; `StatCard` evaluates its optional `icon` once before choosing the icon or no-icon layout. Changes to those branches should be checked in a production SSR preview, not only client-side navigation.
