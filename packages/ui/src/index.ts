/**
 * @ark/ui — shared component library for all 7 portals.
 *
 * **Architecture**: Files are organized by concern under `packages/ui/src/`:
 *   - `forms/` — interactive form controls (Button, Input, Select, Textarea)
 *   - `display/` — small visual primitives (Card, RolePill, StatusBadge, NotificationBell)
 *   - `feedback/` — loading + status overlays (Modal, AppToaster, EmptyState,
 *     PageLoading, TopProgressBar, TableSkeleton, QueryBoundary)
 *   - `layout/` — page structure (Sidebar, TopBar, PortalTopBar, SubPortalShell, AuthGate)
 *   - `theme/` — ThemeProvider, ThemeToggle, NO_FOUC_SCRIPT
 *   - `icons.tsx`, `utils.ts` — primitives
 *
 * **"Smart" vs "dumb" components**: Most files are presentational and depend
 * only on `solid-js`, `lucide-solid`, etc. A small set ("smart") import from
 * `@ark/api-client` to pre-wire common queries — currently `SubPortalShell`
 * (calls `useCurrentUser` for AuthGate) and `PortalTopBar` (wires
 * notifications + logout). The dep edge `@ark/ui → @ark/api-client` is
 * one-way and intentional; consumers don't need to wire these themselves.
 * If we ever need a strict-presentational subset, split smart components
 * into their own `@ark/ui-smart` package then.
 */

// Display
export { Card } from "./display/card"
export {
  NotificationBell,
  type NotificationBellProps,
  type NotificationItem,
} from "./display/notification-bell"
export { RolePill } from "./display/role-pill"
export { StatusBadge } from "./display/status-badge"
// Feedback
export { AppToaster, toast } from "./feedback/app-toaster"
export { AvatarCropper, type AvatarCropperProps } from "./feedback/avatar-cropper"
export { CrossPortalLoadingOverlay } from "./feedback/cross-portal-loading-overlay"
export { EmptyState, type EmptyStateProps } from "./feedback/empty-state"
export { Modal } from "./feedback/modal"
export { PageLoading } from "./feedback/page-loading"
export { QueryBoundary } from "./feedback/query-boundary"
export { TableSkeleton } from "./feedback/table-skeleton"
export { TopProgressBar } from "./feedback/top-progress-bar"
// Forms
export { Button } from "./forms/button"
export { Input, Textarea } from "./forms/input"
export { Select, type SelectOption, type SelectProps } from "./forms/select"
// Primitives
export { Icons, PortalIcons } from "./icons"
// Layout
export { AuthGate, type AuthGateProps } from "./layout/auth-gate"
export { PortalTopBar, type PortalTopBarProps } from "./layout/portal-topbar"
export { type NavItem, Sidebar, type SidebarProps } from "./layout/sidebar"
export { SidebarProvider, useSidebar } from "./layout/sidebar-context"
export { SubPortalShell, type SubPortalShellProps } from "./layout/sub-portal-shell"
export { type CurrentUser, TopBar, type TopBarProps } from "./layout/topbar"
// Theme
export {
  type EffectiveTheme,
  NO_FOUC_SCRIPT,
  type ThemePreference,
  ThemeProvider,
  useTheme,
} from "./theme/theme"
export { ThemeToggle } from "./theme/theme-toggle"
export { cn } from "./utils"
