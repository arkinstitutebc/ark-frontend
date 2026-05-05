import type { AttendanceStatus, PayrollStatus, TrainerStatus } from "@data/types"

const trainerStatusColors: Record<TrainerStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  inactive: { bg: "bg-surface-muted", text: "text-muted", dot: "bg-muted" },
  "on-leave": { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
}

const trainerStatusLabels: Record<TrainerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  "on-leave": "On Leave",
}

const attendanceStatusColors: Record<AttendanceStatus, { bg: string; text: string; dot: string }> =
  {
    present: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
    late: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
    absent: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  }

const payrollStatusColors: Record<PayrollStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-surface-muted", text: "text-muted", dot: "bg-muted" },
  processed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
}

export function TrainerStatusBadge(props: { status: TrainerStatus }) {
  const colors = trainerStatusColors[props.status]
  const label = trainerStatusLabels[props.status]
  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

export function AttendanceStatusBadge(props: { status: AttendanceStatus }) {
  const colors = attendanceStatusColors[props.status]
  const label = props.status.charAt(0).toUpperCase() + props.status.slice(1)
  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

export function PayrollStatusBadge(props: { status: PayrollStatus }) {
  const colors = payrollStatusColors[props.status]
  const label = props.status.charAt(0).toUpperCase() + props.status.slice(1)
  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}
