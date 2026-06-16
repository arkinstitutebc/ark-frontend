import {
  getPublicTrainingBatch,
  type PublicStudentEnrollmentInput,
  submitPublicStudentEnrollment,
  uploadPublicStudentFile,
} from "@ark/api-client"
import { Button, Icons, Input, PageLoading, Select, Textarea, toast } from "@ark/ui"
import { createMutation, createQuery } from "@tanstack/solid-query"
import { createMemo, createSignal, type JSX, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { z } from "zod"

const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
] as const

const educationOptions = [
  "Elementary Graduate",
  "High School Graduate",
  "Senior High Graduate",
  "College Undergraduate",
  "College Graduate",
  "Vocational Course",
  "Post Graduate",
].map(value => ({ label: value, value }))

const employmentOptions = ["Employed", "Unemployed", "Underemployed", "Self-Employed"].map(
  value => ({ label: value, value })
)

const enrollmentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, "Last name is required."),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required."),
  gender: z.enum(["Male", "Female"], { required_error: "Gender is required." }),
  address: z.string().trim().min(1, "Address is required."),
  contactNumber: z.string().trim().min(1, "Contact number is required."),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  educationalAttainment: z.string().trim().min(1, "Education is required."),
  employmentStatus: z.string().trim().min(1, "Employment status is required."),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
  psaCertificateUrl: z.string().trim().url().optional().or(z.literal("")),
})

type EnrollmentField = keyof PublicStudentEnrollmentInput

function formatDate(value?: string | null) {
  if (!value) return "Not set"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function cleanPayload(data: z.infer<typeof enrollmentSchema>): PublicStudentEnrollmentInput {
  return {
    firstName: data.firstName.trim(),
    middleName: data.middleName?.trim() || undefined,
    lastName: data.lastName.trim(),
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    address: data.address.trim(),
    contactNumber: data.contactNumber.trim(),
    email: data.email?.trim() || undefined,
    educationalAttainment: data.educationalAttainment,
    employmentStatus: data.employmentStatus,
    photoUrl: data.photoUrl?.trim() || undefined,
    psaCertificateUrl: data.psaCertificateUrl?.trim() || undefined,
  }
}

export default function PublicStudentEnrollmentPage() {
  const pageContext = usePageContext()
  const batchId = createMemo(() => pageContext.routeParams.batchId as string)

  const [firstName, setFirstName] = createSignal("")
  const [middleName, setMiddleName] = createSignal("")
  const [lastName, setLastName] = createSignal("")
  const [dateOfBirth, setDateOfBirth] = createSignal("")
  const [gender, setGender] = createSignal<"Male" | "Female" | undefined>()
  const [address, setAddress] = createSignal("")
  const [contactNumber, setContactNumber] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [educationalAttainment, setEducationalAttainment] = createSignal("")
  const [employmentStatus, setEmploymentStatus] = createSignal("")
  const [photoUrl, setPhotoUrl] = createSignal("")
  const [psaCertificateUrl, setPsaCertificateUrl] = createSignal("")
  const [uploadingPhoto, setUploadingPhoto] = createSignal(false)
  const [uploadingCertificate, setUploadingCertificate] = createSignal(false)
  const [errors, setErrors] = createSignal<Partial<Record<EnrollmentField, string>>>({})
  const [submittedStudentId, setSubmittedStudentId] = createSignal<string | null>(null)

  const batchQuery = createQuery(() => ({
    queryKey: ["public-training-batch", batchId()],
    queryFn: () => getPublicTrainingBatch(batchId()),
    enabled: !!batchId(),
    retry: false,
  }))

  const mutation = createMutation(() => ({
    mutationFn: (input: PublicStudentEnrollmentInput) =>
      submitPublicStudentEnrollment(batchId(), input),
    onSuccess: result => {
      setSubmittedStudentId(result.studentId)
      setErrors({})
      toast.success("Enrollment submitted")
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : "Could not submit the form")
    },
  }))

  const batch = () => batchQuery.data
  const slotsText = () => {
    const b = batch()
    if (!b) return ""
    return `${b.studentsEnrolled}/${b.studentsCapacity} enrolled`
  }

  const inputError = (field: EnrollmentField) => errors()[field]

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    const data = {
      firstName: firstName(),
      middleName: middleName(),
      lastName: lastName(),
      dateOfBirth: dateOfBirth(),
      gender: gender(),
      address: address(),
      contactNumber: contactNumber(),
      email: email(),
      educationalAttainment: educationalAttainment(),
      employmentStatus: employmentStatus(),
      photoUrl: photoUrl(),
      psaCertificateUrl: psaCertificateUrl(),
    }

    const result = enrollmentSchema.safeParse(data)
    if (!result.success) {
      const next: Partial<Record<EnrollmentField, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as EnrollmentField | undefined
        if (field && !next[field]) next[field] = issue.message
      }
      setErrors(next)
      return
    }

    setErrors({})
    if (uploadingPhoto() || uploadingCertificate()) {
      toast.error("Please wait for uploads to finish")
      return
    }

    mutation.mutate(cleanPayload(result.data))
  }

  return (
    <main class="min-h-screen bg-surface-muted text-foreground">
      <div class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
        <header class="mb-4 rounded-2xl border border-border bg-surface px-4 py-4 sm:mb-5 sm:px-7 sm:py-5">
          <div class="flex items-center gap-3 sm:gap-4">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute logo"
              width="64"
              height="64"
              class="h-12 w-12 object-contain sm:h-16 sm:w-16"
              loading="eager"
              fetchpriority="high"
            />
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Ark Institute
              </p>
              <h1 class="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-3xl">
                Student Enrollment Form
              </h1>
              <p class="mt-1 text-sm text-muted">
                Complete this form using accurate student information.
              </p>
            </div>
          </div>
        </header>

        <Show when={batchQuery.isPending}>
          <div class="rounded-2xl border border-border bg-surface p-10">
            <PageLoading label="Loading form..." />
          </div>
        </Show>

        <Show when={batchQuery.isError}>
          <section class="rounded-2xl border border-red-200 bg-surface p-6 text-center">
            <Icons.alert class="mx-auto h-10 w-10 text-red-600" />
            <h2 class="mt-3 text-lg font-semibold">Form link is not available</h2>
            <p class="mx-auto mt-2 max-w-md text-sm text-muted">
              The batch could not be found. Please ask Ark Institute for the correct enrollment
              link.
            </p>
          </section>
        </Show>

        <Show when={batch() && !submittedStudentId()}>
          <form onSubmit={handleSubmit} class="space-y-5" noValidate>
            <section class="rounded-2xl border border-border bg-surface">
              <div class="border-b border-border px-5 py-4 sm:px-7">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Training Batch
                </p>
                <h2 class="mt-1 text-xl font-semibold text-foreground">
                  {batch()?.trainingName}
                  <Show when={batch()?.trainingLevel}> {batch()?.trainingLevel}</Show>
                </h2>
              </div>
              <dl class="grid gap-px bg-border text-sm sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Batch" value={batch()?.batchCode ?? "—"} />
                <InfoItem label="Schedule" value={batch()?.weeklySchedule || "Not set"} />
                <InfoItem
                  label="Dates"
                  value={`${formatDate(batch()?.startDate)} - ${formatDate(batch()?.endDate)}`}
                />
                <InfoItem label="Available Slots" value={slotsText()} />
              </dl>
            </section>

            <FormBlock
              title="Student Information"
              description="Use the student's legal name and current contact details."
            >
              <div class="grid gap-4 sm:grid-cols-3">
                <Input
                  label="First Name"
                  value={firstName()}
                  onInput={e => setFirstName(e.currentTarget.value)}
                  error={inputError("firstName")}
                  autocomplete="given-name"
                />
                <Input
                  label="Middle Name"
                  value={middleName()}
                  onInput={e => setMiddleName(e.currentTarget.value)}
                  autocomplete="additional-name"
                />
                <Input
                  label="Last Name"
                  value={lastName()}
                  onInput={e => setLastName(e.currentTarget.value)}
                  error={inputError("lastName")}
                  autocomplete="family-name"
                />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth()}
                  onInput={e => setDateOfBirth(e.currentTarget.value)}
                  error={inputError("dateOfBirth")}
                />
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-medium text-foreground">Gender</span>
                  <Select
                    options={[...genderOptions]}
                    value={gender()}
                    onChange={setGender}
                    placeholder="Select gender"
                    error={inputError("gender")}
                    ariaLabel="Gender"
                  />
                </div>
              </div>
            </FormBlock>

            <FormBlock
              title="Contact and Background"
              description="These details help Ark Institute contact the student and complete TESDA records."
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Contact Number"
                  value={contactNumber()}
                  onInput={e => setContactNumber(e.currentTarget.value)}
                  error={inputError("contactNumber")}
                  inputmode="tel"
                  autocomplete="tel"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email()}
                  onInput={e => setEmail(e.currentTarget.value)}
                  error={inputError("email")}
                  hint="Optional"
                  inputmode="email"
                  autocomplete="email"
                />
              </div>

              <Textarea
                label="Complete Address"
                value={address()}
                onInput={e => setAddress(e.currentTarget.value)}
                error={inputError("address")}
                rows={3}
                autocomplete="street-address"
              />

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-medium text-foreground">Education</span>
                  <Select
                    options={educationOptions}
                    value={educationalAttainment() || undefined}
                    onChange={setEducationalAttainment}
                    placeholder="Select education level"
                    error={inputError("educationalAttainment")}
                    ariaLabel="Education"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-sm font-medium text-foreground">Employment</span>
                  <Select
                    options={employmentOptions}
                    value={employmentStatus() || undefined}
                    onChange={setEmploymentStatus}
                    placeholder="Select employment status"
                    error={inputError("employmentStatus")}
                    ariaLabel="Employment"
                  />
                </div>
              </div>
            </FormBlock>

            <FormBlock
              title="Student Documents"
              description="Upload clear files if available. These match the documents kept in the student profile."
            >
              <div class="grid gap-4 md:grid-cols-2">
                <PublicUploadCard
                  label="2x2 Photo"
                  description="JPG, PNG, or WebP up to 5MB."
                  kind="photo"
                  accept="image/jpeg,image/png,image/webp"
                  value={photoUrl()}
                  onChange={setPhotoUrl}
                  onUploadingChange={setUploadingPhoto}
                />
                <PublicUploadCard
                  label="Birth Certificate / PSA"
                  description="PDF, JPG, PNG, or WebP up to 10MB."
                  kind="certificate"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  value={psaCertificateUrl()}
                  onChange={setPsaCertificateUrl}
                  onUploadingChange={setUploadingCertificate}
                />
              </div>
            </FormBlock>

            <footer class="sticky bottom-0 -mx-3 border-t border-border bg-surface/95 px-3 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur sm:-mx-6 sm:px-6 sm:py-4 lg:-mx-8 lg:px-8">
              <div class="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs text-muted">
                  By submitting, you confirm that the information is complete and accurate.
                </p>
                <Button
                  type="submit"
                  loading={mutation.isPending}
                  loadingLabel="Submitting..."
                  disabled={uploadingPhoto() || uploadingCertificate()}
                  class="w-full sm:w-auto"
                >
                  Submit Enrollment
                </Button>
              </div>
            </footer>
          </form>
        </Show>

        <Show when={submittedStudentId()}>
          <section class="rounded-2xl border border-border bg-surface p-6 text-center sm:p-10">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icons.check class="h-7 w-7" />
            </div>
            <h2 class="mt-5 text-2xl font-semibold">Enrollment Submitted</h2>
            <p class="mx-auto mt-2 max-w-md text-sm text-muted">
              Ark Institute received the student details for {batch()?.trainingName}. Please keep
              this reference number.
            </p>
            <p class="mt-5 font-mono text-lg font-semibold text-primary">{submittedStudentId()}</p>
          </section>
        </Show>
      </div>
    </main>
  )
}

function InfoItem(props: { label: string; value: string }) {
  return (
    <div class="bg-surface px-5 py-4">
      <dt class="text-xs font-semibold uppercase tracking-wide text-muted">{props.label}</dt>
      <dd class="mt-1 text-sm font-semibold text-foreground">{props.value}</dd>
    </div>
  )
}

function FormBlock(props: { title: string; description: string; children: JSX.Element }) {
  return (
    <section class="rounded-2xl border border-border bg-surface">
      <div class="border-b border-border px-5 py-4 sm:px-7">
        <h2 class="text-lg font-semibold text-foreground">{props.title}</h2>
        <p class="mt-1 text-sm text-muted">{props.description}</p>
      </div>
      <div class="space-y-5 px-5 py-5 sm:px-7">{props.children}</div>
    </section>
  )
}

function PublicUploadCard(props: {
  label: string
  description: string
  kind: "photo" | "certificate"
  accept: string
  value: string
  onChange: (url: string) => void
  onUploadingChange: (uploading: boolean) => void
}) {
  const [uploading, setUploading] = createSignal(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    props.onUploadingChange(true)
    try {
      const result = await uploadPublicStudentFile(props.kind, file)
      props.onChange(result.secure_url)
      toast.success(`${props.label} uploaded`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
      props.onUploadingChange(false)
    }
  }

  return (
    <div class="rounded-xl border border-border bg-surface-muted/30 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-foreground">{props.label}</p>
          <p class="mt-1 text-xs leading-relaxed text-muted">{props.description}</p>
        </div>
        <label class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted">
          <Icons.upload class="h-4 w-4 text-muted" />
          {uploading() ? "Uploading..." : props.value ? "Replace" : "Upload"}
          <input
            type="file"
            accept={props.accept}
            disabled={uploading()}
            onChange={event => {
              const target = event.currentTarget
              handleFile(target.files?.[0]).finally(() => {
                target.value = ""
              })
            }}
            class="hidden"
          />
        </label>
      </div>

      <Show
        when={props.value}
        fallback={<p class="mt-3 text-xs text-muted">No file uploaded yet.</p>}
      >
        {url => (
          <div class="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Icons.fileText class="h-4 w-4 shrink-0 text-muted" />
            <a
              href={url()}
              target="_blank"
              rel="noopener noreferrer"
              class="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-primary"
            >
              View uploaded file
            </a>
            <button
              type="button"
              onClick={() => props.onChange("")}
              class="text-xs font-semibold text-muted transition-colors hover:text-red-600"
            >
              Remove
            </button>
          </div>
        )}
      </Show>
    </div>
  )
}
