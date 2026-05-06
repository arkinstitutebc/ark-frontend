/**
 * Small inline pill displaying a user role label.
 * Used in topbar/navbar dropdown headers and (future) admin tables.
 */
export function RolePill(props: { role: string; class?: string }) {
  return (
    <span
      class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-muted text-muted capitalize ${props.class ?? ""}`}
    >
      {props.role}
    </span>
  )
}
