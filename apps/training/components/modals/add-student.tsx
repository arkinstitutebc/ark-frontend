import { Modal } from "@ark/ui"
import { useBatches } from "@data/hooks"
import { createStudentSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createSignal, For, Show } from "solid-js"

interface AddStudentModalProps {
  open: boolean
  onClose: () => void
  defaultBatchId?: string
}

export function AddStudentModal(props: AddStudentModalProps) {
  const batchesQuery = useBatches()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [firstName, setFirstName] = createSignal("")
  const [lastName, setLastName] = createSignal("")
  const [batchId, setBatchId] = createSignal(props.defaultBatchId || "")

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const data = {
      firstName: firstName(),
      lastName: lastName(),
      batchId: batchId(),
    }

    const result = validateForm(createStudentSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    console.log(result.data)
    props.onClose()
  }

  const resetForm = () => {
    setFirstName("")
    setLastName("")
    setBatchId(props.defaultBatchId || "")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={handleClose} title="Add New Student">
      <form onSubmit={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">First Name</span>
            <input
              type="text"
              value={firstName()}
              onInput={e => setFirstName(e.target.value)}
              required
              placeholder="Juan"
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().firstName ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().firstName}>
              <p class="text-xs text-red-600 mt-1">{errors().firstName}</p>
            </Show>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Last Name</span>
            <input
              type="text"
              value={lastName()}
              onInput={e => setLastName(e.target.value)}
              required
              placeholder="Dela Cruz"
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().lastName ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().lastName}>
              <p class="text-xs text-red-600 mt-1">{errors().lastName}</p>
            </Show>
          </label>
        </div>

        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Assign to Batch</span>
          <select
            value={batchId()}
            onChange={e => setBatchId(e.target.value)}
            required
            class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().batchId ? "border-red-300" : "border-border"}`}
          >
            <option value="">Select batch</option>
            <For each={batchesQuery.data || []}>
              {batch => (
                <option value={batch.id}>
                  {batch.batchCode} - {batch.trainingName}
                </option>
              )}
            </For>
          </select>
          <Show when={errors().batchId}>
            <p class="text-xs text-red-600 mt-1">{errors().batchId}</p>
          </Show>
        </label>

        <div class="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Add Student
          </button>
        </div>
      </form>
    </Modal>
  )
}
