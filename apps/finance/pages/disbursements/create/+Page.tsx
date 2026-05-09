import { BackLink, formatPeso } from "@ark/ui"
import { useBankBalance, useCreateDisbursement } from "@data/hooks"
import { createDisbursementSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createSignal, Show } from "solid-js"

const CATEGORIES = [
  { value: "supplies", label: "Supplies" },
  { value: "trainer_fees", label: "Trainer Fees" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "transportation", label: "Transportation" },
  { value: "training_materials", label: "Training Materials" },
  { value: "payroll", label: "Payroll" },
  { value: "other", label: "Other" },
]

export default function CreateDisbursementPage() {
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [category, setCategory] = createSignal("supplies")
  const [amount, setAmount] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [referenceId, setReferenceId] = createSignal("")

  const opsBalance = useBankBalance(() => "operational-hub")
  const mutation = useCreateDisbursement()

  const amountValue = () => {
    const v = parseFloat(amount())
    return Number.isNaN(v) ? 0 : v
  }
  const canSubmit = () => amountValue() > 0 && description().trim() !== "" && !mutation.isPending

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (!canSubmit()) return

    const data = {
      category: category(),
      amount: amountValue(),
      description: description(),
      referenceId: referenceId() || undefined,
    }

    const result = validateForm(createDisbursementSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    mutation.mutate(
      {
        bankId: "operational-hub",
        amount: amountValue(),
        category: category(),
        description: description(),
        referenceId: referenceId() || undefined,
      },
      {
        onSuccess: () => {
          window.location.href = "/disbursements"
        },
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <BackLink variant="icon" label="Back to disbursements" href="/disbursements" />
        <div>
          <h1 class="text-2xl font-semibold text-foreground">New Disbursement</h1>
          <p class="text-sm text-muted mt-1">Record a cash disbursement from Operational Hub</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div class="bg-surface rounded-lg border border-border p-6 space-y-4">
              <div>
                <label for="dis-category" class="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  id="dis-category"
                  value={category()}
                  onChange={e => setCategory(e.currentTarget.value)}
                  class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().category ? "border-red-300" : "border-border"}`}
                >
                  {CATEGORIES.map(c => (
                    <option value={c.value}>{c.label}</option>
                  ))}
                </select>
                <Show when={errors().category}>
                  <p class="text-xs text-red-600 mt-1">{errors().category}</p>
                </Show>
              </div>
              <div>
                <label for="dis-amount" class="block text-sm font-medium text-foreground mb-1">
                  Amount (PHP)
                </label>
                <input
                  id="dis-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount()}
                  onInput={e => setAmount(e.currentTarget.value)}
                  placeholder="0.00"
                  class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().amount ? "border-red-300" : "border-border"}`}
                />
                <Show when={errors().amount}>
                  <p class="text-xs text-red-600 mt-1">{errors().amount}</p>
                </Show>
              </div>
              <div>
                <label for="dis-description" class="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <input
                  id="dis-description"
                  type="text"
                  value={description()}
                  onInput={e => setDescription(e.currentTarget.value)}
                  placeholder="What was this expense for?"
                  class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().description ? "border-red-300" : "border-border"}`}
                />
                <Show when={errors().description}>
                  <p class="text-xs text-red-600 mt-1">{errors().description}</p>
                </Show>
              </div>
              <div>
                <label for="dis-reference" class="block text-sm font-medium text-foreground mb-1">
                  Reference <span class="text-muted">(optional)</span>
                </label>
                <input
                  id="dis-reference"
                  type="text"
                  value={referenceId()}
                  onInput={e => setReferenceId(e.currentTarget.value)}
                  placeholder="e.g., PO-001"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div class="lg:col-span-1">
            <div class="bg-surface rounded-lg border border-border p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-foreground mb-4">Summary</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted">Bank</span>
                  <span class="font-medium">Operational Hub</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Category</span>
                  <span class="font-medium capitalize">{category().replace("_", " ")}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Balance</span>
                  <span class="tabular-nums">
                    {opsBalance.data ? formatPeso(opsBalance.data.balance) : "-"}
                  </span>
                </div>
                <div class="border-t pt-3 flex justify-between">
                  <span class="font-medium">Amount</span>
                  <span class="text-xl tabular-nums text-red-700">
                    {amountValue() > 0 ? formatPeso(amountValue()) : "—"}
                  </span>
                </div>
              </div>

              <Show when={mutation.isError}>
                <div class="mt-4 p-3 bg-red-50 rounded-lg">
                  <p class="text-xs text-red-700">{mutation.error?.message}</p>
                </div>
              </Show>

              <div class="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={!canSubmit()}
                  class="w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? "Processing..." : "Record Disbursement"}
                </button>
                <a
                  href="/disbursements"
                  class="block w-full px-4 py-2.5 bg-surface text-foreground border border-border text-sm font-medium rounded-lg hover:bg-surface-muted transition-colors text-center"
                >
                  Cancel
                </a>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
