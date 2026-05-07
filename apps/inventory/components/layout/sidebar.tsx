import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { Box, FileText, HelpCircle, Package } from "lucide-solid"

const navItems: NavItem[] = [
  { id: "stock", label: "Stock", href: "/", icon: Package },
  { id: "receiving", label: "Receiving", href: "/receiving", icon: Box },
  { id: "movements", label: "Movements", href: "/movements", icon: FileText },
  { id: "tutorials", label: "How To", href: "/tutorials", icon: HelpCircle },
]

export function Sidebar() {
  return (
    <SharedSidebar
      brandIcon={Package}
      brandTitle="Inventory"
      brandSubtitle="Stock & Receiving"
      navItems={navItems}
    />
  )
}
