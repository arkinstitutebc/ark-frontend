import { Select, tonePillClass } from "@ark/ui"
import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { Icons } from "@/components/ui"

export function SettingsStatCard(props: { label: string; value: number }) {
  return (
    <div class="bg-surface border border-border rounded-lg px-4 py-3">
      <p class="text-xs text-muted">{props.label}</p>
      <p class="text-2xl font-semibold text-foreground tabular-nums mt-1">{props.value}</p>
    </div>
  )
}

export function SettingsPanelHeader(props: {
  title: string
  hint: string
  actionLabel?: string
  onAction?: () => void
  trailing?: JSX.Element
}) {
  return (
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4">
      <div>
        <h2 class="text-base font-semibold text-foreground">{props.title}</h2>
        <p class="text-xs text-muted mt-0.5">{props.hint}</p>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <Show when={props.trailing}>{props.trailing}</Show>
        <Show when={props.actionLabel && props.onAction}>
          <button
            type="button"
            onClick={props.onAction}
            class="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Icons.plus class="w-4 h-4" /> {props.actionLabel}
          </button>
        </Show>
      </div>
    </div>
  )
}

export function SettingsSearchInput(props: {
  value: string
  onInput: (value: string) => void
  placeholder: string
}) {
  return (
    <input
      type="search"
      value={props.value}
      onInput={e => props.onInput(e.currentTarget.value)}
      placeholder={props.placeholder}
      class="w-full sm:w-64 px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
    />
  )
}

export function SettingsEmptyRow(props: { colSpan: number; title: string; detail?: string }) {
  return (
    <tr class="border-t border-border">
      <td colSpan={props.colSpan} class="px-4 py-10 text-center">
        <p class="text-sm font-medium text-foreground">{props.title}</p>
        <Show when={props.detail}>
          <p class="text-xs text-muted mt-1">{props.detail}</p>
        </Show>
      </td>
    </tr>
  )
}

export function SettingsModalForm(props: { onSubmit: (e: Event) => void; children: JSX.Element }) {
  return (
    <form onSubmit={props.onSubmit} class="space-y-4">
      {props.children}
    </form>
  )
}

export function SettingsFormSection(props: {
  title: string
  description?: string
  children: JSX.Element
}) {
  return (
    <section class="rounded-lg border border-border bg-surface-muted/40 p-4">
      <div class="mb-3">
        <h3 class="text-sm font-semibold text-foreground">{props.title}</h3>
        <Show when={props.description}>
          <p class="text-xs text-muted mt-0.5">{props.description}</p>
        </Show>
      </div>
      <div class="space-y-3">{props.children}</div>
    </section>
  )
}

export function SettingsFormGrid(props: { children: JSX.Element; columns?: "two" | "three" }) {
  return (
    <div
      class={
        props.columns === "three"
          ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
          : "grid grid-cols-1 sm:grid-cols-2 gap-3"
      }
    >
      {props.children}
    </div>
  )
}

export function SettingsStickyFooter(props: { children: JSX.Element }) {
  return (
    <div class="sticky bottom-0 -mx-6 -mb-5 bg-surface px-6 pb-5 pt-3 border-t border-border">
      {props.children}
    </div>
  )
}

export function SettingsStatusPill(props: { active: boolean }) {
  return (
    <Show
      when={props.active}
      fallback={
        <span class={`text-xs px-2 py-0.5 rounded ${tonePillClass("negative")}`}>Inactive</span>
      }
    >
      <span class={`text-xs px-2 py-0.5 rounded ${tonePillClass("positive")}`}>Active</span>
    </Show>
  )
}

export function SettingsRowButton(props: {
  onClick: () => void
  children: JSX.Element
  tone?: "default" | "danger"
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
        props.tone === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted hover:text-primary hover:bg-surface-muted"
      }`}
    >
      {props.children}
    </button>
  )
}

export function SettingsTextField(props: {
  label: string
  value: string
  onInput: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <label class="grid gap-1">
      <span class="text-sm font-medium text-foreground">{props.label}</span>
      <input
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        placeholder={props.placeholder}
        required={props.required}
        disabled={props.disabled}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-muted"
      />
    </label>
  )
}

export function SettingsNumberField(props: {
  label: string
  value: number
  onInput: (value: number) => void
}) {
  return (
    <label class="grid gap-1">
      <span class="text-sm font-medium text-foreground">{props.label}</span>
      <input
        type="number"
        value={props.value}
        onInput={e => props.onInput(Number(e.currentTarget.value) || 0)}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </label>
  )
}

export function SettingsTextArea(props: {
  label: string
  value: string
  onInput: (value: string) => void
}) {
  return (
    <label class="grid gap-1">
      <span class="text-sm font-medium text-foreground">{props.label}</span>
      <textarea
        rows={2}
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </label>
  )
}

export function SettingsSelectField(props: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <div>
      <span class="block text-sm font-medium text-foreground mb-1">{props.label}</span>
      <Select
        options={props.options}
        value={props.value}
        onChange={props.onChange}
        ariaLabel={props.label}
      />
    </div>
  )
}

export function SettingsCheckbox(props: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <label class="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={e => props.onChange(e.currentTarget.checked)}
      />
      <span class="text-foreground">{props.label ?? "Active"}</span>
    </label>
  )
}
