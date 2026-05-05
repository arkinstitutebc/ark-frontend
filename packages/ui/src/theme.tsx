import {
  createContext,
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
  if (typeof window === "undefined") return "auto"
  const v = window.localStorage.getItem(STORAGE_KEY)
  if (v === "light" || v === "dark" || v === "auto") return v
  return "auto"
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

  // Sync data-theme attribute with effective theme; runs on mount + whenever it changes.
  onMount(() => {
    applyDataTheme(effective())

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener("change", onChange)
    onCleanup(() => mq.removeEventListener("change", onChange))
  })

  // Re-apply attribute whenever effective theme changes after mount.
  // (createMemo + applyDataTheme call inside an effect-style accessor keeps it reactive.)
  const _trackEffective = createMemo(() => {
    if (typeof document !== "undefined") applyDataTheme(effective())
    return effective()
  })

  const setTheme = (pref: ThemePreference) => {
    setPreference(pref)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, pref)
    }
  }

  return (
    <ThemeContext.Provider value={{ preference, effective: _trackEffective, setTheme }}>
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
 * Inline script that sets `data-theme` BEFORE first paint to avoid a flash
 * of light when the user's preference is dark.
 *
 * Usage: render in <head> via Vike's +Head.tsx:
 *   <script innerHTML={NO_FOUC_SCRIPT} />
 */
export const NO_FOUC_SCRIPT = `
(function(){
  try {
    var p = localStorage.getItem('ark-theme');
    var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var t = (p === 'light' || p === 'dark') ? p : (sysDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`.trim()
