import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import {
  BookOpen,
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
  { id: "overview", label: "Overview", href: "/", icon: TrendingUp },
  { id: "banks", label: "Banks & Transfers", href: "/banks", icon: Landmark },
  { id: "disbursements", label: "Disbursements", href: "/disbursements", icon: Receipt },
  { id: "reimbursements", label: "Reimbursements", href: "/reimbursements", icon: HandCoins },
  {
    id: "rr-approvals",
    label: "RR Approvals",
    href: "/reimbursements/approvals",
    icon: ListChecks,
  },
  { id: "pnl", label: "P&L Report", href: "/pnl", icon: FileText },
  {
    id: "income-statement",
    label: "Income Statement",
    href: "/income-statement",
    icon: FileText,
  },
  { id: "assets", label: "Assets", href: "/assets", icon: Package },
  { id: "gl-accounts", label: "GL Accounts", href: "/gl-accounts", icon: BookOpen },
  { id: "settings", label: "Settings", href: "/settings", icon: SlidersHorizontal },
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
