import { statusTone } from "../utils/status-tone"

export interface StatusBadgeProps {
  status: string
  /** Override the default human-friendly label. */
  label?: string
}

/**
 * Title-case + hyphen-aware: "in-stock" → "In Stock", "on-leave" → "On Leave",
 * "approved" → "Approved", "Batch Completed" → "Batch Completed".
 */
function defaultLabel(status: string): string {
  return status
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

/**
 * Single status pill used across all portals. Color tone comes from
 * `statusTone(status)` — the canonical map in `utils/status-tone.ts`. Pass
 * `label` to override the auto-titlecased default.
 */
export function StatusBadge(props: StatusBadgeProps) {
  const tone = () => statusTone(props.status)
  const label = () => props.label ?? defaultLabel(props.status)
  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone().bg} ${tone().text}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${tone().dot}`} />
      {label()}
    </span>
  )
}
