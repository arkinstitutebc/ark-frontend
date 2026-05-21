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
  under_review: PROGRESS,
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

// User-managed labels (procurement categories, inventory tags, etc) don't have
// fixed semantic meaning, so they get a deterministic hash-to-palette mapping
// — same label always gets the same color, but new labels added at runtime
// pick up a color automatically with no schema change.
type CategoryTone = { bg: string; text: string }

const CATEGORY_PALETTE: CategoryTone[] = [
  { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  { bg: "bg-sky-50 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-teal-50 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-lime-50 dark:bg-lime-900/30", text: "text-lime-700 dark:text-lime-300" },
  { bg: "bg-fuchsia-50 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-300" },
]

export function categoryTone(label: string | null | undefined): CategoryTone {
  if (!label) return { bg: "bg-surface-muted", text: "text-muted" }
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length]
}

export function categoryToneClass(label: string | null | undefined): string {
  const t = categoryTone(label)
  return `${t.bg} ${t.text}`
}
