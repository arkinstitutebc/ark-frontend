import { Modal, ModalFooter, Select } from "@ark/ui"
import { TRAINING_TYPES } from "@data/constants"
import { useCreateBatch, useInstructors, useVenues } from "@data/hooks"
import { createBatchSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, Show } from "solid-js"
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

  const trainingTypeOptions = createMemo(() => TRAINING_TYPES.map(t => ({ label: t, value: t })))

  const venueOptions = createMemo(() =>
    (venuesQuery.data ?? []).map(v => ({ label: v.name, value: v.name }))
  )

  const instructorOptions = createMemo(() => [
    ...(instructorsQuery.data ?? []).map(i => ({
      label: i.specialization ? `${i.name} — ${i.specialization}` : i.name,
      value: i.id,
    })),
    { label: "Other (type below)", value: OTHER_INSTRUCTOR },
  ])

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

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors()[field] ? "border-red-400 dark:border-red-500" : "border-border"}`

  const errorClass = "text-xs text-red-600 dark:text-red-400 mt-1"
  const labelClass = "block text-sm font-medium text-foreground mb-1"

  return (
    <Modal open={props.open} onClose={handleClose} title="Add New Batch">
      <form onSubmit={handleSubmit} class="space-y-4" noValidate>
        <div>
          <span class={labelClass}>Training Type</span>
          <Select
            options={trainingTypeOptions()}
            value={trainingName() || undefined}
            onChange={v => setTrainingName(v)}
            placeholder="Select training type"
            ariaLabel="Training type"
          />
          <Show when={errors().trainingName}>
            <p class={errorClass}>{errors().trainingName}</p>
          </Show>
        </div>

        <label class="block">
          <span class={labelClass}>Sponsor</span>
          <input
            type="text"
            value={senator()}
            onInput={e => setSenator(e.target.value)}
            placeholder="e.g., Sen. Alan Cayetano or Juan Dela Cruz"
            class={inputClass("senator")}
          />
          <Show when={errors().senator}>
            <p class={errorClass}>{errors().senator}</p>
          </Show>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class={labelClass}>Start Date</span>
            <input
              type="date"
              value={startDate()}
              onInput={e => setStartDate(e.target.value)}
              class={inputClass("startDate")}
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
              class={inputClass("endDate")}
            />
            <Show when={errors().endDate}>
              <p class={errorClass}>{errors().endDate}</p>
            </Show>
          </label>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="block text-sm font-medium text-foreground">Venue</span>
            <button
              type="button"
              onClick={() => setShowManageVenues(true)}
              class="text-xs font-normal text-primary hover:text-primary/80 transition-colors"
            >
              Manage venues
            </button>
          </div>
          <Select
            options={venueOptions()}
            value={venue() || undefined}
            onChange={v => setVenue(v)}
            placeholder={
              venuesQuery.isLoading
                ? "Loading venues…"
                : venueOptions().length
                  ? "Select a venue"
                  : "No venues — use Manage venues to add one"
            }
            disabled={venuesQuery.isLoading}
            ariaLabel="Venue"
          />
          <Show when={errors().venue}>
            <p class={errorClass}>{errors().venue}</p>
          </Show>
        </div>

        <div>
          <span class={labelClass}>Instructor</span>
          <Select
            options={instructorOptions()}
            value={instructorId() || undefined}
            onChange={v => setInstructorId(v)}
            placeholder={instructorsQuery.isLoading ? "Loading instructors…" : "Select instructor"}
            disabled={instructorsQuery.isLoading}
            ariaLabel="Instructor"
          />
          <Show when={instructorId() === OTHER_INSTRUCTOR}>
            <input
              type="text"
              value={instructorOther()}
              onInput={e => setInstructorOther(e.target.value)}
              placeholder="e.g., Chef Maria Santos"
              class={`${inputClass("instructor")} mt-2`}
            />
          </Show>
          <Show when={errors().instructor}>
            <p class={errorClass}>{errors().instructor}</p>
          </Show>
        </div>

        <Show when={mutation.isError}>
          <p class="text-sm text-red-600 dark:text-red-400">{mutation.error?.message}</p>
        </Show>

        <ModalFooter
          onCancel={handleClose}
          submitInForm
          submitting={mutation.isPending}
          submitLabel={mutation.isPending ? "Creating..." : "Create Batch"}
        />
      </form>
      <ManageVenuesModal open={showManageVenues()} onClose={() => setShowManageVenues(false)} />
    </Modal>
  )
}
