import { Monitor, Moon, Sun } from "lucide-solid"
import { For } from "solid-js"
import { type ThemePreference, useTheme } from "./theme"
import { cn } from "./utils"

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "auto", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
]

export function ThemeToggle(props: { compact?: boolean }) {
  const { preference, setTheme } = useTheme()

  return (
    <fieldset class="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5">
      <legend class="sr-only">Theme</legend>
      <For each={OPTIONS}>
        {opt => {
          const active = () => preference() === opt.value
          return (
            <button
              type="button"
              aria-pressed={active()}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => setTheme(opt.value)}
              class={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                active()
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              )}
            >
              <opt.Icon class="w-3.5 h-3.5" />
              {!props.compact && <span class="hidden sm:inline">{opt.label}</span>}
            </button>
          )
        }}
      </For>
    </fieldset>
  )
}
