import { formErrorClass, formInputClass, formLabelClass, Modal, ModalFooter, Select } from "@ark/ui"
import { useCreateTrainer, useUpdateTrainer } from "@data/hooks"
import type { Trainer, TrainerStatus } from "@data/types"
import { createEffect, createSignal, Show } from "solid-js"

interface TrainerFormModalProps {
  open: boolean
  onClose: () => void
  trainer?: Trainer | null
}

const statusOptions: Array<{ label: string; value: TrainerStatus }> = [
  { label: "Active", value: "active" },
  { label: "On Leave", value: "on-leave" },
  { label: "Inactive", value: "inactive" },
]

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function rateValue(value: Trainer["hourlyRate"] | undefined) {
  const numeric = Number(value ?? 0)
  return numeric > 0 ? String(numeric) : ""
}

export function TrainerFormModal(props: TrainerFormModalProps) {
  const createTrainer = useCreateTrainer()
  const updateTrainer = useUpdateTrainer()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [phone, setPhone] = createSignal("")
  const [specialization, setSpecialization] = createSignal("")
  const [hourlyRate, setHourlyRate] = createSignal("")
  const [hireDate, setHireDate] = createSignal("")
  const [status, setStatus] = createSignal<TrainerStatus>("active")

  const isEdit = () => !!props.trainer
  const submitting = () => createTrainer.isPending || updateTrainer.isPending

  createEffect(() => {
    if (!props.open) return
    setName(props.trainer?.name ?? "")
    setEmail(props.trainer?.email ?? "")
    setPhone(props.trainer?.phone ?? "")
    setSpecialization(props.trainer?.specialization ?? "")
    setHourlyRate(rateValue(props.trainer?.hourlyRate))
    setHireDate(props.trainer?.hireDate ?? "")
    setStatus(props.trainer?.status ?? "active")
    setErrors({})
  })

  function validate() {
    const next: Record<string, string> = {}
    if (!name().trim()) next.name = "Name is required"
    if (email().trim() && !email().includes("@")) next.email = "Enter a valid email"
    if (hourlyRate().trim() && Number(hourlyRate()) <= 0) next.hourlyRate = "Must be positive"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleClose() {
    if (submitting()) return
    props.onClose()
  }

  function handleSubmit(e: Event) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name().trim(),
      email: optional(email()),
      phone: optional(phone()),
      specialization: optional(specialization()),
      hourlyRate: optional(hourlyRate()),
      hireDate: optional(hireDate()),
      status: status(),
    }

    if (props.trainer) {
      updateTrainer.mutate(
        { id: props.trainer.id, ...payload },
        {
          onSuccess: props.onClose,
        }
      )
      return
    }

    createTrainer.mutate(payload, {
      onSuccess: props.onClose,
    })
  }

  const inputClass = (field: string) => formInputClass({ error: !!errors()[field] })

  return (
    <Modal
      open={props.open}
      onClose={handleClose}
      title={isEdit() ? "Edit Trainer" : "New Trainer"}
      size="lg"
    >
      <form onSubmit={handleSubmit} class="space-y-5" noValidate>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label for="trainer-name" class={formLabelClass}>
              Name
            </label>
            <input
              id="trainer-name"
              value={name()}
              onInput={e => setName(e.currentTarget.value)}
              class={inputClass("name")}
              placeholder="Trainer full name"
            />
            <Show when={errors().name}>
              <p class={formErrorClass}>{errors().name}</p>
            </Show>
          </div>

          <div>
            <label for="trainer-email" class={formLabelClass}>
              Email
            </label>
            <input
              id="trainer-email"
              type="email"
              value={email()}
              onInput={e => setEmail(e.currentTarget.value)}
              class={inputClass("email")}
              placeholder="email@example.com"
            />
            <Show when={errors().email}>
              <p class={formErrorClass}>{errors().email}</p>
            </Show>
          </div>

          <div>
            <label for="trainer-phone" class={formLabelClass}>
              Phone
            </label>
            <input
              id="trainer-phone"
              value={phone()}
              onInput={e => setPhone(e.currentTarget.value)}
              class={inputClass("phone")}
              placeholder="Mobile number"
            />
          </div>

          <div>
            <label for="trainer-specialization" class={formLabelClass}>
              Specialization
            </label>
            <input
              id="trainer-specialization"
              value={specialization()}
              onInput={e => setSpecialization(e.currentTarget.value)}
              class={inputClass("specialization")}
              placeholder="F&B, HSK, etc."
            />
          </div>

          <div>
            <span class={formLabelClass}>Status</span>
            <Select
              options={statusOptions}
              value={status()}
              onChange={value => setStatus(value as TrainerStatus)}
              ariaLabel="Trainer status"
            />
          </div>

          <div>
            <label for="trainer-rate" class={formLabelClass}>
              Hourly Rate
            </label>
            <input
              id="trainer-rate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate()}
              onInput={e => setHourlyRate(e.currentTarget.value)}
              class={inputClass("hourlyRate")}
              placeholder="Optional"
            />
            <Show when={errors().hourlyRate}>
              <p class={formErrorClass}>{errors().hourlyRate}</p>
            </Show>
          </div>

          <div>
            <label for="trainer-hire-date" class={formLabelClass}>
              Hire Date
            </label>
            <input
              id="trainer-hire-date"
              type="date"
              value={hireDate()}
              onInput={e => setHireDate(e.currentTarget.value)}
              class={inputClass("hireDate")}
            />
          </div>
        </div>

        <ModalFooter
          onCancel={handleClose}
          submitInForm
          submitting={submitting()}
          submitLabel={isEdit() ? "Save changes" : "Create trainer"}
        />
      </form>
    </Modal>
  )
}
