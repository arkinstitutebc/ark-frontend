import type { JSX } from "solid-js"
import { Show } from "solid-js"

interface PageHeaderProps {
  title: string
  /** Subtitle / count line under the title (e.g. "12 students"). */
  subtitle?: string | JSX.Element
  /** Optional pill rendered next to the title — typically a `<StatusBadge>`. */
  badge?: JSX.Element
  /** Optional right-side slot for primary action (button, link, etc.). */
  action?: JSX.Element
}

/**
 * Top-of-page header: large title + optional status badge + optional subtitle,
 * with an action slot on the right. Used on every list and detail page so
 * heading sizes / spacing don't drift.
 *
 * ```tsx
 * <PageHeader title="Disbursements" subtitle="Cash expenses" action={<NewBtn/>} />
 * <PageHeader title={po.poCode} badge={<StatusBadge status={po.status} />} action={<>...</>} />
 * ```
 */
export function PageHeader(props: PageHeaderProps) {
  return (
    <div class="flex items-start justify-between mb-8 gap-4">
      <div class="min-w-0">
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="text-2xl font-semibold text-foreground">{props.title}</h1>
          <Show when={props.badge}>{props.badge}</Show>
        </div>
        <Show when={props.subtitle}>
          <p class="text-sm text-muted mt-1">{props.subtitle}</p>
        </Show>
      </div>
      <Show when={props.action}>
        <div class="flex-shrink-0">{props.action}</div>
      </Show>
    </div>
  )
}
