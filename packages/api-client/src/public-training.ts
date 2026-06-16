import { api } from "./api"
import type { CloudinarySignature, CloudinaryUploadResult } from "./content"

export interface PublicTrainingBatch {
  id: string
  batchCode: string
  batchNo?: string | null
  rqm?: string | null
  senator?: string | null
  trainingName: string
  trainingLevel?: string | null
  startDate?: string | null
  endDate?: string | null
  weeklySchedule?: string | null
  venue?: string | null
  studentsEnrolled: number
  studentsCapacity: number
  status: string
}

export interface PublicStudentEnrollmentInput {
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  gender: "Male" | "Female"
  address: string
  contactNumber: string
  email?: string
  educationalAttainment: string
  employmentStatus: string
  photoUrl?: string
  psaCertificateUrl?: string
}

export interface PublicStudentEnrollmentResult {
  id: string
  studentId: string | null
  firstName: string
  lastName: string
}

export function getPublicTrainingBatch(batchId: string) {
  return api<PublicTrainingBatch>(`/api/public/training/batches/${batchId}`)
}

export function submitPublicStudentEnrollment(
  batchId: string,
  input: PublicStudentEnrollmentInput
) {
  return api<PublicStudentEnrollmentResult>(`/api/public/training/batches/${batchId}/enrollments`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

type PublicStudentUploadKind = "photo" | "certificate"

const uploadRules: Record<
  PublicStudentUploadKind,
  { types: Set<string>; maxBytes: number; label: string }
> = {
  photo: {
    types: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxBytes: 5_000_000,
    label: "JPG, PNG, or WebP up to 5MB",
  },
  certificate: {
    types: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    maxBytes: 10_000_000,
    label: "PDF, JPG, PNG, or WebP up to 10MB",
  },
}

function validatePublicStudentUpload(kind: PublicStudentUploadKind, file: File) {
  const rule = uploadRules[kind]
  if (!rule.types.has(file.type) || file.size > rule.maxBytes) {
    throw new Error(`Upload a ${rule.label}.`)
  }
}

export async function uploadPublicStudentFile(
  kind: PublicStudentUploadKind,
  file: File
): Promise<CloudinaryUploadResult> {
  validatePublicStudentUpload(kind, file)
  const sig = await api<CloudinarySignature>(`/api/public/training/upload-signature/${kind}`, {
    method: "POST",
  })
  const isRaw = kind === "certificate" && file.type === "application/pdf"
  const form = new FormData()
  form.append("file", file)
  form.append("api_key", sig.apiKey)
  form.append("timestamp", String(sig.timestamp))
  form.append("signature", sig.signature)
  form.append("folder", sig.folder)
  if (sig.allowedFormats) form.append("allowed_formats", sig.allowedFormats)
  if (sig.maxFileSize) form.append("max_file_size", String(sig.maxFileSize))

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${isRaw ? "raw" : "image"}/upload`,
    { method: "POST", body: form }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Upload failed (${res.status})`)
  }
  return res.json() as Promise<CloudinaryUploadResult>
}
