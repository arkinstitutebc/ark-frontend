import { PageContainer, PageHeader, StatCard } from "@ark/ui"
import { useReimbursements } from "@data/hooks"
import type { Reimbursement } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { ReimbursementTable } from "@/components/finance/reimbursement-table"

const FILTERS = [
  { value: "pending", label: "Finance queue" },
  { value: "verified", label: "Management queue" },
] as const

export default function RrApprovalsPage() {
  const query = useReimbursements()
  const [filter, setFilter] = createSignal<(typeof FILTERS)[number]["value"]>("pending")

  const all = createMemo(() => (query.data ?? []) as Reimbursement[])
  const stats = createMemo(() => {
    const data = all()
    return {
      pending: data.filter(rr => rr.status === "pending").length,
      verified: data.filter(rr => rr.status === "verified").length,
      approved: data.filter(rr => rr.status === "approved").length,
      rejected: data.filter(rr => rr.status === "rejected").length,
    }
  })
  const rows = createMemo(() => all().filter(rr => rr.status === filter()))

  return (
    <PageContainer>
      <PageHeader
        title="Reimbursement Approvals"
        subtitle="Two-stage queue — Finance verifies, Management approves"
      />

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Finance queue" value={query.isSuccess ? stats().pending : "-"} />
        <StatCard label="Management queue" value={query.isSuccess ? stats().verified : "-"} />
        <StatCard label="Approved" value={query.isSuccess ? stats().approved : "-"} />
        <StatCard label="Rejected" value={query.isSuccess ? stats().rejected : "-"} />
      </div>

      <div class="flex gap-2 mb-6">
        <For each={FILTERS}>
          {item => (
            <button
              type="button"
              onClick={() => setFilter(item.value)}
              class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter() === item.value ? "bg-primary text-white" : "bg-surface text-foreground border border-border hover:bg-surface-muted"}`}
            >
              {item.label}
            </button>
          )}
        </For>
      </div>

      <div class="bg-surface rounded-lg border border-border overflow-hidden">
        <Show
          when={rows().length > 0}
          fallback={
            <div class="py-16 text-center">
              <p class="text-sm font-medium text-foreground">
                {filter() === "pending" ? "Nothing to verify" : "Nothing to approve"}
              </p>
              <p class="text-sm text-muted mt-1">
                {filter() === "pending"
                  ? "New claims will land here for finance to verify."
                  : "Verified claims await management approval here."}
              </p>
            </div>
          }
        >
          <ReimbursementTable rows={rows()} onOpen={id => navigate(`/reimbursements/${id}`)} />
        </Show>
      </div>
    </PageContainer>
  )
}
