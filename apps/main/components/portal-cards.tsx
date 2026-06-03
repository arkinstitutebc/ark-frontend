import { hasPortalAccess, type PortalKey, type UserRole } from "@ark/api-client"
import { For } from "solid-js"
import { PortalIcons, UI } from "./ui"

export type { UserRole } from "@ark/api-client"

export interface PortalCard {
  key: PortalKey
  title: string
  description: string
  icon: keyof typeof PortalIcons
  url: string
  badge?: string
}

interface PortalCardsProps {
  userRole?: UserRole
  portals?: PortalCard[]
}

const allPortals: PortalCard[] = [
  {
    key: "training",
    title: "Training",
    description: "Create batches and assign students",
    icon: "batches",
    url: import.meta.env.VITE_TRAINING_PORTAL_URL || "https://training.arkinstitutebc.com",
  },
  {
    key: "procurement",
    title: "Procurement",
    description: "PR → PO approval and tracking",
    icon: "procurement",
    url: import.meta.env.VITE_PROCUREMENT_PORTAL_URL || "https://procurement.arkinstitutebc.com",
  },
  {
    key: "inventory",
    title: "Inventory",
    description: "Receive goods and track stock",
    icon: "inventory",
    url: import.meta.env.VITE_INVENTORY_PORTAL_URL || "https://inventory.arkinstitutebc.com",
  },
  {
    key: "finance",
    title: "Finance",
    description: "Track costs per batch and budgets",
    icon: "finance",
    url: import.meta.env.VITE_FINANCE_PORTAL_URL || "https://finance.arkinstitutebc.com",
  },
  {
    key: "hr",
    title: "HR & Payroll",
    description: "Trainer hours and payroll processing",
    icon: "hr",
    url: import.meta.env.VITE_HR_PORTAL_URL || "https://hr.arkinstitutebc.com",
  },
  {
    key: "billing",
    title: "Billing",
    description: "Manual TESDA billing statements",
    icon: "billing",
    url: import.meta.env.VITE_BILLING_PORTAL_URL || "https://billing.arkinstitutebc.com",
  },
]

export function PortalCards(props: PortalCardsProps) {
  const visiblePortals = () => {
    const portalList = props.portals || allPortals
    return portalList.filter(portal => hasPortalAccess(props.userRole, portal.key))
  }

  const IconComponent = PortalIcons
  const cardClass = () =>
    visiblePortals().length <= 3
      ? "group block min-h-[15rem] bg-surface rounded-2xl shadow-lg p-7 border border-border hover:shadow-xl hover:border-primary/30 transition-all"
      : "group block bg-surface rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl hover:border-primary/30 transition-all"

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <For each={visiblePortals()}>
        {portal => {
          const Icon = IconComponent[portal.icon]
          return (
            <a href={portal.url} class={cardClass()}>
              <div class="flex items-start justify-between mb-5">
                <div class="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Icon class="w-8 h-8 text-primary" />
                </div>
                {portal.badge && (
                  <span class="px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                    {portal.badge}
                  </span>
                )}
              </div>

              <h3 class="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {portal.title}
              </h3>

              <p class="text-sm text-muted mt-1.5">{portal.description}</p>

              <div class="flex items-center gap-2 mt-5 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                <span>Open portal</span>
                <UI.arrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          )
        }}
      </For>
    </div>
  )
}
