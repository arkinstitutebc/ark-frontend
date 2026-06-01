import type { CloudinarySignature, CloudinaryUploadResult } from "@ark/api-client"
import { api } from "./api"

export type StudentUploadKind = "photo" | "certificate"

export async function uploadStudentFile(
  kind: StudentUploadKind,
  file: File
): Promise<CloudinaryUploadResult> {
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
