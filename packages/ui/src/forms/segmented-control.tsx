import type { Component, JSX } from "solid-js"
import { For } from "solid-js"

export interface SegmentedControlOption<T extends string> {
  label: string
  value: T
  icon?: Component<{ class?: string }>
}

export interface SegmentedControlProps<T extends string> {
  value: T
  options: SegmentedControlOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  class?: string
}

export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>): JSX.Element {
  return (
    <fieldset
      class={`inline-flex rounded-lg border border-border p-1 ${props.class ?? ""}`}
      aria-label={props.ariaLabel}
    >
      <legend class="sr-only">{props.ariaLabel}</legend>
      <For each={props.options}>
        {option => {
          const Icon = option.icon
          const active = () => Object.is(props.value, option.value)
          return (
            <button
              type="button"
              aria-pressed={active()}
              onClick={() => props.onChange(option.value)}
              class={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                active() ? "bg-surface-muted text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {Icon ? <Icon class="w-3.5 h-3.5" /> : null}
              {option.label}
            </button>
          )
        }}
      </For>
    </fieldset>
  )
}
