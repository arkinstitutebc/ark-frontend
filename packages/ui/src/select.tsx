import { Check, ChevronDown } from "lucide-solid"
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
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
  const baseId = createUniqueId()
  const optionId = (i: number) => `${props.id ?? baseId}-option-${i}`
  const listboxId = `${props.id ?? baseId}-listbox`
  let containerRef: HTMLDivElement | undefined
  let triggerRef: HTMLButtonElement | undefined
  let listboxRef: HTMLDivElement | undefined

  function close(returnFocus = true) {
    setOpen(false)
    if (returnFocus) triggerRef?.focus()
  }

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
    // Scroll the highlighted option into view next tick. Guard for SSR.
    if (typeof window === "undefined") return
    queueMicrotask(() => {
      listboxRef?.querySelector<HTMLElement>('[data-highlighted="true"]')?.scrollIntoView({
        block: "nearest",
      })
    })
  })

  function commit(idx: number) {
    const opt = props.options[idx]
    if (!opt || opt.disabled) return
    props.onChange(opt.value)
    close()
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
      close()
    }
  }

  function onContainerFocusOut(e: FocusEvent) {
    // Close when focus moves out of the entire control (e.g. user pressed Tab).
    // The relatedTarget is the next focused element; if it's outside the
    // container, close. If null (focus lost entirely), also close.
    const next = e.relatedTarget as Node | null
    if (!containerRef) return
    if (!next || !containerRef.contains(next)) {
      // Don't return focus on Tab-out — that would fight the user's intent.
      setOpen(false)
    }
  }

  onMount(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        // Don't return focus on outside click — focus should follow what the
        // user clicked.
        setOpen(false)
      }
    }
    document.addEventListener("click", onClickOutside)
    onCleanup(() => document.removeEventListener("click", onClickOutside))
  })

  return (
    <div
      ref={containerRef}
      class={`relative ${props.class ?? ""}`}
      onFocusOut={onContainerFocusOut}
    >
      <button
        ref={triggerRef}
        type="button"
        id={props.id}
        role="combobox"
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open()}
        aria-label={props.ariaLabel}
        aria-activedescendant={open() && highlight() >= 0 ? optionId(highlight()) : undefined}
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
          id={listboxId}
          role="listbox"
          tabindex="-1"
          class="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto"
        >
          <For each={props.options}>
            {(opt, i) => {
              const isSelected = () => Object.is(opt.value, props.value)
              const isHighlighted = () => highlight() === i()
              return (
                // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled at trigger via aria-activedescendant pattern
                // biome-ignore lint/a11y/useFocusableInteractive: focus stays on trigger; aria-activedescendant conveys highlighted option
                <div
                  id={optionId(i())}
                  role="option"
                  aria-selected={isSelected()}
                  aria-disabled={opt.disabled}
                  data-highlighted={isHighlighted()}
                  onMouseEnter={() => !opt.disabled && setHighlight(i())}
                  onClick={() => commit(i())}
                  class={`px-4 py-2 text-sm flex items-center justify-between gap-2 ${
                    opt.disabled
                      ? "text-muted cursor-not-allowed"
                      : isHighlighted()
                        ? "bg-surface-muted text-foreground cursor-pointer"
                        : "text-foreground hover:bg-surface-muted cursor-pointer"
                  }`}
                >
                  <span class="truncate">{opt.label}</span>
                  {isSelected() && <Check class="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </div>
              )
            }}
          </For>
        </div>
      </Show>
    </div>
  )
}
