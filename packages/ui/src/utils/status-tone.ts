/**
 * Single source of truth for status pill colors. The `StatusBadge` display
 * component in `display/status-badge.tsx` reads from this map; pages that
 * render inline status pills can also import `statusTone()` directly.
 *
 * Add new status names to the lookup as features grow. Anything unknown
 * falls back to the neutral "muted" tone.
 */

export type StatusTone = {
  bg: string
  text: string
  /** Solid color used for the leading dot in `<StatusBadge>`. */
  dot: string
}

// Bg uses the lighter `-50` palette to match the per-portal badges that
// preceded this. Dark-mode classes keep contrast in dark themes.
const POSITIVE: StatusTone = {
  bg: "bg-green-50 dark:bg-green-900/30",
  text: "text-green-700 dark:text-green-300",
  dot: "bg-green-400",
}
const PROGRESS: StatusTone = {
  bg: "bg-blue-50 dark:bg-blue-900/30",
  text: "text-blue-700 dark:text-blue-300",
  dot: "bg-blue-400",
}
const PENDING: StatusTone = {
  bg: "bg-yellow-50 dark:bg-yellow-900/30",
  text: "text-yellow-700 dark:text-yellow-300",
  dot: "bg-yellow-400",
}
const NEGATIVE: StatusTone = {
  bg: "bg-red-50 dark:bg-red-900/30",
  text: "text-red-700 dark:text-red-300",
  dot: "bg-red-400",
}
const NEUTRAL: StatusTone = { bg: "bg-surface-muted", text: "text-muted", dot: "bg-muted" }

const TONE_BY_STATUS: Record<string, StatusTone> = {
  // training / batches
  "Not Started": NEUTRAL,
  "In Progress": PROGRESS,
  "On Hold": PENDING,
  Completed: POSITIVE,
  "Batch Completed": POSITIVE,

  // students
  Enrolled: PROGRESS,
  "In Training": PROGRESS,
  Certified: POSITIVE,
  Dropped: NEGATIVE,
  "Student Completed": NEUTRAL,

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

  // hr — trainers
  active: POSITIVE,
  inactive: NEUTRAL,
  "on-leave": PENDING,

  // hr — attendance
  present: POSITIVE,
  late: PENDING,
  absent: NEGATIVE,

  // finance / payroll / transactions
  processed: PROGRESS,
  failed: NEGATIVE,
  completed: POSITIVE,
  income: POSITIVE,
  expense: NEGATIVE,
  transfer: PROGRESS,
  "transfer in": PROGRESS,
  "transfer out": PROGRESS,
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
