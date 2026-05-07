/**
 * Single source of truth for status pill colors. The `StatusBadge` display
 * component in `display/status-badge.tsx` uses this map; pages that render
 * inline status pills can also import `statusTone()` directly.
 *
 * Add new status names to the lookup as features grow. Anything unknown
 * falls back to the neutral "muted" tone.
 */

export type StatusTone = {
  bg: string
  text: string
}

const POSITIVE = {
  bg: "bg-green-100 dark:bg-green-900/30",
  text: "text-green-700 dark:text-green-300",
}
const PROGRESS = { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" }
const PENDING = {
  bg: "bg-yellow-100 dark:bg-yellow-900/30",
  text: "text-yellow-700 dark:text-yellow-300",
}
const NEGATIVE = { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" }
const NEUTRAL = { bg: "bg-surface-muted", text: "text-muted" }

const TONE_BY_STATUS: Record<string, StatusTone> = {
  // training / batches
  "Not Started": NEUTRAL,
  "In Progress": PROGRESS,
  "On Hold": PENDING,
  Completed: POSITIVE,

  // students
  Enrolled: PROGRESS,
  "In Training": PROGRESS,
  Certified: POSITIVE,
  Dropped: NEGATIVE,

  // procurement / billing / generic
  pending: PENDING,
  approved: POSITIVE,
  rejected: NEGATIVE,
  ordered: PROGRESS,
  draft: NEUTRAL,
  sent: PROGRESS,
  partial: PENDING,
  received: POSITIVE,
  cancelled: NEGATIVE,
  created: NEUTRAL,
  billed: PROGRESS,
  paid: POSITIVE,
  overdue: NEGATIVE,

  // inventory
  "in-stock": POSITIVE,
  "low-stock": PENDING,
  "out-of-stock": NEGATIVE,

  // hr
  active: POSITIVE,
  inactive: NEUTRAL,
  "on-leave": PENDING,

  // finance / payroll
  processed: POSITIVE,
  failed: NEGATIVE,
  completed: POSITIVE,
}

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return NEUTRAL
  return TONE_BY_STATUS[status] ?? NEUTRAL
}

/** Convenience: combined tailwind class string (`bg-... text-...`). */
export function statusToneClass(status: string | null | undefined): string {
  const t = statusTone(status)
  return `${t.bg} ${t.text}`
}
