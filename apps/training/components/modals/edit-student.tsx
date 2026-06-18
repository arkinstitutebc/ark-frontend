import {
  formErrorClass,
  formInputClass,
  formLabelClass,
  Icons,
  Modal,
  ModalFooter,
  Select,
  toast,
} from "@ark/ui"
import { useBatches, useUpdateStudent } from "@data/hooks"
import { queryKeys } from "@data/query-keys"
import { updateStudentSchema } from "@data/schemas"
import type { Student } from "@data/types"
import { uploadStudentFile } from "@data/uploads"
import { validateForm } from "@data/validate"
import { useQueryClient } from "@tanstack/solid-query"
import { createMemo, createSignal, Show } from "solid-js"
import {
  batchSelectLabel,
  educationOptions,
  employmentOptions,
  genderOptions,
  StudentUploadField,
  studentStatusOptions,
  TrainingFormPanel,
} from "@/components/forms"

interface EditStudentModalProps {
  open: boolean
  onClose: () => void
  student: Student
}

export function EditStudentModal(props: EditStudentModalProps) {
  const batchesQuery = useBatches()
  const mutation = useUpdateStudent()
  const qc = useQueryClient()
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  const [firstName, setFirstName] = createSignal(props.student.firstName)
  const [middleName, setMiddleName] = createSignal(props.student.middleName || "")
  const [lastName, setLastName] = createSignal(props.student.lastName)
  const [dateOfBirth, setDateOfBirth] = createSignal(props.student.dateOfBirth || "")
  const [gender, setGender] = createSignal<Student["gender"] | "">(props.student.gender || "")
  const [address, setAddress] = createSignal(props.student.address || "")
  const [contactNumber, setContactNumber] = createSignal(props.student.contactNumber || "")
  const [email, setEmail] = createSignal(props.student.email || "")
  const [educationalAttainment, setEducationalAttainment] = createSignal(
    props.student.educationalAttainment || ""
  )
  const [employmentStatus, setEmploymentStatus] = createSignal(props.student.employmentStatus || "")
  const [batchId, setBatchId] = createSignal(props.student.batchId)
  const [status, setStatus] = createSignal(props.student.status)
  const [photoUrl, setPhotoUrl] = createSignal<string | null>(props.student.photoUrl ?? null)
  const [psaCertificateUrl, setPsaCertificateUrl] = createSignal<string | null>(
    props.student.psaCertificateUrl ?? null
  )
  const [uploadingPhoto, setUploadingPhoto] = createSignal(false)

  const batchOptions = createMemo(() =>
    (batchesQuery.data ?? []).map(b => ({
      label: batchSelectLabel(b),
      value: b.id,
    }))
  )

  function resetForm() {
    setFirstName(props.student.firstName)
    setMiddleName(props.student.middleName || "")
    setLastName(props.student.lastName)
    setDateOfBirth(props.student.dateOfBirth || "")
    setGender(props.student.gender || "")
    setAddress(props.student.address || "")
    setContactNumber(props.student.contactNumber || "")
    setEmail(props.student.email || "")
    setEducationalAttainment(props.student.educationalAttainment || "")
    setEmploymentStatus(props.student.employmentStatus || "")
    setBatchId(props.student.batchId)
    setStatus(props.student.status)
    setPhotoUrl(props.student.photoUrl ?? null)
    setPsaCertificateUrl(props.student.psaCertificateUrl ?? null)
    setErrors({})
  }

  function handleClose() {
    resetForm()
    props.onClose()
  }

  function handleSubmit(e: Event) {
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
        dateOfBirth: dateOfBirth() || undefined,
        gender: gender() || undefined,
        address: address() || undefined,
        contactNumber: contactNumber() || undefined,
        email: email() || undefined,
        educationalAttainment: educationalAttainment() || undefined,
        employmentStatus: employmentStatus() || undefined,
        batchId: batchId(),
        status: status(),
        photoUrl: photoUrl(),
        psaCertificateUrl: psaCertificateUrl(),
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: queryKeys.students.all })
          qc.invalidateQueries({ queryKey: queryKeys.batches.all })
          qc.invalidateQueries({ queryKey: queryKeys.batches.students(props.student.batchId) })
          qc.invalidateQueries({ queryKey: queryKeys.batches.students(batchId()) })
          props.onClose()
        },
      }
    )
  }

  async function handleHeaderPhotoUpload(file: File | undefined) {
    if (!file) return
    setUploadingPhoto(true)
    try {
      const result = await uploadStudentFile("photo", file)
      setPhotoUrl(result.secure_url)
      toast.success("Student photo uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const inputClass = (field?: string) => formInputClass({ error: !!(field && errors()[field]) })
  const errorClass = formErrorClass
  const labelClass = formLabelClass

  return (
    <Modal open={props.open} onClose={handleClose} title="Edit student profile" size="xl">
      <form onSubmit={handleSubmit} class="space-y-4" noValidate>
        <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted/40 p-3 sm:flex-row sm:items-center">
          <label class="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary/40">
            <Show when={photoUrl()} fallback={<Icons.user class="h-8 w-8 text-muted" />}>
              {url => <img src={url()} alt="" class="h-full w-full object-cover" />}
            </Show>
            <span class="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {uploadingPhoto() ? "Uploading..." : "Change"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploadingPhoto()}
              onChange={e => {
                const target = e.currentTarget
                handleHeaderPhotoUpload(target.files?.[0]).finally(() => {
                  target.value = ""
                })
              }}
              class="hidden"
            />
          </label>
          <div class="min-w-0 flex-1">
            <p class="font-mono text-xs text-muted">{props.student.studentId || "No ID yet"}</p>
            <h3 class="mt-0.5 truncate text-lg font-semibold text-foreground">
              {firstName() || "Student"} {lastName()}
            </h3>
            <p class="mt-0.5 text-sm text-muted">
              Complete profile details, training assignment, and student documents.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div class="space-y-3">
            <TrainingFormPanel title="Identity">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
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
            </TrainingFormPanel>

            <TrainingFormPanel title="Contact and background">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label class="block">
                  <span class={labelClass}>Contact Number</span>
                  <input
                    type="tel"
                    value={contactNumber()}
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
                    value={email()}
                    onInput={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    class={inputClass("email")}
                  />
                  <Show when={errors().email}>
                    <p class={errorClass}>{errors().email}</p>
                  </Show>
                </label>
                <label class="block">
                  <span class={labelClass}>Date of Birth</span>
                  <input
                    type="date"
                    value={dateOfBirth()}
                    onInput={e => setDateOfBirth(e.target.value)}
                    class={inputClass()}
                  />
                </label>
                <div>
                  <span class={labelClass}>Gender</span>
                  <Select
                    options={genderOptions()}
                    value={gender() || undefined}
                    onChange={v => setGender(v as Student["gender"])}
                    placeholder="Select gender"
                    ariaLabel="Gender"
                  />
                </div>
              </div>
              <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <span class={labelClass}>Education</span>
                  <Select
                    options={educationOptions()}
                    value={educationalAttainment() || undefined}
                    onChange={v => setEducationalAttainment(v)}
                    placeholder="Select education level"
                    ariaLabel="Education"
                  />
                </div>
                <div>
                  <span class={labelClass}>Employment</span>
                  <Select
                    options={employmentOptions()}
                    value={employmentStatus() || undefined}
                    onChange={v => setEmploymentStatus(v)}
                    placeholder="Select employment status"
                    ariaLabel="Employment"
                  />
                </div>
              </div>
              <label class="mt-3 block">
                <span class={labelClass}>Address</span>
                <input
                  type="text"
                  value={address()}
                  onInput={e => setAddress(e.target.value)}
                  placeholder="Street, City, Province"
                  class={inputClass()}
                />
              </label>
            </TrainingFormPanel>
          </div>

          <aside class="space-y-3">
            <TrainingFormPanel title="Training">
              <div class="space-y-3">
                <div>
                  <span class={labelClass}>Batch</span>
                  <Select
                    options={batchOptions()}
                    value={batchId()}
                    onChange={v => setBatchId(v)}
                    placeholder={batchesQuery.isLoading ? "Loading batches..." : "Select a batch"}
                    disabled={batchesQuery.isLoading}
                    ariaLabel="Batch"
                  />
                  <Show when={errors().batchId}>
                    <p class={errorClass}>{errors().batchId}</p>
                  </Show>
                </div>
                <div>
                  <span class={labelClass}>Status</span>
                  <Select
                    options={studentStatusOptions()}
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
            </TrainingFormPanel>

            <TrainingFormPanel title="Documents">
              <div class="space-y-3">
                <StudentUploadField
                  label="2x2 Photo"
                  description="JPG, PNG, or WebP up to 5MB."
                  kind="photo"
                  accept="image/jpeg,image/png,image/webp"
                  value={photoUrl()}
                  onChange={setPhotoUrl}
                />
                <StudentUploadField
                  label="Birth Certificate / PSA"
                  description="PDF or image up to 10MB."
                  kind="certificate"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  value={psaCertificateUrl()}
                  onChange={setPsaCertificateUrl}
                />
              </div>
            </TrainingFormPanel>
          </aside>
        </div>

        <ModalFooter
          onCancel={handleClose}
          submitInForm
          submitting={mutation.isPending}
          submitLabel={mutation.isPending ? "Saving..." : "Save changes"}
        />
      </form>
    </Modal>
  )
}
