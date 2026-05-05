import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { Receipt, TrendingUp } from "lucide-solid"

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: TrendingUp },
  { id: "receivables", label: "Receivables", href: "/receivables", icon: Receipt },
]

export function Sidebar() {
  return (
    <SharedSidebar
      brandIcon={Receipt}
      brandTitle="Billing"
      brandSubtitle="TESDA Receivables"
      navItems={navItems}
    />
  )
}
