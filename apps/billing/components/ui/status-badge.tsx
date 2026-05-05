export interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label?: string }> = {
  // AR Status (from docs: created → billed → paid)
  created: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
  billed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },

  // Batch Status
  "Not started": { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-300" },
  "Not Started": { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-300" },
  "In Progress": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  "On Hold": { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  Completed: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
}

export function StatusBadge(props: StatusBadgeProps) {
  const config = statusConfig[props.status] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-300",
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
