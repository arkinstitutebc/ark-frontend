import type { JSX } from "solid-js"

interface TrainingFormPanelProps {
  title: string
  subtitle?: string
  children: JSX.Element
  class?: string
}

export function TrainingFormPanel(props: TrainingFormPanelProps) {
  return (
    <section class={`rounded-xl border border-border bg-surface p-3 ${props.class ?? ""}`}>
      <div class="mb-3">
        <h3 class="text-sm font-semibold text-foreground">{props.title}</h3>
        {props.subtitle && <p class="mt-1 text-xs text-muted">{props.subtitle}</p>}
      </div>
      {props.children}
    </section>
  )
}
