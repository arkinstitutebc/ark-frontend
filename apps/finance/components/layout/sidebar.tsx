import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import {
  ArrowLeftRight,
  FileText,
  HelpCircle,
  Landmark,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-solid"

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", href: "/", icon: TrendingUp },
  { id: "banks", label: "Two-Bank", href: "/banks", icon: Landmark },
  { id: "transfers", label: "Transfers", href: "/transfers", icon: ArrowLeftRight },
  { id: "disbursements", label: "Disbursements", href: "/disbursements", icon: Receipt },
  { id: "pnl", label: "P&L Report", href: "/pnl", icon: FileText },
  { id: "tutorials", label: "How To", href: "/tutorials", icon: HelpCircle },
]

export function Sidebar() {
  return (
    <SharedSidebar
      brandIcon={Wallet}
      brandTitle="Finance"
      brandSubtitle="Two-Bank & P&L"
      navItems={navItems}
    />
  )
}
