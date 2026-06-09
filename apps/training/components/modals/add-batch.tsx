import { formErrorClass, formInputClass, formLabelClass, Modal, ModalFooter, Select } from "@ark/ui"
import { useCreateBatch, useInstructors, useVenues } from "@data/hooks"
import { createBatchSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, Show } from "solid-js"
import { OTHER_INSTRUCTOR, trainingTypeOptions } from "@/components/forms/options"
import { ManageVenuesModal } from "./manage-venues"

interface AddBatchModalProps {
  open: boolean
  onClose: () => void
}

export function AddBatchModal(props: AddBatchModalProps) {
  const mutation = useCreateBatch()
  const instructorsQuery = useInstructors()
  const venuesQuery = useVenues()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [showManageVenues, setShowManageVenues] = createSignal(false)

  const [trainingName, setTrainingName] = createSignal("")
  const [batchNo, setBatchNo] = createSignal("")
  const [rqm, setRqm] = createSignal("")
  const [senator, setSenator] = createSignal("")
  const [startDate, setStartDate] = createSignal("")
  const [endDate, setEndDate] = createSignal("")
  const [weeklySchedule, setWeeklySchedule] = createSignal("")
  const [venue, setVenue] = createSignal("")
  const [instructorId, setInstructorId] = createSignal("")
  const [instructorOther, setInstructorOther] = createSignal("")

  const trainingOptions = createMemo(trainingTypeOptions)

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
      batchNo: batchNo().trim(),
      rqm: rqm().trim(),
      senator: senator(),
      startDate: startDate(),
      endDate: endDate(),
      weeklySchedule: weeklySchedule().trim(),
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
    if (!payload.batchNo) payload.batchNo = undefined as unknown as string
    if (!payload.rqm) payload.rqm = undefined as unknown as string
    if (!payload.weeklySchedule) payload.weeklySchedule = undefined as unknown as string

    mutation.mutate(payload, {
      onSuccess: () => {
        resetForm()
        props.onClose()
      },
    })
  }

  const resetForm = () => {
    setTrainingName("")
    setBatchNo("")
    setRqm("")
    setSenator("")
    setStartDate("")
    setEndDate("")
    setWeeklySchedule("")
    setVenue("")
    setInstructorId("")
    setInstructorOther("")
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    props.onClose()
  }

  const inputClass = (field: string) => formInputClass({ error: !!errors()[field] })
  const errorClass = formErrorClass
  const labelClass = formLabelClass

  return (
    <Modal open={props.open} onClose={handleClose} title="Create training batch" size="xl">
      <form onSubmit={handleSubmit} class="space-y-5" noValidate>
        <div class="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Batch setup</p>
          <p class="mt-1 text-sm text-muted">
            Set the program, sponsor, schedule, venue, and trainer for the class.
          </p>
        </div>

        <div>
          <span class={labelClass}>Training Type</span>
          <Select
            options={trainingOptions()}
            value={trainingName() || undefined}
            onChange={v => setTrainingName(v)}
            placeholder="Select training type"
            ariaLabel="Training type"
          />
          <Show when={errors().trainingName}>
            <p class={errorClass}>{errors().trainingName}</p>
          </Show>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium text-foreground mb-1 flex items-center justify-between">
              <span>Batch No.</span>
              <span class="text-xs text-muted font-normal">Optional</span>
            </span>
            <input
              type="text"
              value={batchNo()}
              onInput={e => setBatchNo(e.target.value)}
              placeholder="e.g., 2026-001"
              class={inputClass("batchNo")}
            />
            <Show when={errors().batchNo}>
              <p class={errorClass}>{errors().batchNo}</p>
            </Show>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-foreground mb-1 flex items-center justify-between">
              <span>RQM</span>
              <span class="text-xs text-muted font-normal">Optional</span>
            </span>
            <input
              type="text"
              value={rqm()}
              onInput={e => setRqm(e.target.value)}
              placeholder="e.g., RQM-001"
              class={inputClass("rqm")}
            />
            <Show when={errors().rqm}>
              <p class={errorClass}>{errors().rqm}</p>
            </Show>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-foreground mb-1 flex items-center justify-between">
              <span>Weekly Schedule</span>
              <span class="text-xs text-muted font-normal">Optional</span>
            </span>
            <input
              type="text"
              value={weeklySchedule()}
              onInput={e => setWeeklySchedule(e.target.value)}
              placeholder="e.g., Thursday to Saturday"
              class={inputClass("weeklySchedule")}
            />
            <Show when={errors().weeklySchedule}>
              <p class={errorClass}>{errors().weeklySchedule}</p>
            </Show>
          </label>
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
          <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {mutation.error?.message}
          </p>
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
