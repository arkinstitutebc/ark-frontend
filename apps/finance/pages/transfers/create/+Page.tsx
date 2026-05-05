import { useBankBalance, useBanks, useCreateTransfer } from "@data/hooks"
import { createTransferSchema } from "@data/schemas"
import type { Bank } from "@data/types"
import { validateForm } from "@data/validate"
import { createSignal, Show } from "solid-js"
import { Icons } from "@/components/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount)
}

const HIGH_VALUE_THRESHOLD = 50000

export default function CreateTransferPage() {
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [fromBank, setFromBank] = createSignal("revenue-vault")
  const [amount, setAmount] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [reference, setReference] = createSignal("")
  const [approvalNote, setApprovalNote] = createSignal("")

  const banksQuery = useBanks()
  const revenueBalance = useBankBalance(() => "revenue-vault")
  const opsBalance = useBankBalance(() => "operational-hub")
  const mutation = useCreateTransfer()

  const toBank = () => (fromBank() === "revenue-vault" ? "operational-hub" : "revenue-vault")
  const amountValue = () => {
    const v = parseFloat(amount())
    return Number.isNaN(v) ? 0 : v
  }
  const isHighValue = () => amountValue() >= HIGH_VALUE_THRESHOLD
  const fromBankBalance = () =>
    fromBank() === "revenue-vault"
      ? (revenueBalance.data?.balance ?? 0)
      : (opsBalance.data?.balance ?? 0)
  const toBankBalance = () =>
    toBank() === "revenue-vault"
      ? (revenueBalance.data?.balance ?? 0)
      : (opsBalance.data?.balance ?? 0)

  const canSubmit = () =>
    amountValue() > 0 &&
    amountValue() <= fromBankBalance() &&
    description().trim() !== "" &&
    (!isHighValue() || approvalNote().trim() !== "") &&
    !mutation.isPending

  const getBankName = (id: string) =>
    (banksQuery.data || []).find((b: Bank) => b.id === id)?.name || id

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    if (!canSubmit()) return

    const data = {
      fromBankId: fromBank(),
      toBankId: toBank(),
      amount: amountValue(),
      description: description(),
      reference: reference() || undefined,
    }

    const result = validateForm(createTransferSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    mutation.mutate(
      {
        fromBankId: fromBank(),
        toBankId: toBank(),
        amount: amountValue(),
        reference: reference() || undefined,
        description: description() || undefined,
      },
      {
        onSuccess: () => {
          window.location.href = "/transfers"
        },
      }
    )
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <a href="/transfers" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Icons.arrowLeft class="w-5 h-5 text-gray-600" />
        </a>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">New Fund Transfer</h1>
          <p class="text-sm text-gray-500 mt-1">
            Move funds between Revenue Vault and Operational Hub
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Transfer Details</h2>
              <div class="space-y-4">
                {/* From Bank */}
                <div>
                  <p class="block text-sm font-medium text-gray-700 mb-1">From Bank</p>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFromBank("revenue-vault")}
                      class={`p-4 rounded-lg border-2 text-left transition-all ${fromBank() === "revenue-vault" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-50 rounded-lg">
                          <Icons.landmark class="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-900">Revenue Vault</p>
                          <p class="text-xs text-gray-500">Land Bank</p>
                        </div>
                      </div>
                      <p class="text-sm font-semibold text-gray-900 mt-2">
                        {formatCurrency(revenueBalance.data?.balance ?? 0)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFromBank("operational-hub")}
                      class={`p-4 rounded-lg border-2 text-left transition-all ${fromBank() === "operational-hub" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div class="flex items-center gap-3">
                        <div class="p-2 bg-green-50 rounded-lg">
                          <Icons.wallet class="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-900">Operational Hub</p>
                          <p class="text-xs text-gray-500">Security Bank</p>
                        </div>
                      </div>
                      <p class="text-sm font-semibold text-gray-900 mt-2">
                        {formatCurrency(opsBalance.data?.balance ?? 0)}
                      </p>
                    </button>
                  </div>
                </div>

                {/* To Bank */}
                <div>
                  <p class="block text-sm font-medium text-gray-700 mb-1">To Bank</p>
                  <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                      <Icons.arrowRight class="w-4 h-4" />
                      <span>{getBankName(toBank())}</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label for="trans-amount" class="block text-sm font-medium text-gray-700 mb-1">
                    Amount (PHP)
                  </label>
                  <input
                    id="trans-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount()}
                    onInput={e => setAmount(e.currentTarget.value)}
                    placeholder="0.00"
                    class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().amount ? "border-red-300" : "border-gray-200"}`}
                  />
                  <Show when={errors().amount}>
                    <p class="text-xs text-red-600 mt-1">{errors().amount}</p>
                  </Show>
                  <div class="flex items-center gap-2 mt-2">
                    {[10000, 25000, 50000, 100000].map(v => (
                      <button
                        type="button"
                        onClick={() => setAmount(String(v))}
                        class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        {formatCurrency(v)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    for="trans-description"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <input
                    id="trans-description"
                    type="text"
                    value={description()}
                    onInput={e => setDescription(e.currentTarget.value)}
                    placeholder="e.g., Monthly operational expenses"
                    class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().description ? "border-red-300" : "border-gray-200"}`}
                  />
                  <Show when={errors().description}>
                    <p class="text-xs text-red-600 mt-1">{errors().description}</p>
                  </Show>
                </div>

                {/* Reference */}
                <div>
                  <label for="trans-reference" class="block text-sm font-medium text-gray-700 mb-1">
                    Reference <span class="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="trans-reference"
                    type="text"
                    value={reference()}
                    onInput={e => setReference(e.currentTarget.value)}
                    placeholder="e.g., PO-001"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* High value approval */}
                <Show when={isHighValue()}>
                  <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p class="text-sm font-medium text-yellow-800 mb-2">
                      High-value transfer requires approval note
                    </p>
                    <textarea
                      value={approvalNote()}
                      onInput={e => setApprovalNote(e.currentTarget.value)}
                      placeholder="Business purpose..."
                      rows={3}
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                </Show>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">From</span>
                  <span class="font-medium">{getBankName(fromBank())}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">To</span>
                  <span class="font-medium">{getBankName(toBank())}</span>
                </div>
                <div class="border-t pt-3 flex justify-between">
                  <span class="font-medium">Amount</span>
                  <span class="text-xl tabular-nums">
                    {amountValue() > 0 ? formatCurrency(amountValue()) : "—"}
                  </span>
                </div>
                <Show when={amountValue() > 0}>
                  <div class="border-t pt-3 space-y-2 text-xs text-gray-500">
                    <div class="flex justify-between">
                      <span>{getBankName(fromBank())} after</span>
                      <span class="tabular-nums">
                        {formatCurrency(fromBankBalance() - amountValue())}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span>{getBankName(toBank())} after</span>
                      <span class="tabular-nums">
                        {formatCurrency(toBankBalance() + amountValue())}
                      </span>
                    </div>
                  </div>
                </Show>
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
                  {mutation.isPending ? "Processing..." : "Create Transfer"}
                </button>
                <a
                  href="/transfers"
                  class="block w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
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
