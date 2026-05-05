import type { PoStatus, PrStatus, StockStatus } from "@data/types"

const prStatusColors: Record<PrStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  approved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  ordered: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
}

const poStatusColors: Record<PoStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  partial: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  received: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
}

const stockStatusColors: Record<StockStatus, { bg: string; text: string; dot: string }> = {
  "in-stock": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  "low-stock": { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  "out-of-stock": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
}

export function PrStatusBadge(props: { status: PrStatus }) {
  const colors = prStatusColors[props.status]
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

export function PoStatusBadge(props: { status: PoStatus }) {
  const colors = poStatusColors[props.status]
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

export function StockStatusBadge(props: { status: StockStatus }) {
  const colors = stockStatusColors[props.status]
  const label =
    props.status === "in-stock"
      ? "In Stock"
      : props.status === "low-stock"
        ? "Low Stock"
        : "Out of Stock"
  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}
