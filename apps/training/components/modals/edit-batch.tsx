import { formErrorClass, formInputClass, formLabelClass, Modal, ModalFooter, Select } from "@ark/ui"
import { TRAINING_TYPES } from "@data/constants"
import { useInstructors, useUpdateBatch, useVenues } from "@data/hooks"
import { updateBatchSchema } from "@data/schemas"
import type { Batch } from "@data/types"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, Show } from "solid-js"
import { ManageVenuesModal } from "./manage-venues"

interface EditBatchModalProps {
  open: boolean
  onClose: () => void
  batch: Batch
}

const TRAINING_LEVELS = ["NC I", "NC II", "NC III", "NC IV", "NC V"] as const
const STATUSES: Batch["status"][] = ["Not Started", "In Progress", "Completed", "On Hold"]
const OTHER_INSTRUCTOR = "__other__"

export function EditBatchModal(props: EditBatchModalProps) {
  const mutation = useUpdateBatch()
  const venuesQuery = useVenues()
  const instructorsQuery = useInstructors()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [showManageVenues, setShowManageVenues] = createSignal(false)

  const [trainingName, setTrainingName] = createSignal(props.batch.trainingName)
  const [trainingLevel, setTrainingLevel] = createSignal(props.batch.trainingLevel)
  const [senator, setSenator] = createSignal(props.batch.senator)
  const [startDate, setStartDate] = createSignal(props.batch.startDate)
  const [endDate, setEndDate] = createSignal(props.batch.endDate)
  const [venue, setVenue] = createSignal(props.batch.venue)
  const [instructorOther, setInstructorOther] = createSignal("")
  const [instructorChoice, setInstructorChoice] = createSignal<string>(OTHER_INSTRUCTOR)
  const [status, setStatus] = createSignal(props.batch.status)

  // Derive instructor choice + free-text on mount based on whether existing
  // instructor name matches one in the directory.
  createMemo(() => {
    if (!instructorsQuery.data) return
    const existing = props.batch.instructor
    const match = instructorsQuery.data.find(i => i.name === existing)
    if (match) {
      setInstructorChoice(match.id)
      setInstructorOther("")
    } else {
      setInstructorChoice(OTHER_INSTRUCTOR)
      setInstructorOther(existing ?? "")
    }
  })

  const trainingTypeOptions = createMemo(() => TRAINING_TYPES.map(t => ({ label: t, value: t })))

  const trainingLevelOptions = createMemo(() => TRAINING_LEVELS.map(l => ({ label: l, value: l })))

  const statusOptions = createMemo(() => STATUSES.map(s => ({ label: s, value: s })))

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
    if (instructorChoice() === OTHER_INSTRUCTOR) return instructorOther().trim()
    const match = instructorsQuery.data?.find(i => i.id === instructorChoice())
    return match?.name ?? ""
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const data = {
      trainingName: trainingName(),
      trainingLevel: trainingLevel(),
      senator: senator(),
      startDate: startDate(),
      endDate: endDate(),
      venue: venue(),
      instructor: resolvedInstructor(),
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
    setStatus(props.batch.status)
    setErrors({})
    props.onClose()
  }

  const inputClass = (field: string) => formInputClass({ error: !!errors()[field] })
  const errorClass = formErrorClass
  const labelClass = formLabelClass

  return (
    <Modal open={props.open} onClose={handleClose} title="Edit Batch">
      <form onSubmit={handleSubmit} class="space-y-4" noValidate>
        <div>
          <span class={labelClass}>Training Type</span>
          <Select
            options={trainingTypeOptions()}
            value={trainingName()}
            onChange={v => setTrainingName(v)}
            placeholder="Select training type"
            ariaLabel="Training type"
          />
          <Show when={errors().trainingName}>
            <p class={errorClass}>{errors().trainingName}</p>
          </Show>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <span class={labelClass}>Level</span>
            <Select
              options={trainingLevelOptions()}
              value={trainingLevel() ?? undefined}
              onChange={v => setTrainingLevel(v as Batch["trainingLevel"])}
              placeholder="Select level"
              ariaLabel="Training level"
            />
            <Show when={errors().trainingLevel}>
              <p class={errorClass}>{errors().trainingLevel}</p>
            </Show>
          </div>
          <div>
            <span class={labelClass}>Status</span>
            <Select
              options={statusOptions()}
              value={status()}
              onChange={v => setStatus(v as Batch["status"])}
              placeholder="Select status"
              ariaLabel="Status"
            />
            <Show when={errors().status}>
              <p class={errorClass}>{errors().status}</p>
            </Show>
          </div>
        </div>

        <label class="block">
          <span class={labelClass}>Sponsor</span>
          <input
            type="text"
            value={senator() ?? ""}
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
              value={startDate() ?? ""}
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
              value={endDate() ?? ""}
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
            value={venue() ?? undefined}
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
            value={instructorChoice()}
            onChange={v => setInstructorChoice(v)}
            placeholder={instructorsQuery.isLoading ? "Loading instructors…" : "Select instructor"}
            disabled={instructorsQuery.isLoading}
            ariaLabel="Instructor"
          />
          <Show when={instructorChoice() === OTHER_INSTRUCTOR}>
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
          submitLabel={mutation.isPending ? "Saving..." : "Save Changes"}
        />
      </form>
      <ManageVenuesModal open={showManageVenues()} onClose={() => setShowManageVenues(false)} />
    </Modal>
  )
}
