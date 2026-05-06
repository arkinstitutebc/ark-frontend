import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  useContext,
} from "solid-js"

export type ThemePreference = "light" | "dark" | "auto"
export type EffectiveTheme = "light" | "dark"

const STORAGE_KEY = "ark-theme"

interface ThemeContextValue {
  preference: () => ThemePreference
  effective: () => EffectiveTheme
  setTheme: (pref: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue>()

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "light"
  const v = window.localStorage.getItem(STORAGE_KEY)
  if (v === "light" || v === "dark" || v === "auto") return v
  return "light"
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function resolveEffective(pref: ThemePreference, systemDark: boolean): EffectiveTheme {
  if (pref === "auto") return systemDark ? "dark" : "light"
  return pref
}

function applyDataTheme(theme: EffectiveTheme): void {
  if (typeof document === "undefined") return
  document.documentElement.setAttribute("data-theme", theme)
}

export function ThemeProvider(props: { children: JSX.Element }) {
  const [preference, setPreference] = createSignal<ThemePreference>(readStoredPreference())
  const [systemDark, setSystemDark] = createSignal<boolean>(systemPrefersDark())

  const effective = createMemo<EffectiveTheme>(() => resolveEffective(preference(), systemDark()))

  // Subscribe to OS color-scheme changes so `auto` mode flips live.
  onMount(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener("change", onChange)
    onCleanup(() => mq.removeEventListener("change", onChange))
  })

  // Reactive DOM side effect: keep <html data-theme> in sync with the effective theme.
  // (The no-FOUC inline script in +Head.tsx already set the initial value before paint.)
  createEffect(() => {
    if (typeof document !== "undefined") applyDataTheme(effective())
  })

  const setTheme = (pref: ThemePreference) => {
    setPreference(pref)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, pref)
    }
  }

  return (
    <ThemeContext.Provider value={{ preference, effective, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

/**
 * Inline script that sets `data-theme` BEFORE first paint.
 * Default is light. Dark/auto are explicit opt-ins via the toggle.
 *
 * Usage: render in <head> via Vike's +Head.tsx:
 *   <script innerHTML={NO_FOUC_SCRIPT} />
 */
export const NO_FOUC_SCRIPT = `
(function(){
  try {
    var p = localStorage.getItem('ark-theme');
    var t = 'light';
    if (p === 'dark') t = 'dark';
    else if (p === 'auto') t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`.trim()
