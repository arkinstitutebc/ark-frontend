import { Modal } from "@ark/ui"
import { TRAINING_TYPES } from "@data/constants"
import { useCreateBatch, useInstructors, useVenues } from "@data/hooks"
import { createBatchSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, For, Show } from "solid-js"
import { ManageVenuesModal } from "./manage-venues"

interface AddBatchModalProps {
  open: boolean
  onClose: () => void
}

const OTHER_INSTRUCTOR = "__other__"

export function AddBatchModal(props: AddBatchModalProps) {
  const mutation = useCreateBatch()
  const instructorsQuery = useInstructors()
  const venuesQuery = useVenues()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [showManageVenues, setShowManageVenues] = createSignal(false)

  const [trainingName, setTrainingName] = createSignal("")
  const [senator, setSenator] = createSignal("")
  const [startDate, setStartDate] = createSignal("")
  const [endDate, setEndDate] = createSignal("")
  const [venue, setVenue] = createSignal("")
  const [instructorId, setInstructorId] = createSignal("")
  const [instructorOther, setInstructorOther] = createSignal("")

  const resolvedInstructor = createMemo(() => {
    if (instructorId() === OTHER_INSTRUCTOR) return instructorOther().trim()
    if (!instructorId()) return ""
    const match = instructorsQuery.data?.find(t => t.id === instructorId())
    return match?.name ?? ""
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const data = {
      trainingName: trainingName(),
      senator: senator(),
      startDate: startDate(),
      endDate: endDate(),
      venue: venue(),
      instructor: resolvedInstructor(),
    }

    const result = validateForm(createBatchSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    const payload = { ...result.data }
    if (!payload.endDate) payload.endDate = undefined as unknown as string

    mutation.mutate(payload, {
      onSuccess: () => {
        resetForm()
        props.onClose()
      },
    })
  }

  const resetForm = () => {
    setTrainingName("")
    setSenator("")
    setStartDate("")
    setEndDate("")
    setVenue("")
    setInstructorId("")
    setInstructorOther("")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    props.onClose()
  }

  const fieldClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors()[field] ? "border-red-400 dark:border-red-500" : "border-border"}`

  const errorClass = "text-xs text-red-600 dark:text-red-400 mt-1"

  return (
    <Modal open={props.open} onClose={handleClose} title="Add New Batch">
      <form onSubmit={handleSubmit} class="space-y-4" noValidate>
        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Training Type</span>
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
            <p class={errorClass}>{errors().trainingName}</p>
          </Show>
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Sponsor</span>
          <input
            type="text"
            value={senator()}
            onInput={e => setSenator(e.target.value)}
            placeholder="e.g., Sen. Alan Cayetano or Juan Dela Cruz"
            class={fieldClass("senator")}
          />
          <Show when={errors().senator}>
            <p class={errorClass}>{errors().senator}</p>
          </Show>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Start Date</span>
            <input
              type="date"
              value={startDate()}
              onInput={e => setStartDate(e.target.value)}
              class={fieldClass("startDate")}
            />
            <Show when={errors().startDate}>
              <p class={errorClass}>{errors().startDate}</p>
            </Show>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-foreground mb-1 flex items-center justify-between">
              <span>End Date</span>
              <span class="text-xs text-muted font-normal">Optional</span>
            </span>
            <input
              type="date"
              value={endDate()}
              onInput={e => setEndDate(e.target.value)}
              min={startDate() || undefined}
              class={fieldClass("endDate")}
            />
            <Show when={errors().endDate}>
              <p class={errorClass}>{errors().endDate}</p>
            </Show>
          </label>
        </div>

        <label class="block">
          <span class="text-sm font-medium text-foreground mb-1 flex items-center justify-between">
            <span>Venue</span>
            <button
              type="button"
              onClick={() => setShowManageVenues(true)}
              class="text-xs font-normal text-primary hover:text-primary/80 transition-colors"
            >
              Manage venues
            </button>
          </span>
          <input
            type="text"
            value={venue()}
            onInput={e => setVenue(e.target.value)}
            placeholder="Pick a venue or type a new one"
            list="venue-suggestions"
            class={fieldClass("venue")}
          />
          <datalist id="venue-suggestions">
            <For each={venuesQuery.data || []}>{v => <option value={v.name} />}</For>
          </datalist>
          <Show when={errors().venue}>
            <p class={errorClass}>{errors().venue}</p>
          </Show>
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Instructor</span>
          <select
            value={instructorId()}
            onChange={e => setInstructorId(e.target.value)}
            class={fieldClass("instructor")}
          >
            <option value="">Select instructor</option>
            <For each={instructorsQuery.data || []}>
              {i => (
                <option value={i.id}>
                  {i.name}
                  {i.specialization ? ` — ${i.specialization}` : ""}
                </option>
              )}
            </For>
            <option value={OTHER_INSTRUCTOR}>Other (type below)</option>
          </select>
          <Show when={instructorId() === OTHER_INSTRUCTOR}>
            <input
              type="text"
              value={instructorOther()}
              onInput={e => setInstructorOther(e.target.value)}
              placeholder="e.g., Chef Maria Santos"
              class={`${fieldClass("instructor")} mt-2`}
            />
          </Show>
          <Show when={errors().instructor}>
            <p class={errorClass}>{errors().instructor}</p>
          </Show>
        </label>

        <Show when={mutation.isError}>
          <p class="text-sm text-red-600 dark:text-red-400">{mutation.error?.message}</p>
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
            {mutation.isPending ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </form>
      <ManageVenuesModal open={showManageVenues()} onClose={() => setShowManageVenues(false)} />
    </Modal>
  )
}
