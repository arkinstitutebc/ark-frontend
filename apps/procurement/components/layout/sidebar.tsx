import { useCurrentUser } from "@ark/api-client"
import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import {
  CheckCircle,
  FileCheck2,
  HelpCircle,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  WalletCards,
} from "lucide-solid"
import { createMemo } from "solid-js"

const navItems: NavItem[] = [
  { id: "requests", label: "Requests", href: "/", icon: ShoppingCart },
  { id: "cash-voucher", label: "Cash Voucher", href: "/cash-voucher", icon: WalletCards },
  { id: "orders", label: "Purchase Orders", href: "/orders", icon: ShoppingBag },
  { id: "liquidation", label: "Finance / Liquidation", href: "/liquidation", icon: FileCheck2 },
  { id: "approvals", label: "Approvals", href: "/approvals", icon: CheckCircle },
  {
    id: "expense-settings",
    label: "Expense Settings",
    href: "/expense-settings",
    icon: SlidersHorizontal,
  },
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
      return navItems.filter(item => !["orders", "approvals", "liquidation"].includes(item.id))
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
