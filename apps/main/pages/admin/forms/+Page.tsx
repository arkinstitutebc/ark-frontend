import { useCurrentUser } from "@ark/api-client"
import { BackLink, Button, Icons, PageLoading } from "@ark/ui"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

const portalUrls = {
  procurement:
    import.meta.env.VITE_PROCUREMENT_PORTAL_URL || "https://procurement.arkinstitutebc.com",
  finance: import.meta.env.VITE_FINANCE_PORTAL_URL || "https://finance.arkinstitutebc.com",
  billing: import.meta.env.VITE_BILLING_PORTAL_URL || "https://billing.arkinstitutebc.com",
  hr: import.meta.env.VITE_HR_PORTAL_URL || "https://hr.arkinstitutebc.com",
  training: import.meta.env.VITE_TRAINING_PORTAL_URL || "https://training.arkinstitutebc.com",
}

type FormMode = "Blank workflow" | "Generated PDF" | "Report PDF"

type FormDocument = {
  key: string
  group: string
  title: string
  code: string
  mode: FormMode
  detail: string
  href: string
  actionLabel: string
  primaryFields: string[]
  lineItems?: string[]
  approvals?: string[]
  notes: string
}

const forms: FormDocument[] = [
  {
    key: "petty-cash-request",
    group: "Procurement",
    title: "Petty Cash Request",
    code: "PCR",
    mode: "Blank workflow",
    detail: "Staff request for small operating cash releases.",
    href: `${portalUrls.procurement}/petty-cash/new`,
    actionLabel: "Create request",
    primaryFields: [
      "Requested by",
      "Request date",
      "Purpose",
      "Amount requested",
      "Release method",
    ],
    lineItems: ["Supporting document or GCash QR", "Mobile / GCash number", "Account name"],
    approvals: ["Admin approval", "Release record", "Liquidation"],
    notes: "Real PDFs are generated after the request exists.",
  },
  {
    key: "petty-cash-voucher",
    group: "Procurement",
    title: "Petty Cash Voucher",
    code: "PCV",
    mode: "Generated PDF",
    detail: "Printable voucher from a petty cash request record.",
    href: `${portalUrls.procurement}/petty-cash`,
    actionLabel: "Open petty cash",
    primaryFields: ["Voucher no.", "Requested by", "Release method", "Amount", "Purpose"],
    lineItems: ["Mobile / GCash", "Account name", "Liquidation summary"],
    approvals: ["Prepared by", "Approved / Released by", "Received by"],
    notes: "Open a request, then use Open Voucher from the detail page.",
  },
  {
    key: "purchase-request",
    group: "Procurement",
    title: "Purchase Request",
    code: "PR",
    mode: "Blank workflow",
    detail: "Request goods or services before purchase order creation.",
    href: `${portalUrls.procurement}/pr/create`,
    actionLabel: "Create PR",
    primaryFields: ["Batch", "Category", "Date needed", "Purpose", "Requested by"],
    lineItems: ["Item", "Quantity", "Unit", "Unit price", "Total"],
    approvals: ["Requested by", "Coordinator review", "Management approval"],
    notes: "Printable PDF is generated from the saved PR record.",
  },
  {
    key: "purchase-order",
    group: "Procurement",
    title: "Purchase Order",
    code: "PO",
    mode: "Generated PDF",
    detail: "Supplier-facing purchase order generated from approved PRs.",
    href: `${portalUrls.procurement}/orders`,
    actionLabel: "Open POs",
    primaryFields: ["PO no.", "Supplier", "Related PR", "Order date", "Status"],
    lineItems: ["Item", "Quantity", "Unit", "Unit price", "Total"],
    approvals: ["Prepared by", "Approved by", "Received by"],
    notes: "Use the PO detail page to open the printable PDF.",
  },
  {
    key: "check-voucher",
    group: "Finance",
    title: "Check Voucher",
    code: "CV",
    mode: "Generated PDF",
    detail: "Finance voucher for disbursement transactions.",
    href: `${portalUrls.finance}/disbursements`,
    actionLabel: "Open disbursements",
    primaryFields: ["Voucher no.", "Payee", "Transaction date", "Bank account", "Amount"],
    lineItems: ["Account code", "Description", "Debit", "Credit"],
    approvals: ["Prepared by", "Checked by", "Approved by", "Received by"],
    notes: "Generated from the disbursement detail modal.",
  },
  {
    key: "reimbursement-request",
    group: "Finance",
    title: "Reimbursement Request",
    code: "RR",
    mode: "Generated PDF",
    detail: "Claim form for reimbursable expenses and supporting receipts.",
    href: `${portalUrls.finance}/reimbursements`,
    actionLabel: "Open reimbursements",
    primaryFields: [
      "Claimant",
      "Expense category",
      "Profit center",
      "Accounting treatment",
      "Total claimed",
    ],
    lineItems: ["Date", "Description", "Receipt", "Amount"],
    approvals: ["Claimant", "Finance verification", "Management approval", "Accounting note"],
    notes: "Create or open a reimbursement record to generate the PDF.",
  },
  {
    key: "pnl-report",
    group: "Finance",
    title: "P&L Report",
    code: "PNL",
    mode: "Report PDF",
    detail: "Monthly profit and loss report from finance classifications.",
    href: `${portalUrls.finance}/pnl`,
    actionLabel: "Open P&L",
    primaryFields: ["Month", "Revenue", "Variable costs", "Fixed costs", "Net operating income"],
    lineItems: ["Category", "JDVP", "TWSP F&B", "TWSP HSK", "Total"],
    approvals: ["Prepared by Finance", "Reviewed by Management"],
    notes: "PDF export is available from the report page.",
  },
  {
    key: "income-statement",
    group: "Finance",
    title: "Income Statement",
    code: "IS",
    mode: "Report PDF",
    detail: "Segmented income statement aligned to accounting categories.",
    href: `${portalUrls.finance}/income-statement`,
    actionLabel: "Open statement",
    primaryFields: [
      "Period",
      "Revenue",
      "Contribution margin",
      "Segment margin",
      "Net operating income",
    ],
    lineItems: ["Segment", "Category", "Cost type", "Amount"],
    approvals: ["Prepared by Finance", "Reviewed by Management"],
    notes: "Use date filters in Finance before exporting.",
  },
  {
    key: "billing-statement",
    group: "Billing",
    title: "Billing Statement",
    code: "BS",
    mode: "Generated PDF",
    detail: "Receivable statement for billing records.",
    href: `${portalUrls.billing}/receivables`,
    actionLabel: "Open billing",
    primaryFields: ["Student / sponsor", "Receivable no.", "Due date", "Amount", "Outstanding"],
    lineItems: ["Description", "Charges", "Payments", "Balance"],
    approvals: ["Prepared by Billing", "Received by"],
    notes: "Generated from a billing receivable record.",
  },
  {
    key: "payroll-summary",
    group: "HR",
    title: "Payroll Summary",
    code: "PAY",
    mode: "Report PDF",
    detail: "Payroll period report for trainer hours and pay.",
    href: `${portalUrls.hr}/payroll`,
    actionLabel: "Open payroll",
    primaryFields: ["Payroll period", "Trainer", "Hours", "Gross pay", "Net pay"],
    lineItems: ["Employee", "Rate", "Gross", "Deductions", "Net"],
    approvals: ["Prepared by HR", "Approved by Management"],
    notes: "Generated from a payroll period after entries are reviewed.",
  },
  {
    key: "batch-setup",
    group: "Training",
    title: "Batch Setup",
    code: "BATCH",
    mode: "Blank workflow",
    detail: "Training batch setup with schedule, RQM, venue, and instructor.",
    href: `${portalUrls.training}/`,
    actionLabel: "Open batches",
    primaryFields: ["Training type", "Batch no.", "RQM", "Weekly schedule", "Venue"],
    lineItems: ["Start date", "End date", "Sponsor", "Instructor", "Capacity"],
    approvals: ["Training admin", "Assigned trainer"],
    notes: "Batch records are maintained in the Training portal.",
  },
  {
    key: "student-profile",
    group: "Training",
    title: "Student Profile",
    code: "STU",
    mode: "Blank workflow",
    detail: "Student identity, contact, education, training, and document record.",
    href: `${portalUrls.training}/students`,
    actionLabel: "Open students",
    primaryFields: ["Student no.", "Name", "Contact number", "Date of birth", "Batch"],
    lineItems: ["Education", "Employment", "Address", "Photo", "PSA certificate"],
    approvals: ["Training admin", "Document verification"],
    notes: "Profile documents are uploaded from the student record.",
  },
]

const groups = [...new Set(forms.map(form => form.group))]

const modeTone: Record<FormMode, string> = {
  "Blank workflow": "border-blue-100 bg-blue-50 text-primary",
  "Generated PDF": "border-green-100 bg-green-50 text-green-700",
  "Report PDF": "border-amber-100 bg-amber-50 text-amber-700",
}

export default function AdminFormsPage() {
  const userQuery = useCurrentUser()
  const [selectedKey, setSelectedKey] = createSignal(forms[0].key)

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
  const selected = createMemo(() => forms.find(form => form.key === selectedKey()) ?? forms[0])

  return (
    <div class="flex min-h-screen flex-col bg-surface-muted">
      <Show when={!userQuery.isPending && isAdmin()} fallback={<PageLoading />}>
        <Navbar
          userName={`${userQuery.data?.firstName ?? ""} ${userQuery.data?.lastName ?? ""}`.trim()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
          <div class="mx-auto max-w-7xl">
            <div class="mb-6">
              <div class="mb-2">
                <BackLink href="/">Dashboard</BackLink>
              </div>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 class="text-2xl font-bold text-foreground">Forms</h1>
                  <p class="mt-1 text-sm text-muted">
                    Curated form library with a printable-style preview and source workflow links.
                  </p>
                </div>
                <span class="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
                  <Icons.fileText class="h-4 w-4 text-primary" />
                  {forms.length} documents
                </span>
              </div>
            </div>

            <div class="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
              <aside class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]">
                <div class="border-b border-border px-4 py-3">
                  <p class="text-sm font-semibold text-foreground">Form Library</p>
                  <p class="text-xs text-muted">Pick a form to preview its layout and source.</p>
                </div>
                <div class="max-h-[520px] overflow-y-auto lg:max-h-[calc(100vh-13rem)]">
                  <For each={groups}>
                    {group => (
                      <section class="border-b border-border last:border-b-0">
                        <div class="sticky top-0 z-10 bg-surface-muted px-4 py-2">
                          <p class="text-xs font-semibold uppercase text-muted">{group}</p>
                        </div>
                        <div class="p-2">
                          <For each={forms.filter(form => form.group === group)}>
                            {form => (
                              <button
                                type="button"
                                onClick={() => setSelectedKey(form.key)}
                                class={`group mb-1 w-full rounded-lg border px-3 py-3 text-left transition-colors last:mb-0 ${
                                  selectedKey() === form.key
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-transparent hover:border-border hover:bg-surface-muted"
                                }`}
                              >
                                <div class="flex items-start justify-between gap-3">
                                  <div class="min-w-0">
                                    <p class="font-semibold text-foreground group-hover:text-primary">
                                      {form.title}
                                    </p>
                                    <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                                      {form.detail}
                                    </p>
                                  </div>
                                  <span
                                    class={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${modeTone[form.mode]}`}
                                  >
                                    {form.mode}
                                  </span>
                                </div>
                              </button>
                            )}
                          </For>
                        </div>
                      </section>
                    )}
                  </For>
                </div>
              </aside>

              <section class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                <div class="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class={`rounded-full border px-2.5 py-1 text-xs font-semibold ${modeTone[selected().mode]}`}
                      >
                        {selected().mode}
                      </span>
                      <span class="text-xs font-medium uppercase text-muted">
                        {selected().group}
                      </span>
                    </div>
                    <h2 class="mt-2 text-xl font-bold text-foreground">{selected().title}</h2>
                    <p class="mt-1 text-sm text-muted">{selected().detail}</p>
                  </div>
                  <a href={selected().href}>
                    <Button type="button" size="sm" class="w-full sm:w-auto">
                      {selected().actionLabel}
                      <Icons.arrowRight class="h-4 w-4" />
                    </Button>
                  </a>
                </div>

                <div class="grid gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div class="bg-[#eef1f5] p-4 sm:p-6">
                    <PdfPaperPreview form={selected()} />
                  </div>
                  <aside class="border-t border-border p-5 xl:border-l xl:border-t-0">
                    <h3 class="text-sm font-semibold text-foreground">PDF Source</h3>
                    <p class="mt-2 text-sm leading-relaxed text-muted">{selected().notes}</p>

                    <div class="mt-5 space-y-3">
                      <InfoRow label="Document code" value={selected().code} />
                      <InfoRow label="Portal" value={selected().group} />
                      <InfoRow label="Source type" value={selected().mode} />
                    </div>

                    <div class="mt-6 rounded-lg border border-border bg-surface-muted p-4">
                      <p class="text-xs font-semibold uppercase text-muted">Workflow</p>
                      <p class="mt-2 text-sm text-foreground">
                        Use the source workflow to create or open a record. When a real PDF needs
                        record data, the PDF button lives on that record detail page.
                      </p>
                    </div>
                  </aside>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}

function PdfPaperPreview(props: { form: FormDocument }) {
  return (
    <div class="mx-auto min-h-[720px] max-w-[760px] bg-white px-8 py-7 text-[#151515] shadow-[0_18px_40px_rgba(15,23,42,0.16)] sm:px-10">
      <div class="flex items-start justify-between gap-6 border-b-2 border-primary pb-4">
        <div class="flex items-center gap-3">
          <img
            src="/logo/ark-transpa.png"
            alt="Ark Institute"
            class="h-12 w-12 object-contain"
            loading="eager"
          />
          <div>
            <p class="text-lg font-bold">ARK INSTITUTE</p>
            <p class="text-xs uppercase text-slate-500">ERP Controlled Form</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-mono text-sm font-bold text-primary">{props.form.code}</p>
          <p class="mt-1 text-xs text-slate-500">{props.form.mode}</p>
        </div>
      </div>

      <div class="mt-7 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 class="text-2xl font-bold">{props.form.title}</h3>
          <p class="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">{props.form.detail}</p>
        </div>
        <div class="rounded-lg border border-slate-200 px-3 py-2 text-right">
          <p class="text-[11px] uppercase text-slate-500">Document no.</p>
          <p class="font-mono text-sm">{props.form.code}-YYYY-00001</p>
        </div>
      </div>

      <PreviewBlock title="Primary Details" items={props.form.primaryFields} columns={2} />
      <Show when={props.form.lineItems?.length}>
        <PreviewTable items={props.form.lineItems ?? []} />
      </Show>
      <Show when={props.form.approvals?.length}>
        <SignaturePreview items={props.form.approvals ?? []} />
      </Show>

      <div class="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
        <p class="text-xs font-semibold uppercase text-slate-500">Preview note</p>
        <p class="mt-1 text-sm text-slate-700">
          This viewer shows the controlled layout and fields. Final PDFs use live record values from
          the source portal.
        </p>
      </div>
    </div>
  )
}

function PreviewBlock(props: { title: string; items: string[]; columns?: 1 | 2 }) {
  return (
    <section class="mt-7">
      <h4 class="border-b border-slate-200 pb-2 text-sm font-bold uppercase text-primary">
        {props.title}
      </h4>
      <div class={`mt-4 grid gap-3 ${props.columns === 2 ? "sm:grid-cols-2" : ""}`}>
        <For each={props.items}>
          {item => (
            <div class="rounded-lg border border-slate-200 px-3 py-3">
              <p class="text-[11px] font-semibold uppercase text-slate-500">{item}</p>
              <div class="mt-3 h-5 border-b border-slate-300" />
            </div>
          )}
        </For>
      </div>
    </section>
  )
}

function PreviewTable(props: { items: string[] }) {
  return (
    <section class="mt-7">
      <h4 class="border-b border-slate-200 pb-2 text-sm font-bold uppercase text-primary">
        Line Items / Supporting Details
      </h4>
      <div class="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div
          class="grid bg-slate-100"
          style={{ "grid-template-columns": `repeat(${props.items.length}, minmax(0, 1fr))` }}
        >
          <For each={props.items}>
            {item => (
              <div class="border-r border-slate-200 px-3 py-2 text-xs font-bold uppercase text-slate-600 last:border-r-0">
                {item}
              </div>
            )}
          </For>
        </div>
        <For each={[0, 1, 2]}>
          {() => (
            <div
              class="grid border-t border-slate-200"
              style={{ "grid-template-columns": `repeat(${props.items.length}, minmax(0, 1fr))` }}
            >
              <For each={props.items}>
                {() => <div class="min-h-10 border-r border-slate-200 last:border-r-0" />}
              </For>
            </div>
          )}
        </For>
      </div>
    </section>
  )
}

function SignaturePreview(props: { items: string[] }) {
  return (
    <section class="mt-8 grid gap-4 sm:grid-cols-3">
      <For each={props.items}>
        {item => (
          <div class="pt-8 text-center">
            <div class="border-t border-slate-400 pt-2 text-xs font-semibold text-slate-700">
              {item}
            </div>
          </div>
        )}
      </For>
    </section>
  )
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div class="flex items-center justify-between gap-4 text-sm">
      <span class="text-muted">{props.label}</span>
      <span class="font-medium text-foreground">{props.value}</span>
    </div>
  )
}
