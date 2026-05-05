import { type NavItem, Sidebar as SharedSidebar } from "@ark/ui"
import { Folder, GraduationCap, Users } from "lucide-solid"

const navItems: NavItem[] = [
  { id: "batches", label: "Batches", href: "/", icon: Folder },
  { id: "students", label: "Students", href: "/students", icon: Users },
]

const isActive = (item: NavItem, currentPath: string) => {
  if (item.href === "/") return currentPath === "/" || currentPath.startsWith("/batch")
  return currentPath.startsWith(item.href)
}

export function Sidebar() {
  return (
    <SharedSidebar
      brandIcon={GraduationCap}
      brandTitle="Training"
      brandSubtitle="Batches & Enrollments"
      navItems={navItems}
      isActive={isActive}
    />
  )
}
