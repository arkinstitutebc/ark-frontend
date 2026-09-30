import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import {
  Banknote,
  CalendarDays,
  Clock,
  CreditCard,
  GraduationCap,
  HelpCircle,
  Users,
} from "lucide-solid"

const navItems: NavItem[] = [
  { id: "trainers", label: "Trainers", href: "/", icon: Users },
  { id: "employees", label: "Employees", href: "/employees", icon: GraduationCap },
  { id: "trainer-fees", label: "Trainer Fees", href: "/trainer-fees", icon: Banknote },
  { id: "cash-advances", label: "Cash Advances", href: "/cash-advances", icon: CreditCard },
  { id: "calendar", label: "Leave Calendar", href: "/calendar", icon: CalendarDays },
  { id: "attendance", label: "Attendance", href: "/attendance", icon: Clock },
  { id: "payroll", label: "Payroll", href: "/payroll", icon: CreditCard },
  { id: "tutorials", label: "How To", href: "/tutorials", icon: HelpCircle },
]

export function Sidebar() {
  return (
    <SharedSidebar
      brandIcon={Users}
      brandTitle="HR & Payroll"
      brandSubtitle="People & Compensation"
      navItems={navItems}
    />
  )
}
