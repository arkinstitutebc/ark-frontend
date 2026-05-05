import { useCreateBatch } from "@data/hooks"
import { createBatchSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createSignal, Show } from "solid-js"
import { Modal } from "@/components/ui/modal"

interface AddBatchModalProps {
  open: boolean
  onClose: () => void
}

const TRAINING_TYPES = [
  "Cookery NC II",
  "Housekeeping NC II",
  "Food & Beverage Services NC II",
  "Bartending NC II",
  "Bread & Pastry Production NC II",
  "Front Office Services NC II",
]

export function AddBatchModal(props: AddBatchModalProps) {
  const mutation = useCreateBatch()
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  const [trainingName, setTrainingName] = createSignal("")
  const [senator, setSenator] = createSignal("")
  const [startDate, setStartDate] = createSignal("")
  const [endDate, setEndDate] = createSignal("")
  const [venue, setVenue] = createSignal("")
  const [instructor, setInstructor] = createSignal("")

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const data = {
      trainingName: trainingName(),
      senator: senator(),
      startDate: startDate(),
      endDate: endDate(),
      venue: venue(),
      instructor: instructor(),
    }

    const result = validateForm(createBatchSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    mutation.mutate(
      { ...result.data, batchCode: `BATCH-${Date.now()}` },
      {
        onSuccess: () => {
          resetForm()
          props.onClose()
        },
      }
    )
  }

  const resetForm = () => {
    setTrainingName("")
    setSenator("")
    setStartDate("")
    setEndDate("")
    setVenue("")
    setInstructor("")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    props.onClose()
  }

  const fieldClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors()[field] ? "border-red-300" : "border-gray-200"}`

  return (
    <Modal open={props.open} onClose={handleClose} title="Add New Batch">
      <form onSubmit={handleSubmit} class="space-y-4">
        <label class="block">
          <span class="block text-sm font-medium text-gray-700 mb-1">Training Type</span>
          <select
            value={trainingName()}
            onChange={e => setTrainingName(e.target.value)}
            class={fieldClass("trainingName")}
          >
            <option value="">Select training type</option>
            {TRAINING_TYPES.map(type => (
              <option value={type}>{type}</option>
            ))}
          </select>
          <Show when={errors().trainingName}>
            <p class="text-xs text-red-600 mt-1">{errors().trainingName}</p>
          </Show>
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-700 mb-1">Senator Sponsor</span>
          <input
            type="text"
            value={senator()}
            onInput={e => setSenator(e.target.value)}
            placeholder="e.g., Sen. Juan Dela Cruz"
            class={fieldClass("senator")}
          />
          <Show when={errors().senator}>
            <p class="text-xs text-red-600 mt-1">{errors().senator}</p>
          </Show>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1">Start Date</span>
            <input
              type="date"
              value={startDate()}
              onInput={e => setStartDate(e.target.value)}
              class={fieldClass("startDate")}
            />
            <Show when={errors().startDate}>
              <p class="text-xs text-red-600 mt-1">{errors().startDate}</p>
            </Show>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1">End Date</span>
            <input
              type="date"
              value={endDate()}
              onInput={e => setEndDate(e.target.value)}
              class={fieldClass("endDate")}
            />
            <Show when={errors().endDate}>
              <p class="text-xs text-red-600 mt-1">{errors().endDate}</p>
            </Show>
          </label>
        </div>

        <label class="block">
          <span class="block text-sm font-medium text-gray-700 mb-1">Venue</span>
          <input
            type="text"
            value={venue()}
            onInput={e => setVenue(e.target.value)}
            placeholder="e.g., Ark Institute Training Center"
            class={fieldClass("venue")}
          />
          <Show when={errors().venue}>
            <p class="text-xs text-red-600 mt-1">{errors().venue}</p>
          </Show>
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-700 mb-1">Instructor</span>
          <input
            type="text"
            value={instructor()}
            onInput={e => setInstructor(e.target.value)}
            placeholder="e.g., Chef Maria Santos"
            class={fieldClass("instructor")}
          />
          <Show when={errors().instructor}>
            <p class="text-xs text-red-600 mt-1">{errors().instructor}</p>
          </Show>
        </label>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
