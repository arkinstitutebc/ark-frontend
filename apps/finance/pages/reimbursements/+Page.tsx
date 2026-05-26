import { PageContainer, PageHeader } from "@ark/ui"
import { useReimbursements } from "@data/hooks"
import type { Reimbursement } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { ReimbursementTable } from "@/components/finance/reimbursement-table"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const

export default function ReimbursementsPage() {
  const query = useReimbursements()
  const [filter, setFilter] = createSignal<(typeof FILTERS)[number]["value"]>("all")
  const [search, setSearch] = createSignal("")

  const rows = createMemo(() => {
    const data = (query.data ?? []) as Reimbursement[]
    return data.filter(rr => {
      const f = filter()
      const matchStatus = f === "all" || rr.status === f
      const q = search().toLowerCase()
      const matchSearch =
        !q ||
        rr.rrCode?.toLowerCase().includes(q) ||
        rr.claimantName?.toLowerCase().includes(q) ||
        rr.activity?.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  })

  return (
    <PageContainer>
      <PageHeader
        title="Reimbursements"
        subtitle="Staff out-of-pocket expense claims"
        action={
          <a
            href="/reimbursements/create"
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + New Claim
          </a>
        }
      />

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by RR #, claimant, or activity..."
          value={search()}
          onInput={e => setSearch(e.currentTarget.value)}
          class="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <div class="flex gap-2 flex-wrap">
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
      </div>

      <div class="bg-surface rounded-lg border border-border overflow-hidden">
        <Show
          when={rows().length > 0}
          fallback={
            <div class="py-16 text-center">
              <p class="text-sm font-medium text-foreground">No reimbursement requests</p>
              <p class="text-sm text-muted mt-1">Submit one with "+ New Claim".</p>
            </div>
          }
        >
          <ReimbursementTable rows={rows()} onOpen={id => navigate(`/reimbursements/${id}`)} />
        </Show>
      </div>
    </PageContainer>
  )
}
