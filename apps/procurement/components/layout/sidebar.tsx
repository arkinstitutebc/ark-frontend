import { CheckCircle, ShoppingBag, ShoppingCart } from "lucide-solid"
import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"

const navItems: NavItem[] = [
  { id: "requests", label: "Requests", href: "/", icon: ShoppingCart },
  { id: "orders", label: "Orders", href: "/orders", icon: ShoppingBag },
  { id: "approvals", label: "Approvals", href: "/approvals", icon: CheckCircle },
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
