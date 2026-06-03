import { useCurrentUser } from "@ark/api-client"
import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { CheckCircle, HelpCircle, ShoppingBag, ShoppingCart } from "lucide-solid"
import { createMemo } from "solid-js"

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
  const userQuery = useCurrentUser()
  const visibleItems = createMemo(() => {
    if (userQuery.data?.role === "trainer") {
      return navItems.filter(item => item.id !== "orders" && item.id !== "approvals")
    }
    return navItems
  })

  return (
    <SharedSidebar
      brandIcon={ShoppingCart}
      brandTitle="Procurement"
      brandSubtitle="Requests & Orders"
      navItems={visibleItems()}
      isActive={isActive}
    />
  )
}
