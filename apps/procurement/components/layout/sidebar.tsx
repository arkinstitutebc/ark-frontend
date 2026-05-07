import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { CheckCircle, HelpCircle, ShoppingBag, ShoppingCart } from "lucide-solid"

const navItems: NavItem[] = [
  { id: "requests", label: "Requests", href: "/", icon: ShoppingCart },
  { id: "orders", label: "Orders", href: "/orders", icon: ShoppingBag },
  { id: "approvals", label: "Approvals", href: "/approvals", icon: CheckCircle },
  { id: "tutorials", label: "How To", href: "/tutorials", icon: HelpCircle },
]

const isActive = (item: NavItem, currentPath: string) => {
  if (item.href === "/") return currentPath === "/" || currentPath.startsWith("/pr")
  return currentPath.startsWith(item.href)
}

export function Sidebar() {
  return (
    <SharedSidebar
      brandIcon={ShoppingCart}
      brandTitle="Procurement"
      brandSubtitle="Requests & Orders"
      navItems={navItems}
      isActive={isActive}
    />
  )
}
