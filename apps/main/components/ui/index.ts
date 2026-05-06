// Re-export shared UI primitives directly from @ark/ui.
// (The per-file shims under this directory were removed — this barrel preserves
// `from "@/components/ui"` import paths used in pages + the `UI` alias for icons.)
export { Button, Card, cn, Icons, Icons as UI, Input, PortalIcons, Textarea } from "@ark/ui"
