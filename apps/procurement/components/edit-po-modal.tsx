import { formErrorClass, formInputClass, formLabelClass, Modal, ModalFooter, Select } from "@ark/ui"
import { useUpdatePo } from "@data/hooks"
import type { PurchaseOrder } from "@data/types"
import { createEffect, createSignal, Show } from "solid-js"

interface EditPoModalProps {
  open: boolean
  onClose: () => void
  po: PurchaseOrder | null
}

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Cancelled", value: "cancelled" },
]

export function EditPoModal(props: EditPoModalProps) {
  const updateMutation = useUpdatePo()

  const [supplier, setSupplier] = createSignal("")
  const [notes, setNotes] = createSignal("")
  const [estimatedDelivery, setEstimatedDelivery] = createSignal("")
  const [status, setStatus] = createSignal<string>("draft")
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  // Re-hydrate fields each time the modal opens with a fresh PO.
  createEffect(() => {
    if (!props.open || !props.po) return
    const po = props.po
    setSupplier(po.supplier ?? "")
    setNotes(po.notes ?? "")
    setEstimatedDelivery(po.estimatedDelivery ?? "")
    setStatus(po.status ?? "draft")
    setErrors({})
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const po = props.po
    if (!po) return

    if (!supplier().trim()) {
      setErrors({ supplier: "Supplier is required" })
      return
    }

    updateMutation.mutate(
      {
        id: po.id,
        supplier: supplier().trim(),
        notes: notes().trim() || undefined,
        estimatedDelivery: estimatedDelivery() || undefined,
        status: status() as "draft" | "sent" | "cancelled",
      },
      {
        onSuccess: () => {
          props.onClose()
        },
      }
    )
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Edit Purchase Order" size="md">
      <Show when={props.po}>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="po-edit-supplier" class={formLabelClass}>
              Supplier <span class="text-red-500">*</span>
            </label>
            <input
              id="po-edit-supplier"
              type="text"
              value={supplier()}
              onInput={e => setSupplier(e.currentTarget.value)}
              class={formInputClass({ error: !!errors().supplier })}
            />
            <Show when={errors().supplier}>
              <p class={formErrorClass}>{errors().supplier}</p>
            </Show>
          </div>

          <div>
            <label for="po-edit-delivery" class={formLabelClass}>
              Estimated Delivery
            </label>
            <input
              id="po-edit-delivery"
              type="date"
              value={estimatedDelivery()}
              onInput={e => setEstimatedDelivery(e.currentTarget.value)}
              class={formInputClass({})}
            />
          </div>

          <div>
            <span class={formLabelClass}>Status</span>
            <Select
              options={statusOptions}
              value={status()}
              onChange={v => setStatus(v)}
              ariaLabel="Status"
            />
          </div>

          <div>
            <label for="po-edit-notes" class={formLabelClass}>
              Notes
            </label>
            <textarea
              id="po-edit-notes"
              rows={3}
              value={notes()}
              onInput={e => setNotes(e.currentTarget.value)}
              class={formInputClass({})}
            />
          </div>

          <Show when={updateMutation.isError}>
            <p class={formErrorClass}>{updateMutation.error?.message}</p>
          </Show>

          <ModalFooter
            onCancel={props.onClose}
            submitInForm
            submitLabel="Save Changes"
            submitting={updateMutation.isPending}
          />
        </form>
      </Show>
    </Modal>
  )
}
