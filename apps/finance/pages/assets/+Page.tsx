import type { Asset, AssetStatus } from "@ark/data-types"
import {
  DataTable,
  formatDatePH,
  formatPeso,
  PageContainer,
  PageHeader,
  StatCard,
  StatusBadge,
  THead,
  Th,
  Tr,
} from "@ark/ui"
import { useAssets } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { navigate } from "vike/client/router"
import { bookValueAt, monthsElapsedSince } from "./_lib.ts"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "disposed", label: "Disposed" },
  { value: "written-off", label: "Written off" },
] as const

export default function AssetsPage() {
  const query = useAssets()
  const [filter, setFilter] = createSignal<(typeof FILTERS)[number]["value"]>("all")
  const [search, setSearch] = createSignal("")

  const rows = createMemo(() => {
    const data = (query.data ?? []) as Asset[]
    return data.filter(a => {
      const f = filter()
      const matchStatus = f === "all" || a.status === f
      const q = search().toLowerCase()
      const matchSearch =
        !q ||
        a.assetCode.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  })

  const stats = createMemo(() => {
    const data = (query.data ?? []) as Asset[]
    const active = data.filter(a => a.status === "active")
    const totalCost = active.reduce((sum, a) => sum + Number(a.acquisitionCost), 0)
    const totalBookValue = active.reduce((sum, a) => sum + bookValueAt(a, new Date()), 0)
    return { count: active.length, totalCost, totalBookValue }
  })

  return (
    <PageContainer>
      <PageHeader
        title="Asset Register"
        subtitle="Depreciable items — Cost less accumulated depreciation = book value"
        action={
          <a
            href="/assets/create"
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Register Asset
          </a>
        }
      />

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active assets" value={query.isSuccess ? stats().count : "-"} />
        <StatCard
          label="Total cost (active)"
          value={query.isSuccess ? formatPeso(stats().totalCost) : "-"}
        />
        <StatCard
          label="Book value (today)"
          value={query.isSuccess ? formatPeso(stats().totalBookValue) : "-"}
        />
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by code, name, or category..."
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
              <p class="text-sm font-medium text-foreground">No assets registered</p>
              <p class="text-sm text-muted mt-1">
                Register one with "+ Register Asset" to start tracking depreciation.
              </p>
            </div>
          }
        >
          <DataTable>
            <THead>
              <Th size="dense">Code</Th>
              <Th size="dense">Name</Th>
              <Th size="dense">Category</Th>
              <Th size="dense">Acquired</Th>
              <Th size="dense" align="right">
                Cost
              </Th>
              <Th size="dense" align="right">
                Book value
              </Th>
              <Th size="dense">Status</Th>
            </THead>
            <tbody>
              <For each={rows()}>
                {asset => (
                  <Tr onClick={() => navigate(`/assets/${asset.id}`)} class="hover:bg-primary/5">
                    <td class="py-3 px-6 font-mono text-sm font-medium text-foreground">
                      {asset.assetCode}
                    </td>
                    <td class="py-3 px-6 text-sm text-foreground max-w-[280px]">
                      <span class="block truncate" title={asset.name}>
                        {asset.name}
                      </span>
                    </td>
                    <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">{asset.category}</td>
                    <td class="py-3 px-6 text-sm text-muted whitespace-nowrap">
                      {formatDatePH(asset.acquisitionDate)} (
                      {monthsElapsedSince(asset.acquisitionDate)}
                      mo)
                    </td>
                    <td class="py-3 px-6 text-right text-sm text-foreground tabular-nums">
                      {formatPeso(Number(asset.acquisitionCost))}
                    </td>
                    <td class="py-3 px-6 text-right text-sm font-semibold text-foreground tabular-nums">
                      {asset.status === "active" ? formatPeso(bookValueAt(asset, new Date())) : "—"}
                    </td>
                    <td class="py-3 px-6">
                      <StatusBadge status={asset.status as AssetStatus} />
                    </td>
                  </Tr>
                )}
              </For>
            </tbody>
          </DataTable>
        </Show>
      </div>
    </PageContainer>
  )
}
