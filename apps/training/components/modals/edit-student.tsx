import { Icons, Modal, ModalFooter, Select } from "@ark/ui"
import { useBatches, useUpdateStudent } from "@data/hooks"
import { updateStudentSchema } from "@data/schemas"
import type { Student } from "@data/types"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, Show } from "solid-js"

interface EditStudentModalProps {
  open: boolean
  onClose: () => void
  student: Student
}

const GENDERS: Student["gender"][] = ["Male", "Female"]

const STATUSES: Student["status"][] = [
  "Enrolled",
  "In Training",
  "Completed",
  "Dropped",
  "Certified",
]

const EDUCATION_LEVELS = [
  "Elementary Graduate",
  "High School Graduate",
  "College Undergraduate",
  "College Graduate",
  "Vocational Course",
  "Post Graduate",
] as const

const EMPLOYMENT_STATUSES = ["Employed", "Unemployed", "Underemployed", "Self-Employed"] as const

export function EditStudentModal(props: EditStudentModalProps) {
  const batchesQuery = useBatches()
  const mutation = useUpdateStudent()
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  // Basic info
  const [firstName, setFirstName] = createSignal(props.student.firstName)
  const [middleName, setMiddleName] = createSignal(props.student.middleName || "")
  const [lastName, setLastName] = createSignal(props.student.lastName)

  // Personal info
  const [dateOfBirth, setDateOfBirth] = createSignal(props.student.dateOfBirth)
  const [gender, setGender] = createSignal(props.student.gender)
  const [address, setAddress] = createSignal(props.student.address)
  const [contactNumber, setContactNumber] = createSignal(props.student.contactNumber)
  const [email, setEmail] = createSignal(props.student.email)

  // Education & Employment
  const [educationalAttainment, setEducationalAttainment] = createSignal(
    props.student.educationalAttainment
  )
  const [employmentStatus, setEmploymentStatus] = createSignal(props.student.employmentStatus)

  // Batch & Status
  const [batchId, setBatchId] = createSignal(props.student.batchId)
  const [status, setStatus] = createSignal(props.student.status)

  // Uploads (frontend only - stores blob URL)
  const [photoUrl, setPhotoUrl] = createSignal<string | undefined>(undefined)
  const [certificateUrl, setCertificateUrl] = createSignal<string | undefined>(undefined)

  const batchOptions = createMemo(() =>
    (batchesQuery.data ?? []).map(b => ({
      label: `${b.batchCode} — ${b.trainingName} — ${b.studentsEnrolled}/${b.studentsCapacity}`,
      value: b.id,
    }))
  )

  const genderOptions = createMemo(() => GENDERS.map(g => ({ label: g ?? "", value: g ?? "" })))

  const statusOptions = createMemo(() => STATUSES.map(s => ({ label: s, value: s })))

  const educationOptions = createMemo(() => EDUCATION_LEVELS.map(l => ({ label: l, value: l })))

  const employmentOptions = createMemo(() => EMPLOYMENT_STATUSES.map(s => ({ label: s, value: s })))

  const handlePhotoUpload = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPhotoUrl(url)
    }
  }

  const handleCertificateUpload = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCertificateUrl(url)
    }
  }

  const handleRemovePhoto = () => setPhotoUrl(undefined)
  const handleRemoveCertificate = () => setCertificateUrl(undefined)

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const data = {
      firstName: firstName(),
      lastName: lastName(),
      batchId: batchId(),
      status: status(),
      email: email(),
      contactNumber: contactNumber(),
    }

    const result = validateForm(updateStudentSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    mutation.mutate(
      {
        id: props.student.id,
        firstName: firstName(),
        middleName: middleName() || undefined,
        lastName: lastName(),
        dateOfBirth: dateOfBirth(),
        gender: gender(),
        address: address(),
        contactNumber: contactNumber(),
        email: email(),
        educationalAttainment: educationalAttainment(),
        employmentStatus: employmentStatus(),
        batchId: batchId(),
        status: status(),
      },
      { onSuccess: () => props.onClose() }
    )
  }

  const handleClose = () => {
    setFirstName(props.student.firstName)
    setMiddleName(props.student.middleName || "")
    setLastName(props.student.lastName)
    setDateOfBirth(props.student.dateOfBirth)
    setGender(props.student.gender)
    setAddress(props.student.address)
    setContactNumber(props.student.contactNumber)
    setEmail(props.student.email)
    setEducationalAttainment(props.student.educationalAttainment)
    setEmploymentStatus(props.student.employmentStatus)
    setBatchId(props.student.batchId)
    setStatus(props.student.status)
    setPhotoUrl(undefined)
    setCertificateUrl(undefined)
    setErrors({})
    props.onClose()
  }

  const inputClass = (field?: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${field && errors()[field] ? "border-red-400 dark:border-red-500" : "border-border"}`

  const errorClass = "text-xs text-red-600 dark:text-red-400 mt-1"
  const labelClass = "block text-sm font-medium text-foreground mb-1"

  return (
    <Modal open={props.open} onClose={handleClose} title="Edit Student" size="xl">
      <form onSubmit={handleSubmit} class="space-y-5" noValidate>
        {/* Header: photo + ID */}
        <div class="flex items-center gap-4 pb-4 border-b border-border">
          <div class="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden border-2 border-border">
            {photoUrl() ? (
              <img src={photoUrl()} alt="Student" class="w-full h-full object-cover" />
            ) : (
              <Icons.user class="w-10 h-10 text-muted" />
            )}
          </div>
          <div class="flex-1">
            <Show when={props.student.studentId}>
              <p class="text-xs text-muted font-mono mb-1">{props.student.studentId}</p>
            </Show>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              class="hidden"
              id="photo-upload"
            />
            <label
              for="photo-upload"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
            >
              <Icons.upload class="w-4 h-4" />
              Upload Photo
            </label>
            <Show when={photoUrl()}>
              <button
                type="button"
                onClick={handleRemovePhoto}
                class="ml-2 text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </Show>
            <p class="text-xs text-muted mt-1">2x2 photo, JPG or PNG</p>
          </div>
        </div>

        {/* Basic Info */}
        <div class="space-y-3">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Basic Info</h3>
          <div class="grid grid-cols-3 gap-3">
            <label class="block">
              <span class={labelClass}>First Name</span>
              <input
                type="text"
                value={firstName()}
                onInput={e => setFirstName(e.target.value)}
                class={inputClass("firstName")}
              />
              <Show when={errors().firstName}>
                <p class={errorClass}>{errors().firstName}</p>
              </Show>
            </label>
            <label class="block">
              <span class={labelClass}>Middle Name</span>
              <input
                type="text"
                value={middleName()}
                onInput={e => setMiddleName(e.target.value)}
                placeholder="Optional"
                class={inputClass()}
              />
            </label>
            <label class="block">
              <span class={labelClass}>Last Name</span>
              <input
                type="text"
                value={lastName()}
                onInput={e => setLastName(e.target.value)}
                class={inputClass("lastName")}
              />
              <Show when={errors().lastName}>
                <p class={errorClass}>{errors().lastName}</p>
              </Show>
            </label>
          </div>
        </div>

        {/* Personal */}
        <div class="space-y-3 pt-2">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Personal</h3>
          <div class="grid grid-cols-3 gap-3">
            <label class="block">
              <span class={labelClass}>Date of Birth</span>
              <input
                type="date"
                value={dateOfBirth() ?? ""}
                onInput={e => setDateOfBirth(e.target.value)}
                class={inputClass()}
              />
            </label>
            <div>
              <span class={labelClass}>Gender</span>
              <Select
                options={genderOptions()}
                value={gender() ?? undefined}
                onChange={v => setGender(v as Student["gender"])}
                placeholder="Select gender"
                ariaLabel="Gender"
              />
            </div>
            <div>
              <span class={labelClass}>Status</span>
              <Select
                options={statusOptions()}
                value={status()}
                onChange={v => setStatus(v as Student["status"])}
                placeholder="Select status"
                ariaLabel="Status"
              />
              <Show when={errors().status}>
                <p class={errorClass}>{errors().status}</p>
              </Show>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div class="space-y-3 pt-2">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Contact</h3>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class={labelClass}>Contact Number</span>
              <input
                type="tel"
                value={contactNumber() ?? ""}
                onInput={e => setContactNumber(e.target.value)}
                placeholder="09XXXXXXXXX"
                class={inputClass("contactNumber")}
              />
              <Show when={errors().contactNumber}>
                <p class={errorClass}>{errors().contactNumber}</p>
              </Show>
            </label>
            <label class="block">
              <span class={labelClass}>Email</span>
              <input
                type="email"
                value={email() ?? ""}
                onInput={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                class={inputClass("email")}
              />
              <Show when={errors().email}>
                <p class={errorClass}>{errors().email}</p>
              </Show>
            </label>
          </div>

          <label class="block">
            <span class={labelClass}>Address</span>
            <input
              type="text"
              value={address() ?? ""}
              onInput={e => setAddress(e.target.value)}
              placeholder="Street, City, Province"
              class={inputClass()}
            />
          </label>
        </div>

        {/* Education & Employment */}
        <div class="space-y-3 pt-2">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">
            Education & Employment
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <span class={labelClass}>Education</span>
              <Select
                options={educationOptions()}
                value={educationalAttainment() ?? undefined}
                onChange={v => setEducationalAttainment(v)}
                placeholder="Select education level"
                ariaLabel="Education"
              />
            </div>
            <div>
              <span class={labelClass}>Employment</span>
              <Select
                options={employmentOptions()}
                value={employmentStatus() ?? undefined}
                onChange={v => setEmploymentStatus(v)}
                placeholder="Select employment status"
                ariaLabel="Employment"
              />
            </div>
          </div>

          <div>
            <span class={labelClass}>Assign to Batch</span>
            <Select
              options={batchOptions()}
              value={batchId()}
              onChange={v => setBatchId(v)}
              placeholder={batchesQuery.isLoading ? "Loading batches…" : "Select a batch"}
              disabled={batchesQuery.isLoading}
              ariaLabel="Batch"
            />
            <Show when={errors().batchId}>
              <p class={errorClass}>{errors().batchId}</p>
            </Show>
          </div>
        </div>

        {/* Certificate */}
        <div class="pt-4 border-t border-border">
          <span class={labelClass}>PSA Certificate</span>
          <div class="flex items-center gap-3">
            <label class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors cursor-pointer">
              <Icons.upload class="w-4 h-4" />
              <span>Choose File</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleCertificateUpload}
                class="hidden"
              />
            </label>
            <Show when={certificateUrl()}>
              <span class="text-sm text-muted flex items-center gap-1">
                <Icons.fileText class="w-4 h-4" />
                File selected
              </span>
              <button
                type="button"
                onClick={handleRemoveCertificate}
                class="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </Show>
            <Show when={!certificateUrl()}>
              <span class="text-sm text-muted">No file chosen</span>
            </Show>
          </div>
          <p class="text-xs text-muted mt-1">Accepts PDF or images (JPG, PNG)</p>
        </div>

        <ModalFooter
          onCancel={handleClose}
          submitInForm
          submitting={mutation.isPending}
          submitLabel={mutation.isPending ? "Saving..." : "Save Changes"}
        />
      </form>
    </Modal>
  )
}
