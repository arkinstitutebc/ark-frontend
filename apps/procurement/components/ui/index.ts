// Re-export shared UI primitives directly from @ark/ui.
// (The per-file shims under this directory were removed — this barrel preserves
// `from "@/components/ui"` import paths used in pages.)
export {
  Button,
  Card,
  Icons,
  Input,
  Modal,
  QueryBoundary,
  StatusBadge,
} from "@ark/ui"

// Local domain status badges (PR/PO/inventory-state).
export * from "./status-badges"
