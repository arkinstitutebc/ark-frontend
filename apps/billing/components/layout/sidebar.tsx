import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { HelpCircle, Receipt, TrendingUp } from "lucide-solid"

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: TrendingUp },
  { id: "receivables", label: "Receivables", href: "/receivables", icon: Receipt },
  { id: "tutorials", label: "How To", href: "/tutorials", icon: HelpCircle },
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
