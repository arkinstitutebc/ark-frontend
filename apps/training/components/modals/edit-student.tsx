import { useBatches, useUpdateStudent } from "@data/hooks"
import { updateStudentSchema } from "@data/schemas"
import type { Student } from "@data/types"
import { validateForm } from "@data/validate"
import { createSignal, For, Show } from "solid-js"
import { Icons } from "@/components/ui/icons"
import { Modal } from "@/components/ui/modal"

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

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined)
  }

  const handleRemoveCertificate = () => {
    setCertificateUrl(undefined)
  }

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
    // Reset to original values
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

  return (
    <Modal open={props.open} onClose={handleClose} title="Edit Student" size="lg">
      <form onSubmit={handleSubmit} class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Photo Upload */}
        <div class="flex items-center gap-4 pb-4 border-b border-border">
          <div class="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden border-2 border-border">
            <Show when={photoUrl()} fallback={<Icons.user class="w-10 h-10 text-muted" />}>
              <img src={photoUrl()} alt="Student" class="w-full h-full object-cover" />
            </Show>
          </div>
          <div>
            <label class="block">
              <span class="sr-only">Upload photo</span>
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
            <p class="text-xs text-muted mt-1">Recommended: 2x2 photo, JPG or PNG</p>
          </div>
        </div>

        {/* Name */}
        <div class="grid grid-cols-3 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">First Name</span>
            <input
              type="text"
              value={firstName()}
              onInput={e => setFirstName(e.target.value)}
              required
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().firstName ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().firstName}>
              <p class="text-xs text-red-600 mt-1">{errors().firstName}</p>
            </Show>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Middle Name</span>
            <input
              type="text"
              value={middleName()}
              onInput={e => setMiddleName(e.target.value)}
              placeholder="Optional"
              class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Last Name</span>
            <input
              type="text"
              value={lastName()}
              onInput={e => setLastName(e.target.value)}
              required
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().lastName ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().lastName}>
              <p class="text-xs text-red-600 mt-1">{errors().lastName}</p>
            </Show>
          </label>
        </div>

        {/* Personal Info */}
        <div class="grid grid-cols-3 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Date of Birth</span>
            <input
              type="date"
              value={dateOfBirth()}
              onInput={e => setDateOfBirth(e.target.value)}
              required
              class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Gender</span>
            <select
              value={gender()}
              onChange={e => setGender(e.target.value as Student["gender"])}
              required
              class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {GENDERS.map(g => (
                <option value={g}>{g}</option>
              ))}
            </select>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Status</span>
            <select
              value={status()}
              onChange={e => setStatus(e.target.value as Student["status"])}
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

        {/* Contact Info */}
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Contact Number</span>
            <input
              type="tel"
              value={contactNumber()}
              onInput={e => setContactNumber(e.target.value)}
              required
              placeholder="09XXXXXXXXX"
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().contactNumber ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().contactNumber}>
              <p class="text-xs text-red-600 mt-1">{errors().contactNumber}</p>
            </Show>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Email</span>
            <input
              type="email"
              value={email()}
              onInput={e => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              class={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors().email ? "border-red-300" : "border-border"}`}
            />
            <Show when={errors().email}>
              <p class="text-xs text-red-600 mt-1">{errors().email}</p>
            </Show>
          </label>
        </div>

        <label class="block">
          <span class="block text-sm font-medium text-foreground mb-1">Address</span>
          <input
            type="text"
            value={address()}
            onInput={e => setAddress(e.target.value)}
            required
            placeholder="Street, City, Province"
            class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </label>

        {/* Education & Employment */}
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Education</span>
            <select
              value={educationalAttainment()}
              onChange={e => setEducationalAttainment(e.target.value)}
              required
              class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {EDUCATION_LEVELS.map(level => (
                <option value={level}>{level}</option>
              ))}
            </select>
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">Employment</span>
            <select
              value={employmentStatus()}
              onChange={e => setEmploymentStatus(e.target.value)}
              required
              class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {EMPLOYMENT_STATUSES.map(status => (
                <option value={status}>{status}</option>
              ))}
            </select>
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

        {/* Certificate Upload */}
        <div class="pt-4 border-t border-border">
          <label class="block">
            <span class="block text-sm font-medium text-foreground mb-1">PSA Certificate</span>
            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors cursor-pointer">
                <Icons.upload class="w-4 h-4" />
                <span>Choose File</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleCertificateUpload}
                  class="hidden"
                  id="certificate-upload"
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
          </label>
        </div>

        {/* Actions */}
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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  )
}
