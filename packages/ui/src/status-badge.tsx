export interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label?: string }> = {
  // Student statuses
  Certified: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  Enrolled: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  "In Training": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  "Student Completed": { bg: "bg-surface-muted", text: "text-muted", dot: "bg-muted" },
  Dropped: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },

  // Batch statuses
  "Not Started": { bg: "bg-surface-muted", text: "text-muted", dot: "bg-muted" },
  "In Progress": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  "On Hold": { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  "Batch Completed": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
}

export function StatusBadge(props: StatusBadgeProps) {
  const config = statusConfig[props.status] || {
    bg: "bg-surface-muted",
    text: "text-muted",
    dot: "bg-muted",
  }

  const label = config.label || props.status.charAt(0).toUpperCase() + props.status.slice(1)

  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  )
}
