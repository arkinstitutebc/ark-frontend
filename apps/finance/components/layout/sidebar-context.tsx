import { createContext, createSignal, type JSX, useContext } from "solid-js"

interface SidebarContextValue {
  collapsed: () => boolean
  toggleCollapsed: () => void
  mobileOpen: () => boolean
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue>()

export function SidebarProvider(props: { children: JSX.Element }) {
  const stored = typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null
  const [collapsed, setCollapsed] = createSignal(stored === "true")
  const [mobileOpen, setMobileOpen] = createSignal(false)

  const toggleCollapsed = () => {
    const next = !collapsed()
    setCollapsed(next)
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", String(next))
    }
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed, mobileOpen, setMobileOpen }}>
      {props.children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider")
  return ctx
}
