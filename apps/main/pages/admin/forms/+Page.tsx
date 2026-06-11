import { useCurrentUser } from "@ark/api-client"
import { BackLink, Icons, PageLoading } from "@ark/ui"
import { createEffect, For, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

const portalUrls = {
  procurement:
    import.meta.env.VITE_PROCUREMENT_PORTAL_URL || "https://procurement.arkinstitutebc.com",
  finance: import.meta.env.VITE_FINANCE_PORTAL_URL || "https://finance.arkinstitutebc.com",
  billing: import.meta.env.VITE_BILLING_PORTAL_URL || "https://billing.arkinstitutebc.com",
  hr: import.meta.env.VITE_HR_PORTAL_URL || "https://hr.arkinstitutebc.com",
  training: import.meta.env.VITE_TRAINING_PORTAL_URL || "https://training.arkinstitutebc.com",
}

type FormLink = {
  title: string
  detail: string
  href: string
  badge: string
}

const formGroups: Array<{ title: string; description: string; items: FormLink[] }> = [
  {
    title: "Procurement",
    description: "Requests and release documents used before cash or goods move.",
    items: [
      {
        title: "Petty Cash Request",
        detail: "Blank request form for staff cash releases.",
        href: `${portalUrls.procurement}/petty-cash/new`,
        badge: "Blank",
      },
      {
        title: "Petty Cash Voucher",
        detail: "Generated from a petty cash request detail page.",
        href: `${portalUrls.procurement}/petty-cash`,
        badge: "Generated",
      },
      {
        title: "Purchase Request",
        detail: "Create PRs; printable PDF is available from the request record.",
        href: `${portalUrls.procurement}/pr/create`,
        badge: "Blank + PDF",
      },
      {
        title: "Purchase Order",
        detail: "Generated from approved PRs and PO records.",
        href: `${portalUrls.procurement}/orders`,
        badge: "Generated",
      },
    ],
  },
  {
    title: "Finance",
    description: "Cash movements, vouchers, reimbursements, and financial reports.",
    items: [
      {
        title: "Check Voucher",
        detail: "Generated from a finance disbursement record.",
        href: `${portalUrls.finance}/disbursements`,
        badge: "Generated",
      },
      {
        title: "Reimbursement Request",
        detail: "Claim form and printable reimbursement PDF.",
        href: `${portalUrls.finance}/reimbursements`,
        badge: "Blank + PDF",
      },
      {
        title: "P&L Report",
        detail: "Printable report from the Finance P&L page.",
        href: `${portalUrls.finance}/pnl`,
        badge: "Report",
      },
      {
        title: "Income Statement",
        detail: "Segmented income statement PDF and exports.",
        href: `${portalUrls.finance}/income-statement`,
        badge: "Report",
      },
    ],
  },
  {
    title: "Billing, HR, and Training",
    description: "Operational forms used for students, collections, and payroll records.",
    items: [
      {
        title: "Billing Statement",
        detail: "Generated from billing receivable records.",
        href: `${portalUrls.billing}/receivables`,
        badge: "Generated",
      },
      {
        title: "Payroll Summary",
        detail: "Generated from HR payroll periods.",
        href: `${portalUrls.hr}/payroll`,
        badge: "Generated",
      },
      {
        title: "Batch Setup",
        detail: "Create batches with schedule, RQM, venue, and trainer details.",
        href: `${portalUrls.training}/`,
        badge: "Blank",
      },
      {
        title: "Student Profile",
        detail: "Student records, documents, and profile updates.",
        href: `${portalUrls.training}/students`,
        badge: "Blank",
      },
    ],
  },
]

export default function AdminFormsPage() {
  const userQuery = useCurrentUser()

  createEffect(() => {
    if (typeof window === "undefined") return
    if (userQuery.isError) {
      window.location.href = "/login"
      return
    }
    if (userQuery.data && userQuery.data.role !== "admin") {
      window.location.href = "/"
    }
  })

  const isAdmin = () => userQuery.data?.role === "admin"

  return (
    <div class="flex min-h-screen flex-col bg-surface-muted">
      <Show when={!userQuery.isPending && isAdmin()} fallback={<PageLoading />}>
        <Navbar
          userName={`${userQuery.data?.firstName ?? ""} ${userQuery.data?.lastName ?? ""}`.trim()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div class="mx-auto mt-4 max-w-6xl">
            <div class="mb-6">
              <div class="mb-2">
                <BackLink href="/">Dashboard</BackLink>
              </div>
              <h1 class="text-2xl font-bold text-foreground">Forms</h1>
              <p class="mt-0.5 text-sm text-muted">
                Open blank workflows and generated printable forms from one admin view.
              </p>
            </div>

            <div class="grid gap-5">
              <For each={formGroups}>
                {group => (
                  <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div class="border-b border-border px-5 py-4 sm:px-6">
                      <div class="flex items-start gap-3">
                        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icons.fileText class="h-5 w-5" />
                        </span>
                        <div>
                          <h2 class="text-base font-semibold text-foreground">{group.title}</h2>
                          <p class="text-sm text-muted">{group.description}</p>
                        </div>
                      </div>
                    </div>
                    <div class="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                      <For each={group.items}>
                        {item => (
                          <a
                            href={item.href}
                            class="group min-h-36 bg-surface p-5 transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            <div class="flex items-start justify-between gap-3">
                              <h3 class="font-semibold text-foreground group-hover:text-primary">
                                {item.title}
                              </h3>
                              <span class="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                                {item.badge}
                              </span>
                            </div>
                            <p class="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
                            <div class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                              Open
                              <Icons.arrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </a>
                        )}
                      </For>
                    </div>
                  </section>
                )}
              </For>
            </div>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
