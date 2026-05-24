import type { PrAttachment } from "@ark/data-types"
import { AttachmentUploader, BackLink, formatPeso, PageContainer, Select } from "@ark/ui"
import { useCreateAsset, useGlAccounts } from "@data/hooks"
import { createMemo, createSignal, type JSX, onMount, Show } from "solid-js"
import { navigate } from "vike/client/router"

const PROFIT_CENTERS = [
  { label: "JDVP", value: "JDVP" },
  { label: "TWSP-FBS", value: "TWSP-FBS" },
  { label: "TWSP-HSK", value: "TWSP-HSK" },
  { label: "Admin (unallocated)", value: "Admin" },
]

const LIFE_PRESETS = [
  { label: "1 year", months: 12 },
  { label: "3 years", months: 36 },
  { label: "5 years", months: 60 },
  { label: "10 years", months: 120 },
]

export default function CreateAssetPage() {
  const create = useCreateAsset()
  const glAccountsQuery = useGlAccounts()

  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [name, setName] = createSignal("")
  const [category, setCategory] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [acquisitionDate, setAcquisitionDate] = createSignal(new Date().toISOString().slice(0, 10))
  const [acquisitionCost, setAcquisitionCost] = createSignal("")
  const [residualValue, setResidualValue] = createSignal("0")
  const [usefulLifeMonths, setUsefulLifeMonths] = createSignal(60)
  const [profitCenter, setProfitCenter] = createSignal("Admin")
  const [assignedTo, setAssignedTo] = createSignal("")
  const [location, setLocation] = createSignal("")
  const [serialNo, setSerialNo] = createSignal("")
  const [linkedPrCode, setLinkedPrCode] = createSignal("")
  const [notes, setNotes] = createSignal("")
  const [attachments, setAttachments] = createSignal<PrAttachment[]>([])
  const [fromDisbursement, setFromDisbursement] = createSignal<string | null>(null)

  // Pre-fill from a fixed-asset disbursement (?fromDisbursement=&name=&cost=&category=&date=&profitCenter=).
  onMount(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const disbursement = params.get("fromDisbursement")
    if (!disbursement) return
    setFromDisbursement(disbursement)
    const nameParam = params.get("name")
    if (nameParam) setName(nameParam)
    const costParam = params.get("cost")
    if (costParam) setAcquisitionCost(costParam)
    const categoryParam = params.get("category")
    if (categoryParam) setCategory(categoryParam)
    const dateParam = params.get("date")
    if (dateParam) setAcquisitionDate(dateParam)
    const pcParam = params.get("profitCenter")
    if (pcParam) setProfitCenter(pcParam)
  })

  const categoryOptions = createMemo(() => {
    const list = glAccountsQuery.data ?? []
    return list
      .filter(a => a.section === "fixed-asset" && a.active)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
      .map(a => ({ label: a.label, value: a.code }))
  })

  const cost = () => Number.parseFloat(acquisitionCost()) || 0
  const residual = () => Number.parseFloat(residualValue()) || 0
  const monthlyDep = () => {
    const base = cost() - residual()
    return usefulLifeMonths() > 0 ? base / usefulLifeMonths() : 0
  }

  const submit = (e: Event) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name().trim()) next.name = "Required"
    if (!category()) next.category = "Pick an asset category"
    if (!acquisitionDate()) next.acquisitionDate = "Required"
    if (cost() <= 0) next.acquisitionCost = "Must be > 0"
    if (residual() < 0) next.residualValue = "Cannot be negative"
    if (residual() > cost()) next.residualValue = "Cannot exceed acquisition cost"
    if (usefulLifeMonths() <= 0) next.usefulLifeMonths = "Must be > 0"
    setErrors(next)
    if (Object.keys(next).length > 0) return

    create.mutate(
      {
        name: name().trim(),
        category: category(),
        description: description().trim() || undefined,
        acquisitionDate: acquisitionDate(),
        acquisitionCost: cost().toFixed(2),
        residualValue: residual().toFixed(2),
        usefulLifeMonths: usefulLifeMonths(),
        profitCenter: profitCenter() || undefined,
        assignedTo: assignedTo().trim() || undefined,
        location: location().trim() || undefined,
        serialNo: serialNo().trim() || undefined,
        linkedPrCode: linkedPrCode().trim() || undefined,
        linkedDisbursementId: fromDisbursement() ?? undefined,
        notes: notes().trim() || undefined,
        attachments: attachments().length > 0 ? attachments() : undefined,
      },
      { onSuccess: () => navigate("/assets") }
    )
  }

  return (
    <PageContainer>
      <div class="flex items-center gap-3 mb-8">
        <BackLink variant="icon" label="Back to assets" onClick={() => navigate("/assets")} />
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Register Asset</h1>
          <p class="text-sm text-muted mt-1">
            Depreciable items only. The system computes book value + monthly depreciation from these
            inputs.
          </p>
        </div>
      </div>

      <Show when={fromDisbursement()}>
        <div class="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-foreground">
          <span class="font-medium">Prefilled from a fixed-asset disbursement.</span>{" "}
          <span class="text-muted">
            Fill in useful life + residual value to complete registration.
          </span>
        </div>
      </Show>

      <Show when={create.isError}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Error: {create.error?.message}
        </div>
      </Show>

      <form onSubmit={submit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <h2 class="text-lg font-semibold text-foreground">Identification</h2>
              <Field label="Name" required error={errors().name}>
                <input
                  type="text"
                  value={name()}
                  onInput={e => setName(e.currentTarget.value)}
                  placeholder="e.g. Lenovo ThinkPad X1 Carbon"
                  class={cls(errors().name)}
                />
              </Field>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required error={errors().category}>
                  <Select
                    options={categoryOptions()}
                    value={category() || undefined}
                    onChange={v => setCategory(v)}
                    placeholder={
                      glAccountsQuery.isLoading ? "Loading…" : "Pick fixed-asset category"
                    }
                    ariaLabel="Category"
                  />
                </Field>
                <Field label="Serial Number">
                  <input
                    type="text"
                    value={serialNo()}
                    onInput={e => setSerialNo(e.currentTarget.value)}
                    class={cls()}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  rows={2}
                  value={description()}
                  onInput={e => setDescription(e.currentTarget.value)}
                  class={`${cls()} resize-none`}
                />
              </Field>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <h2 class="text-lg font-semibold text-foreground">Acquisition & Depreciation</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Acquisition Date" required error={errors().acquisitionDate}>
                  <input
                    type="date"
                    value={acquisitionDate()}
                    onInput={e => setAcquisitionDate(e.currentTarget.value)}
                    class={cls(errors().acquisitionDate)}
                  />
                </Field>
                <Field label="Acquisition Cost (PHP)" required error={errors().acquisitionCost}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={acquisitionCost()}
                    onInput={e => setAcquisitionCost(e.currentTarget.value)}
                    class={cls(errors().acquisitionCost)}
                  />
                </Field>
                <Field label="Residual Value (PHP)" error={errors().residualValue}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={residualValue()}
                    onInput={e => setResidualValue(e.currentTarget.value)}
                    class={cls(errors().residualValue)}
                  />
                </Field>
                <Field label="Useful Life (months)" required error={errors().usefulLifeMonths}>
                  <input
                    type="number"
                    min="1"
                    value={usefulLifeMonths()}
                    onInput={e =>
                      setUsefulLifeMonths(Number.parseInt(e.currentTarget.value, 10) || 0)
                    }
                    class={cls(errors().usefulLifeMonths)}
                  />
                </Field>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="text-xs text-muted self-center">Quick set:</span>
                {LIFE_PRESETS.map(p => (
                  <button
                    type="button"
                    onClick={() => setUsefulLifeMonths(p.months)}
                    class="px-2 py-1 rounded text-xs font-medium bg-surface text-foreground border border-border hover:bg-surface-muted"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <h2 class="text-lg font-semibold text-foreground">Assignment</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Profit Center">
                  <Select
                    options={PROFIT_CENTERS}
                    value={profitCenter()}
                    onChange={v => setProfitCenter(v)}
                    ariaLabel="Profit Center"
                  />
                </Field>
                <Field label="Assigned To (email / dept)">
                  <input
                    type="text"
                    value={assignedTo()}
                    onInput={e => setAssignedTo(e.currentTarget.value)}
                    class={cls()}
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={location()}
                    onInput={e => setLocation(e.currentTarget.value)}
                    placeholder="e.g. Main office, Training room 2"
                    class={cls()}
                  />
                </Field>
                <Field label="Linked PR (optional)">
                  <input
                    type="text"
                    value={linkedPrCode()}
                    onInput={e => setLinkedPrCode(e.currentTarget.value)}
                    placeholder="PR-2026-NNNNN"
                    class={cls()}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <textarea
                  rows={2}
                  value={notes()}
                  onInput={e => setNotes(e.currentTarget.value)}
                  class={`${cls()} resize-none`}
                />
              </Field>
            </div>

            <div class="bg-surface rounded-lg border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-1">Attachments</h2>
              <p class="text-xs text-muted mb-3">Invoice, warranty card, photos, etc.</p>
              <AttachmentUploader
                attachments={attachments()}
                onChange={setAttachments}
                signatureEndpoint="/api/procurement/upload-signature/attachment"
              />
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="bg-surface rounded-lg border border-border p-6 sticky top-24 space-y-3">
              <h2 class="text-lg font-semibold text-foreground">Depreciation Preview</h2>
              <div class="text-sm space-y-2">
                <Row label="Cost" value={cost() > 0 ? formatPeso(cost()) : "—"} />
                <Row label="Residual" value={formatPeso(residual())} />
                <Row
                  label="Depreciable base"
                  value={formatPeso(Math.max(0, cost() - residual()))}
                />
                <Row label="Useful life" value={`${usefulLifeMonths()} months`} />
                <div class="border-t border-border pt-2">
                  <Row
                    label="Monthly depreciation"
                    value={monthlyDep() > 0 ? formatPeso(monthlyDep()) : "—"}
                    bold
                  />
                </div>
              </div>
              <div class="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={create.isPending}
                  class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {create.isPending ? "Registering..." : "Register Asset"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/assets")}
                  class="w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  )
}

function Field(props: {
  label: string
  required?: boolean
  error?: string
  children: JSX.Element
}) {
  return (
    <div>
      <span class="block text-sm font-medium text-foreground mb-1">
        {props.label}
        <Show when={props.required}>
          <span class="text-red-500 ml-0.5">*</span>
        </Show>
      </span>
      {props.children}
      <Show when={props.error}>
        <p class="text-xs text-red-600 mt-1">{props.error}</p>
      </Show>
    </div>
  )
}

function Row(props: { label: string; value: string; bold?: boolean }) {
  return (
    <div class="flex justify-between">
      <span class="text-muted">{props.label}</span>
      <span
        class={
          props.bold ? "font-semibold text-foreground tabular-nums" : "text-foreground tabular-nums"
        }
      >
        {props.value}
      </span>
    </div>
  )
}

function cls(error?: string) {
  return `w-full px-3 py-2 border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? "border-red-300" : "border-border"}`
}
