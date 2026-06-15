import type { CloudinarySignature, CloudinaryUploadResult } from "@ark/api-client"
import { api } from "./api"

export type StudentUploadKind = "photo" | "certificate"

const UPLOAD_RULES: Record<
  StudentUploadKind,
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

function validateStudentUpload(kind: StudentUploadKind, file: File) {
  const rule = UPLOAD_RULES[kind]
  if (!rule.types.has(file.type)) throw new Error(`Upload a ${rule.label}.`)
  if (file.size > rule.maxBytes) throw new Error(`Upload a ${rule.label}.`)
}

export async function uploadStudentFile(
  kind: StudentUploadKind,
  file: File
): Promise<CloudinaryUploadResult> {
  validateStudentUpload(kind, file)
  const sig = await api<CloudinarySignature>(`/api/training/upload-signature/${kind}`, {
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
