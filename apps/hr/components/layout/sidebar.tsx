import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { Clock, CreditCard, Users } from "lucide-solid"

const navItems: NavItem[] = [
  { id: "trainers", label: "Trainers", href: "/", icon: Users },
  { id: "attendance", label: "Attendance", href: "/attendance", icon: Clock },
  { id: "payroll", label: "Payroll", href: "/payroll", icon: CreditCard },
]

export function Sidebar() {
  return (
    <SharedSidebar
      brandIcon={Users}
      brandTitle="HR & Payroll"
      brandSubtitle="Trainers & Compensation"
      navItems={navItems}
    />
  )
}
