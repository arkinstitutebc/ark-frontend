import type { JSX } from "solid-js"
import { Show } from "solid-js"

export interface StatCardProps {
  /** Small label text above the value. */
  label: string
  /** The big number / amount / status. Pass a string or a formatted JSX node. */
  value: JSX.Element
  /** Optional smaller subtext below the value (e.g. "Land Bank", "of 32 total"). */
  hint?: JSX.Element
  /** Tabular-nums + tighter tracking — recommended for numeric values. */
  numeric?: boolean
  /** Override the value's color (e.g. `text-green-700`). */
  valueClass?: string
  /** Optional icon rendered on the right (e.g. `<Icons.package class="w-6 h-6" />`). */
  icon?: JSX.Element
  /** Tailwind classes for the icon's tinted square (e.g. `bg-blue-50 text-blue-600`). */
  iconClass?: string
  /** Pass-through extra classes on the outer card. */
  class?: string
}

/**
 * KPI tile for dashboards / list pages — the recurring
 * `bg-surface rounded-lg border border-border p-4` block with a `text-sm`
 * label, a large numeric value, and an optional hint underneath.
 */
export function StatCard(props: StatCardProps) {
  // When the caller passes `valueClass`, drop the default text color so
  // overrides like `text-green-700` don't fight `text-foreground` for
  // tailwind specificity (same-specificity utilities go by source order
  // in the compiled stylesheet, which is unpredictable).
  const valueClass = () =>
    `text-2xl ${props.valueClass ?? "text-foreground"} ${props.numeric ? "tabular-nums tracking-tight" : ""}`

  const inner = (
    <>
      <p class="text-sm text-muted mb-1">{props.label}</p>
      <p class={valueClass()}>{props.value}</p>
      <Show when={props.hint}>
        <p class="text-xs text-muted mt-1">{props.hint}</p>
      </Show>
    </>
  )

  return (
    <div class={`bg-surface rounded-lg border border-border p-4 ${props.class ?? ""}`}>
      <Show when={props.icon} fallback={inner}>
        <div class="flex items-center justify-between">
          <div>{inner}</div>
          <div
            class={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${props.iconClass ?? "bg-primary/10 text-primary"}`}
          >
            {props.icon}
          </div>
        </div>
      </Show>
    </div>
  )
}

export interface InfoCardProps {
  /** Small label text above the value. */
  label: string
  /** Value rendered as text. Use this OR `children`. */
  value?: JSX.Element
  /** Custom value content — use when you need badges, links, or other JSX. */
  children?: JSX.Element
  /** Render value in monospace (for codes, IDs). */
  mono?: boolean
  /** Override the value's text class. */
  valueClass?: string
  /** Pass-through extra classes on the outer card. */
  class?: string
}

/**
 * Key-value tile used on detail pages — same outer chrome as `<StatCard>` but
 * smaller value text. Pass `value` for plain text, or `children` for badges,
 * links, or richer content.
 */
export function InfoCard(props: InfoCardProps) {
  const valueClass = () =>
    `text-sm ${props.valueClass ?? "text-foreground"} ${props.mono ? "font-mono" : ""}`
  return (
    <div class={`bg-surface rounded-lg border border-border p-4 ${props.class ?? ""}`}>
      <p class="text-xs text-muted mb-1">{props.label}</p>
      <Show when={props.children} fallback={<p class={valueClass()}>{props.value ?? "—"}</p>}>
        {props.children}
      </Show>
    </div>
  )
}
