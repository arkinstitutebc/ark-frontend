import { Check, ChevronDown } from "lucide-solid"
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js"

export interface SelectOption<T> {
  label: string
  value: T
  disabled?: boolean
}

export interface SelectProps<T> {
  options: SelectOption<T>[]
  value: T | undefined
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  class?: string
  id?: string
  /** aria-label fallback when no <label htmlFor> wires up */
  ariaLabel?: string
}

/**
 * Themed accessible Select. Keyboard: ArrowUp/Down to move highlight,
 * Enter/Space to select, Escape to close, Tab to leave naturally.
 *
 * Design notes (per project SOP):
 *   - `<Show when={accessor}>` only with boolean conditions; no value-passing
 *     keyed render-fns inside (which would trip the hydration template bug).
 *   - All `window.*` / `document.*` access is in `onMount`.
 *   - Icons via lucide-solid Component refs, never JSX-as-prop.
 */
export function Select<T>(props: SelectProps<T>): JSX.Element {
  const [open, setOpen] = createSignal(false)
  const [highlight, setHighlight] = createSignal(-1)
  let containerRef: HTMLDivElement | undefined
  let listboxRef: HTMLDivElement | undefined

  const selectedOption = createMemo(
    () => props.options.find(o => Object.is(o.value, props.value)) ?? null
  )
  const selectedLabel = () => selectedOption()?.label ?? ""
  const placeholder = () => props.placeholder ?? "Select…"

  // When the listbox opens, jump highlight to the selected option (or first).
  createEffect(() => {
    if (!open()) return
    const idx = props.options.findIndex(o => Object.is(o.value, props.value))
    setHighlight(idx >= 0 ? idx : 0)
    // Scroll the highlighted option into view next tick.
    queueMicrotask(() => {
      listboxRef?.querySelector<HTMLLIElement>('[data-highlighted="true"]')?.scrollIntoView({
        block: "nearest",
      })
    })
  })

  function commit(idx: number) {
    const opt = props.options[idx]
    if (!opt || opt.disabled) return
    props.onChange(opt.value)
    setOpen(false)
  }

  function nextEnabled(from: number, dir: 1 | -1): number {
    const n = props.options.length
    if (n === 0) return -1
    let i = from
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!props.options[i]?.disabled) return i
    }
    return -1
  }

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (props.disabled) return
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open()) {
        setOpen(true)
        return
      }
      const next = nextEnabled(highlight(), e.key === "ArrowDown" ? 1 : -1)
      if (next >= 0) setHighlight(next)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!open()) {
        setOpen(true)
      } else if (highlight() >= 0) {
        commit(highlight())
      }
    } else if (e.key === "Escape" && open()) {
      e.preventDefault()
      setOpen(false)
    }
  }

  onMount(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("click", onClickOutside)
    onCleanup(() => document.removeEventListener("click", onClickOutside))
  })

  return (
    <div ref={containerRef} class={`relative ${props.class ?? ""}`}>
      <button
        type="button"
        id={props.id}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-label={props.ariaLabel}
        onClick={() => !props.disabled && setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
        class="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-lg text-left flex items-center justify-between gap-2 transition-colors focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary disabled:bg-surface-muted disabled:cursor-not-allowed disabled:text-muted"
      >
        <span class={`truncate ${selectedOption() ? "" : "text-muted"}`}>
          {selectedOption() ? selectedLabel() : placeholder()}
        </span>
        <ChevronDown
          class={`w-4 h-4 flex-shrink-0 text-muted transition-transform ${open() ? "rotate-180" : ""}`}
        />
      </button>

      <Show when={open()}>
        <div
          ref={listboxRef}
          role="listbox"
          tabindex="-1"
          class="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto"
        >
          <For each={props.options}>
            {(opt, i) => {
              const isSelected = () => Object.is(opt.value, props.value)
              const isHighlighted = () => highlight() === i()
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected()}
                  aria-disabled={opt.disabled}
                  data-highlighted={isHighlighted()}
                  disabled={opt.disabled}
                  onMouseEnter={() => !opt.disabled && setHighlight(i())}
                  onClick={() => commit(i())}
                  class={`w-full px-4 py-2 text-sm flex items-center justify-between gap-2 text-left ${
                    opt.disabled
                      ? "text-muted cursor-not-allowed"
                      : isHighlighted()
                        ? "bg-surface-muted text-foreground"
                        : "text-foreground hover:bg-surface-muted"
                  }`}
                >
                  <span class="truncate">{opt.label}</span>
                  {isSelected() && <Check class="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              )
            }}
          </For>
        </div>
      </Show>
    </div>
  )
}
