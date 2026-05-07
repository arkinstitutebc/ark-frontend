import { Modal } from "@ark/ui"
import { TRAINING_TYPES } from "@data/constants"
import { useUpdateBatch } from "@data/hooks"
import { updateBatchSchema } from "@data/schemas"
import type { Batch } from "@data/types"
import { validateForm } from "@data/validate"
import { createSignal, Show } from "solid-js"

interface EditBatchModalProps {
  open: boolean
  onClose: () => void
  batch: Batch
}

const TRAINING_LEVELS = ["NC I", "NC II", "NC III", "NC IV", "NC V"] as const
const STATUSES: Batch["status"][] = ["Not Started", "In Progress", "Completed", "On Hold"]

export function EditBatchModal(props: EditBatchModalProps) {
  const mutation = useUpdateBatch()
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  const [trainingName, setTrainingName] = createSignal(props.batch.trainingName)
  const [trainingLevel, setTrainingLevel] = createSignal(props.batch.trainingLevel)
  const [senator, setSenator] = createSignal(props.batch.senator)
  const [startDate, setStartDate] = createSignal(props.batch.startDate)
  const [endDate, setEndDate] = createSignal(props.batch.endDate)
  const [venue, setVenue] = createSignal(props.batch.venue)
  const [instructor, setInstructor] = createSignal(props.batch.instructor)
  const [status, setStatus] = createSignal(props.batch.status)

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const data = {
      trainingName: trainingName(),
      trainingLevel: trainingLevel(),
      senator: senator(),
      startDate: startDate(),
      endDate: endDate(),
      venue: venue(),
      instructor: instructor(),
      status: status(),
    }

    const result = validateForm(updateBatchSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    mutation.mutate(
      { id: props.batch.id, ...(result.data as Partial<Batch>) },
      { onSuccess: () => props.onClose() }
    )
  }

  const handleClose = () => {
    setTrainingName(props.batch.trainingName)
    setTrainingLevel(props.batch.trainingLevel)
    setSenator(props.batch.senator)
    setStartDate(props.batch.startDate)
    setEndDate(props.batch.endDate)
    setVenue(props.batch.venue)
    setInstructor(props.batch.instructor)
    setStatus(props.batch.status)
    setErrors({})
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={handleClose} title="Edit Batch">
      <form onSubmit={handleSubmit} class="space-y-4">
        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Training Type</span>
          <select
            value={trainingName()}
            onChange={e => setTrainingName(e.target.value)}
            required
            class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().trainingName ? "border-red-300" : "border-border"}`}
          >
            {TRAINING_TYPES.map(type => (
              <option value={type}>{type}</option>
            ))}
          </select>
          <Show when={errors().trainingName}>
            <p class="text-xs text-red-600 mt-1">{errors().trainingName}</p>
          </Show>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Level</span>
            <select
              value={trainingLevel()}
              onChange={e => setTrainingLevel(e.target.value as Batch["trainingLevel"])}
              required
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().trainingLevel ? "border-red-300" : "border-border"}`}
            >
              {TRAINING_LEVELS.map(level => (
                <option value={level}>{level}</option>
              ))}
            </select>
            <Show when={errors().trainingLevel}>
              <p class="text-xs text-red-600 mt-1">{errors().trainingLevel}</p>
            </Show>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Status</span>
            <select
              value={status()}
              onChange={e => setStatus(e.target.value as Batch["status"])}
              required
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().status ? "border-red-300" : "border-border"}`}
            >
              {STATUSES.map(s => (
                <option value={s}>{s}</option>
              ))}
            </select>
            <Show when={errors().status}>
              <p class="text-xs text-red-600 mt-1">{errors().status}</p>
            </Show>
          </label>
        </div>

        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Senator Sponsor</span>
          <input
            type="text"
            value={senator()}
            onInput={e => setSenator(e.target.value)}
            required
            placeholder="e.g., Sen. Juan Dela Cruz"
            class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().senator ? "border-red-300" : "border-border"}`}
          />
          <Show when={errors().senator}>
            <p class="text-xs text-red-600 mt-1">{errors().senator}</p>
          </Show>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Start Date</span>
            <input
              type="date"
              value={startDate()}
              onInput={e => setStartDate(e.target.value)}
              required
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().startDate ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().startDate}>
              <p class="text-xs text-red-600 mt-1">{errors().startDate}</p>
            </Show>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">End Date</span>
            <input
              type="date"
              value={endDate()}
              onInput={e => setEndDate(e.target.value)}
              required
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().endDate ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().endDate}>
              <p class="text-xs text-red-600 mt-1">{errors().endDate}</p>
            </Show>
          </label>
        </div>

        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Venue</span>
          <input
            type="text"
            value={venue()}
            onInput={e => setVenue(e.target.value)}
            required
            class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().venue ? "border-red-300" : "border-border"}`}
          />
          <Show when={errors().venue}>
            <p class="text-xs text-red-600 mt-1">{errors().venue}</p>
          </Show>
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Instructor</span>
          <input
            type="text"
            value={instructor()}
            onInput={e => setInstructor(e.target.value)}
            required
            class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().instructor ? "border-red-300" : "border-border"}`}
          />
          <Show when={errors().instructor}>
            <p class="text-xs text-red-600 mt-1">{errors().instructor}</p>
          </Show>
        </label>

        <Show when={mutation.isError}>
          <p class="text-sm text-red-600">{mutation.error?.message}</p>
        </Show>

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
            disabled={mutation.isPending}
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
