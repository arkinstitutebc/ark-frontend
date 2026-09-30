import { useCurrentUser } from "@ark/api-client"
import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { CalendarCheck, ClipboardList, FileText, HelpCircle, Package } from "lucide-solid"
import { createMemo } from "solid-js"

const navItems: NavItem[] = [
  { id: "stock", label: "Tools & Equipment", href: "/", icon: Package },
  { id: "monthly", label: "Monthly Checklists", href: "/monthly", icon: CalendarCheck },
  { id: "count", label: "Stock Take", href: "/count", icon: ClipboardList },
  { id: "movements", label: "Movements", href: "/movements", icon: FileText },
  { id: "tutorials", label: "How To", href: "/tutorials", icon: HelpCircle },
]

export function Sidebar() {
  const userQuery = useCurrentUser()
  const visibleItems = createMemo(() => {
    if (userQuery.data?.role === "trainer") {
      return navItems.filter(item => item.id !== "count")
    }
    return navItems
  })

  return (
    <SharedSidebar
      brandIcon={Package}
      brandTitle="Inventory"
      brandSubtitle="Toolkeeping"
      navItems={visibleItems()}
    />
  )
}
