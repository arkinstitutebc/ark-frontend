import { adjustStockSchema } from "@data/schemas"
import type { StockItem } from "@data/types"
import { validateForm } from "@data/validate"
import { createSignal, Show } from "solid-js"
import { Icons } from "./ui/icons"
import { Modal } from "./ui/modal"

interface AdjustStockModalProps {
  open: boolean
  onClose: () => void
  item: StockItem | null
  onSubmit: (adjustment: { quantity: number; reason: string; notes: string }) => void
}

const ADJUSTMENT_REASONS = [
  { value: "damaged", label: "Damaged / Broken", icon: "alert" },
  { value: "lost", label: "Lost / Missing", icon: "search" },
  { value: "expired", label: "Expired", icon: "clock" },
  { value: "issued", label: "Issued to Students", icon: "users" },
  { value: "returned", label: "Returned from Students", icon: "arrowLeft" },
  { value: "correction", label: "Count Correction", icon: "refresh" },
  { value: "other", label: "Other", icon: "more" },
] as const

export function AdjustStockModal(props: AdjustStockModalProps) {
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [quantity, setQuantity] = createSignal(0)
  const [reason, setReason] = createSignal("")
  const [notes, setNotes] = createSignal("")

  const currentQuantity = () => props.item?.quantityOnHand ?? 0
  const itemName = () => props.item?.name ?? ""
  const itemUnit = () => props.item?.unit ?? ""

  const newQuantity = () => currentQuantity() + quantity()
  const isValid = () => quantity() !== 0 && reason() !== "" && newQuantity() >= 0

  const handleSubmit = () => {
    if (!isValid()) return

    const data = {
      quantity: quantity(),
      reason: reason(),
      notes: notes() || undefined,
    }

    const result = validateForm(adjustStockSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    props.onSubmit({ quantity: quantity(), reason: reason(), notes: notes() })
    // Modal close is handled by onSuccess callback in the parent
  }

  const handleClose = () => {
    setQuantity(0)
    setReason("")
    setNotes("")
    setErrors({})
    props.onClose()
  }

  const quickAdjust = (amount: number) => {
    setQuantity(q => Math.max(-currentQuantity(), q + amount))
  }

  const getChangeColor = () => {
    if (quantity() === 0) return "text-muted"
    if (quantity() > 0) return "text-green-600"
    return "text-red-600"
  }

  const getChangeBg = () => {
    if (quantity() === 0) return "bg-surface-muted"
    if (quantity() > 0) return "bg-green-50"
    return "bg-red-50"
  }

  return (
    <Modal open={props.open} onClose={handleClose} title="Adjust Stock">
      <Show when={props.item}>
        <div class="flex flex-col max-h-[70vh]">
          {/* Scrollable Content */}
          <div class="flex-1 overflow-y-auto space-y-5 pr-2">
            {/* Item Info Card */}
            <div class="bg-surface-muted rounded-xl p-4">
              <p class="text-xs text-muted mb-1">Item</p>
              <p class="text-base font-medium text-foreground">{itemName()}</p>

              {/* Quantity Comparison */}
              <div class="flex items-center justify-center gap-4 mt-4">
                <div class="text-center">
                  <p class="text-xs text-muted uppercase tracking-wide mb-1">Current</p>
                  <p class="text-2xl text-foreground">
                    {currentQuantity()}
                    <span class="text-sm font-normal text-muted ml-1">{itemUnit()}</span>
                  </p>
                </div>

                <div class="flex flex-col items-center">
                  <div
                    class={`w-10 h-10 rounded-full ${getChangeBg()} flex items-center justify-center`}
                  >
                    <Icons.arrowRight class="w-5 h-5 text-muted" />
                  </div>
                  <p class={`text-xs font-medium mt-1 ${getChangeColor()}`}>
                    {quantity() > 0 ? "+" : quantity() < 0 ? "" : ""}
                    {quantity()}
                  </p>
                </div>

                <div class="text-center">
                  <p class="text-xs text-muted uppercase tracking-wide mb-1">New</p>
                  <p
                    class={`text-2xl ${
                      newQuantity() < 0
                        ? "text-red-600"
                        : newQuantity() < currentQuantity()
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {newQuantity()}
                    <span class="text-sm font-normal text-muted ml-1">{itemUnit()}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Adjust Buttons */}
            <div>
              <p class="text-sm font-medium text-foreground mb-3">Quick Adjust</p>
              <div class="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => quickAdjust(-10)}
                  class="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Icons.minus class="w-4 h-4 inline mr-1" />
                  10
                </button>
                <button
                  type="button"
                  onClick={() => quickAdjust(-5)}
                  class="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Icons.minus class="w-4 h-4 inline mr-1" />5
                </button>
                <button
                  type="button"
                  onClick={() => quickAdjust(-1)}
                  class="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Icons.minus class="w-4 h-4 inline mr-1" />1
                </button>
                <button
                  type="button"
                  onClick={() => setQuantity(0)}
                  class="px-3 py-2 text-sm font-medium text-muted bg-surface-muted border border-border rounded-lg hover:bg-surface-muted transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => quickAdjust(1)}
                  class="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Icons.plus class="w-4 h-4 inline mr-1" />1
                </button>
                <button
                  type="button"
                  onClick={() => quickAdjust(5)}
                  class="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Icons.plus class="w-4 h-4 inline mr-1" />5
                </button>
                <button
                  type="button"
                  onClick={() => quickAdjust(10)}
                  class="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Icons.plus class="w-4 h-4 inline mr-1" />
                  10
                </button>
              </div>
            </div>

            {/* Manual Input */}
            <div>
              <label for="adjustment-amount" class="block text-sm font-medium text-foreground mb-2">
                Adjustment Amount
              </label>
              <div class="relative">
                <input
                  id="adjustment-amount"
                  type="number"
                  value={quantity() === 0 ? "" : quantity()}
                  onInput={e => setQuantity(parseInt(e.currentTarget.value, 10) || 0)}
                  class={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().quantity ? "border-red-300" : "border-border"}`}
                  placeholder="Enter amount (use negative to subtract)"
                />
                <Show when={errors().quantity}>
                  <p class="text-xs text-red-600 mt-1">{errors().quantity}</p>
                </Show>
                <Show when={quantity() !== 0}>
                  <p class="text-xs mt-1.5">
                    {quantity() > 0 ? (
                      <span class="text-green-600">
                        Adding {quantity()} {itemUnit()}
                      </span>
                    ) : (
                      <span class="text-red-600">
                        Removing {Math.abs(quantity())} {itemUnit()}
                      </span>
                    )}
                  </p>
                </Show>
              </div>
            </div>

            {/* Reason Dropdown */}
            <div>
              <label for="adjustment-reason" class="block text-sm font-medium text-foreground mb-2">
                Reason <span class="text-red-500">*</span>
              </label>
              <select
                id="adjustment-reason"
                value={reason()}
                onChange={e => setReason(e.currentTarget.value)}
                class={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface ${errors().reason ? "border-red-300" : "border-border"}`}
              >
                <option value="">Select a reason...</option>
                {ADJUSTMENT_REASONS.map(r => (
                  <option value={r.value}>{r.label}</option>
                ))}
              </select>
              <Show when={errors().reason}>
                <p class="text-xs text-red-600 mt-1">{errors().reason}</p>
              </Show>
            </div>

            {/* Notes */}
            <div>
              <label for="adjustment-notes" class="block text-sm font-medium text-foreground mb-2">
                Notes <span class="text-muted font-normal">(Optional)</span>
              </label>
              <textarea
                id="adjustment-notes"
                value={notes()}
                onChange={e => setNotes(e.currentTarget.value)}
                rows={2}
                class="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Add any additional details..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid()}
              class={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isValid() ? "bg-primary hover:bg-primary/90" : "bg-muted cursor-not-allowed"
              }`}
            >
              Update Stock
            </button>
          </div>
        </div>
      </Show>
    </Modal>
  )
}
