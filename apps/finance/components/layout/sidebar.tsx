import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import {
  FileText,
  HandCoins,
  HelpCircle,
  Landmark,
  ListChecks,
  Package,
  Receipt,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
} from "lucide-solid"

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", href: "/", icon: TrendingUp, section: "Workspace" },
  {
    id: "banks",
    label: "Banks & Transfers",
    href: "/banks",
    icon: Landmark,
    section: "Operations",
  },
  {
    id: "disbursements",
    label: "Disbursements",
    href: "/disbursements",
    icon: Receipt,
    section: "Operations",
  },
  {
    id: "reimbursements",
    label: "Reimbursements",
    href: "/reimbursements",
    icon: HandCoins,
    section: "Operations",
  },
  {
    id: "rr-approvals",
    label: "RR Approvals",
    href: "/reimbursements/approvals",
    icon: ListChecks,
    section: "Operations",
  },
  { id: "pnl", label: "P&L Report", href: "/pnl", icon: FileText, section: "Reports" },
  {
    id: "income-statement",
    label: "Income Statement",
    href: "/income-statement",
    icon: FileText,
    section: "Reports",
  },
  { id: "assets", label: "Assets", href: "/assets", icon: Package, section: "Reports" },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: SlidersHorizontal,
    section: "Admin",
  },
  { id: "tutorials", label: "How To", href: "/tutorials", icon: HelpCircle, section: "Admin" },
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
