/**
 * Locale-aware formatters for the Philippines (en-PH).
 * Exported from `@ark/ui` so every portal uses the same display rules.
 */

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
})

export function formatPeso(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "—"
  const n = typeof amount === "number" ? amount : Number(amount)
  if (!Number.isFinite(n)) return "—"
  return pesoFormatter.format(n)
}

export function formatDatePH(date: string | Date | null | undefined): string {
  if (!date) return "TBD"
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return "TBD"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatMonthYear(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}
