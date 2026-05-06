import type { Component } from "solid-js"

/**
 * Standard empty-state for list views.
 *
 * `icon` is a Component reference (NOT a JSX value). Passing JSX as a prop
 * triggers SolidJS hydration crashes when the JSX contains lucide-solid
 * icons — see `feedback_rca_sop.md` and the prior leftIcon fix.
 *
 * Example:
 *   <EmptyState
 *     icon={Icons.fileText}
 *     heading="No requests yet"
 *     description="Create one to get started."
 *     action={{ label: "Create request", onClick: () => setOpen(true) }}
 *   />
 */
export interface EmptyStateProps {
  icon: Component<{ class?: string }>
  heading: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState(props: EmptyStateProps) {
  const Icon = props.icon
  return (
    <div class="text-center py-12">
      <Icon class="w-12 h-12 mx-auto mb-3 text-muted" />
      <p class="text-foreground font-medium">{props.heading}</p>
      {props.description && <p class="text-sm text-muted mt-1">{props.description}</p>}
      {props.action && (
        <button
          type="button"
          onClick={props.action.onClick}
          class="mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {props.action.label}
        </button>
      )}
    </div>
  )
}
