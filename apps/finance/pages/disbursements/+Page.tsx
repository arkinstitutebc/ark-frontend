import {
  ConfirmDialog,
  DataTable,
  formatDatePH,
  formatPeso,
  Modal,
  ModalFooter,
  PageHeader,
  Select,
  StatCard,
  THead,
  Th,
  Tr,
} from "@ark/ui"
import { categoryOptionsBySection, GL_CATALOG, glDefault } from "@data/gl-defaults"
import {
  useBankBalance,
  useDeleteDisbursement,
  useDisbursements,
  useUpdateDisbursement,
} from "@data/hooks"
import { profitCenterOptions, updateDisbursementSchema } from "@data/schemas"
import type { Transaction, TxnCategory } from "@data/types"
import { validateForm } from "@data/validate"
import { createEffect, createMemo, createSignal, For, type JSX, Show } from "solid-js"
import { Icons, QueryBoundary, StatusBadge } from "@/components/ui"

type SortKey = "date" | "payee" | "description" | "category" | "amount"
type SortDir = "asc" | "desc"

export default function DisbursementsPage() {
  const query = useDisbursements()
  const opsBalance = useBankBalance(() => "operational-hub")
  const deleteDisbursement = useDeleteDisbursement()
  const [search, setSearch] = createSignal("")
  const [categoryFilter, setCategoryFilter] = createSignal<TxnCategory | "all">("all")
  const [sortKey, setSortKey] = createSignal<SortKey>("date")
  const [sortDir, setSortDir] = createSignal<SortDir>("desc")
  const [selectedTxn, setSelectedTxn] = createSignal<Transaction | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = createSignal(false)

  const totalExpenses = createMemo(() => {
    if (!query.data) return null
    return query.data.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  })
  const categories = createMemo(() => {
    const values = new Set<TxnCategory>()
    for (const txn of query.data ?? []) {
      if (txn.category) values.add(txn.category)
    }
    return [...values].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)))
  })
  const categoryOptions = createMemo(() => [
    { label: "All categories", value: "all" as const },
    ...categories().map(category => ({ label: categoryLabel(category), value: category })),
  ])
  const filteredTxns = (txns: Transaction[]) => {
    const q = search().trim().toLowerCase()
    const selectedCategory = categoryFilter()

    return txns
      .filter(txn => {
        const matchesCategory = selectedCategory === "all" || txn.category === selectedCategory
        const text = [txn.payee, txn.description, txn.referenceId, txn.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return matchesCategory && (!q || text.includes(q))
      })
      .sort((a, b) => compareTxns(a, b, sortKey(), sortDir()))
  }
  const setSort = (key: SortKey) => {
    if (sortKey() === key) {
      setSortDir(sortDir() === "asc" ? "desc" : "asc")
      return
    }
    setSortKey(key)
    setSortDir(key === "amount" ? "desc" : "asc")
  }
  const canMutate = (txn: Transaction) =>
    txn.type === "expense" && !["payroll", "reimbursement"].includes(txn.referenceType ?? "")
  const requestDelete = (txn: Transaction) => {
    setSelectedTxn(txn)
    setConfirmDeleteOpen(true)
  }
  const confirmDelete = () => {
    const txn = selectedTxn()
    if (!txn) return
    deleteDisbursement.mutate(txn.id, {
      onSuccess: () => {
        setConfirmDeleteOpen(false)
        setSelectedTxn(null)
      },
    })
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="Disbursements"
        subtitle="Cash disbursements and operational expenses"
        action={
          <a
            href="/disbursements/create"
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + New Disbursement
          </a>
        }
      />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Disbursements" numeric value={query.data?.length ?? "-"} />
        <StatCard
          label="Total Expenses"
          numeric
          value={(() => {
            const v = totalExpenses()
            return v !== null ? formatPeso(v) : "-"
          })()}
        />
        <StatCard
          label="Operational Hub Balance"
          numeric
          value={opsBalance.data ? formatPeso(opsBalance.data.balance) : "-"}
        />
      </div>

      <QueryBoundary query={query}>
        {(txns: Transaction[]) => {
          const rows = createMemo(() => filteredTxns(txns))
          return (
            <div class="bg-surface rounded-lg border border-border overflow-hidden">
              <div class="px-5 py-4 border-b border-border space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <h2 class="text-sm font-semibold text-foreground">Expense History</h2>
                  <p class="text-xs text-muted">
                    {rows().length === txns.length
                      ? `${txns.length} disbursements`
                      : `${rows().length} of ${txns.length}`}
                  </p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
                  <input
                    type="search"
                    value={search()}
                    onInput={e => setSearch(e.currentTarget.value)}
                    placeholder="Search store, item, receipt, category"
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <Select
                    value={categoryFilter()}
                    onChange={value => setCategoryFilter(value)}
                    options={categoryOptions()}
                    ariaLabel="Category filter"
                  />
                </div>
              </div>
              <Show
                when={txns.length > 0}
                fallback={
                  <div class="py-12 text-center">
                    <Icons.receipt class="w-12 h-12 mx-auto mb-3 text-muted" />
                    <p class="text-sm font-medium text-foreground">No disbursements yet</p>
                  </div>
                }
              >
                <Show
                  when={rows().length > 0}
                  fallback={
                    <p class="px-5 py-10 text-sm text-muted text-center">
                      No matching disbursements.
                    </p>
                  }
                >
                  <DataTable>
                    <THead>
                      <Th>
                        <SortButton
                          label="Date"
                          active={sortKey() === "date"}
                          dir={sortDir()}
                          onClick={() => setSort("date")}
                        />
                      </Th>
                      <Th>
                        <SortButton
                          label="Store / Company"
                          active={sortKey() === "payee"}
                          dir={sortDir()}
                          onClick={() => setSort("payee")}
                        />
                      </Th>
                      <Th>
                        <SortButton
                          label="Description"
                          active={sortKey() === "description"}
                          dir={sortDir()}
                          onClick={() => setSort("description")}
                        />
                      </Th>
                      <Th>
                        <SortButton
                          label="Category"
                          active={sortKey() === "category"}
                          dir={sortDir()}
                          onClick={() => setSort("category")}
                        />
                      </Th>
                      <Th align="right">
                        <SortButton
                          label="Amount"
                          active={sortKey() === "amount"}
                          dir={sortDir()}
                          onClick={() => setSort("amount")}
                          align="right"
                        />
                      </Th>
                    </THead>
                    <tbody>
                      <For each={rows()}>
                        {(txn: Transaction) => (
                          <Tr onClick={() => setSelectedTxn(txn)}>
                            <td class="py-4 px-6 text-sm text-muted">
                              {formatDatePH(txn.transactionDate ?? txn.createdAt)}
                            </td>
                            <td class="py-4 px-6 text-sm text-foreground">{txn.payee ?? "—"}</td>
                            <td class="py-4 px-6 text-sm text-foreground">{txn.description}</td>
                            <td class="py-4 px-6">
                              <StatusBadge status={categoryLabel(txn.category)} />
                            </td>
                            <td class="py-4 px-6 text-right text-sm font-semibold text-red-700 tabular-nums">
                              {formatPeso(Math.abs(Number(txn.amount)))}
                            </td>
                          </Tr>
                        )}
                      </For>
                    </tbody>
                  </DataTable>
                </Show>
              </Show>
            </div>
          )
        }}
      </QueryBoundary>

      <DisbursementDetailsModal
        txn={selectedTxn()}
        onClose={() => setSelectedTxn(null)}
        onDelete={requestDelete}
        canMutate={canMutate}
      />

      <ConfirmDialog
        open={confirmDeleteOpen()}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete disbursement?"
        description="This removes the expense from reports and bank balance. Payroll and reimbursement postings stay protected."
        confirmLabel="Delete"
        danger
        pending={deleteDisbursement.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function categoryLabel(category?: string) {
  if (!category) return "Other"
  return GL_CATALOG[category as TxnCategory]?.label ?? category.replace(/_/g, " ")
}

function compareTxns(a: Transaction, b: Transaction, key: SortKey, dir: SortDir) {
  const multiplier = dir === "asc" ? 1 : -1
  const result =
    key === "amount"
      ? Math.abs(Number(a.amount)) - Math.abs(Number(b.amount))
      : textValue(a, key).localeCompare(textValue(b, key), undefined, { numeric: true })
  return result * multiplier
}

function textValue(txn: Transaction, key: Exclude<SortKey, "amount">) {
  if (key === "date") return txn.transactionDate ?? txn.createdAt
  if (key === "category") return categoryLabel(txn.category)
  return txn[key] ?? ""
}

function SortButton(props: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: "left" | "right"
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`inline-flex w-full items-center gap-1 ${props.align === "right" ? "justify-end" : "justify-start"} hover:text-foreground`}
    >
      <span>{props.label}</span>
      <span class={`text-[10px] ${props.active ? "text-foreground" : "text-muted/60"}`}>
        {props.active ? (props.dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  )
}

function DisbursementDetailsModal(props: {
  txn: Transaction | null
  onClose: () => void
  onDelete: (txn: Transaction) => void
  canMutate: (txn: Transaction) => boolean
}) {
  const updateDisbursement = useUpdateDisbursement()
  const [mode, setMode] = createSignal<"view" | "edit">("view")
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [transactionDate, setTransactionDate] = createSignal("")
  const [payee, setPayee] = createSignal("")
  const [category, setCategory] = createSignal<TxnCategory>("supplies")
  const [amount, setAmount] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [referenceId, setReferenceId] = createSignal("")
  const [profitCenter, setProfitCenter] = createSignal("")
  const [expenseCategory, setExpenseCategory] = createSignal("")
  const [accountingTreatment, setAccountingTreatment] = createSignal("")

  const txn = () => props.txn
  const categoryOptions = createMemo(() =>
    categoryOptionsBySection().flatMap(group => [
      { label: group.label, value: `group-${group.label}`, disabled: true },
      ...group.options,
    ])
  )

  createEffect(() => {
    const current = props.txn
    if (!current) return
    setMode("view")
    setErrors({})
    setTransactionDate((current.transactionDate ?? current.createdAt).slice(0, 10))
    setPayee(current.payee ?? "")
    setCategory(current.category ?? "other")
    setAmount(String(Math.abs(Number(current.amount))))
    setDescription(current.description ?? "")
    setReferenceId(current.referenceId ?? "")
    setProfitCenter(current.profitCenter ?? "Admin")
    setExpenseCategory(
      current.expenseCategory ?? glDefault(current.category ?? "other")?.expenseCategory ?? ""
    )
    setAccountingTreatment(
      current.accountingTreatment ??
        glDefault(current.category ?? "other")?.accountingTreatment ??
        ""
    )
  })

  const amountValue = () => {
    const value = Number.parseFloat(amount())
    return Number.isNaN(value) ? 0 : value
  }

  const handleCategoryChange = (next: string) => {
    const typed = next as TxnCategory
    setCategory(typed)
    const defaults = glDefault(typed)
    if (defaults) {
      setExpenseCategory(defaults.expenseCategory)
      setAccountingTreatment(defaults.accountingTreatment)
    }
  }

  const save = () => {
    const current = txn()
    if (!current) return
    const data = {
      category: category(),
      transactionDate: transactionDate(),
      payee: payee().trim(),
      amount: amountValue(),
      description: description(),
      referenceId: referenceId().trim(),
      expenseCategory: expenseCategory() || undefined,
      profitCenter: profitCenter() || undefined,
      accountingTreatment: accountingTreatment() || undefined,
    }
    const result = validateForm(updateDisbursementSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    updateDisbursement.mutate(
      { id: current.id, ...result.data },
      {
        onSuccess: () => {
          props.onClose()
        },
      }
    )
  }

  return (
    <Modal open={!!props.txn} onClose={props.onClose} title="Disbursement Details" size="lg">
      <Show when={txn()}>
        {current => (
          <div class="space-y-5">
            <Show
              when={mode() === "view"}
              fallback={
                <div class="space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Date" error={errors().transactionDate}>
                      <input
                        type="date"
                        value={transactionDate()}
                        onInput={e => setTransactionDate(e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </Field>
                    <Field label="Amount (PHP)" error={errors().amount}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount()}
                        onInput={e => setAmount(e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </Field>
                    <Field label="Store / Company" error={errors().payee}>
                      <input
                        type="text"
                        value={payee()}
                        onInput={e => setPayee(e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </Field>
                    <Field label="Category" error={errors().category}>
                      <Select
                        value={category()}
                        onChange={handleCategoryChange}
                        options={categoryOptions()}
                        ariaLabel="Category"
                      />
                    </Field>
                    <Field label="Receipt / OR" error={errors().referenceId}>
                      <input
                        type="text"
                        value={referenceId()}
                        onInput={e => setReferenceId(e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </Field>
                    <Field label="For" error={errors().profitCenter}>
                      <Select
                        value={profitCenter()}
                        onChange={setProfitCenter}
                        options={profitCenterOptions.map(value => ({ label: value, value }))}
                        ariaLabel="For"
                      />
                    </Field>
                  </div>
                  <Field label="What was bought / paid?" error={errors().description}>
                    <input
                      type="text"
                      value={description()}
                      onInput={e => setDescription(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </Field>
                  <ModalFooter
                    onCancel={() => setMode("view")}
                    cancelLabel="Cancel"
                    onSubmit={save}
                    submitLabel="Save"
                    submitting={updateDisbursement.isPending}
                  />
                </div>
              }
            >
              <div class="space-y-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <Detail
                    label="Date"
                    value={formatDatePH(current().transactionDate ?? current().createdAt)}
                  />
                  <Detail
                    label="Amount"
                    value={formatPeso(Math.abs(Number(current().amount)))}
                    strong
                  />
                  <Detail label="Store / Company" value={current().payee ?? "-"} />
                  <Detail label="Category" value={categoryLabel(current().category)} />
                  <Detail label="For" value={current().profitCenter ?? "-"} />
                  <Detail label="Receipt / OR" value={current().referenceId ?? "-"} />
                  <Detail label="Recorded by" value={current().createdBy ?? "-"} />
                  <Detail label="Recorded at" value={formatDatePH(current().createdAt)} />
                </div>

                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-muted mb-1">
                    What was bought / paid?
                  </p>
                  <p class="text-sm text-foreground">{current().description || "-"}</p>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={props.onClose}
                    class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <Show when={props.canMutate(current())}>
                    <button
                      type="button"
                      onClick={() => setMode("edit")}
                      class="px-4 py-2 text-sm font-medium text-foreground border border-border hover:bg-surface-muted rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => props.onDelete(current())}
                      class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </Show>
                </div>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </Modal>
  )
}

function Field(props: { label: string; error?: string; children: JSX.Element }) {
  return (
    <div>
      <p class="block text-sm font-medium text-foreground mb-1">{props.label}</p>
      {props.children}
      <Show when={props.error}>
        <p class="text-xs text-red-600 mt-1">{props.error}</p>
      </Show>
    </div>
  )
}

function Detail(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-muted mb-1">{props.label}</p>
      <p class={`text-sm ${props.strong ? "font-semibold tabular-nums" : ""} text-foreground`}>
        {props.value}
      </p>
    </div>
  )
}
