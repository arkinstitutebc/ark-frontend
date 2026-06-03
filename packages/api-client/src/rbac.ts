export const userRoles = ["admin", "director", "trainer"] as const

export type UserRole = (typeof userRoles)[number]

export type PortalKey =
  | "training"
  | "procurement"
  | "inventory"
  | "finance"
  | "hr"
  | "billing"
  | "learning"
  | "adminUsers"
  | "adminPosts"

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  director: "Director",
  trainer: "Trainer",
}

export const roleAccessSummary: Record<UserRole, string> = {
  admin: "Full portal access, user management, blog posts, finance, billing, HR, and operations.",
  director: "Operations, finance, billing, and HR access without admin user or site management.",
  trainer: "Training, purchase requests, inventory viewing, and Learning Hub access.",
}

export const portalAccess = {
  training: ["admin", "director", "trainer"],
  procurement: ["admin", "director", "trainer"],
  inventory: ["admin", "director", "trainer"],
  finance: ["admin", "director"],
  hr: ["admin", "director"],
  billing: ["admin", "director"],
  learning: ["admin", "director", "trainer"],
  adminUsers: ["admin"],
  adminPosts: ["admin"],
} as const satisfies Record<PortalKey, readonly UserRole[]>

export function isUserRole(role: string | undefined | null): role is UserRole {
  return !!role && (userRoles as readonly string[]).includes(role)
}

export function hasPortalAccess(role: UserRole | undefined, portal: PortalKey): boolean {
  return !!role && (portalAccess[portal] as readonly UserRole[]).includes(role)
}

export function portalAccessLabels(role: UserRole): string[] {
  const labels: Record<PortalKey, string> = {
    training: "Training",
    procurement: "Procurement",
    inventory: "Inventory",
    finance: "Finance",
    hr: "HR & Payroll",
    billing: "Billing",
    learning: "Learning Hub",
    adminUsers: "User Management",
    adminPosts: "Blog Posts",
  }
  return Object.entries(portalAccess)
    .filter(([, roles]) => (roles as readonly UserRole[]).includes(role))
    .map(([key]) => labels[key as PortalKey])
}
