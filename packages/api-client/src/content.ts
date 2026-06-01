import { createMutation, createQuery, useQueryClient } from "@tanstack/solid-query"
import { api } from "./api"

export interface ContentPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImageUrl: string | null
  attachments: ContentAttachment[] | null
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface ContentAttachment {
  name: string
  url: string
  type?: string
  size?: number
  uploadedAt?: string
}

export interface ContentPostInput {
  title: string
  slug: string
  excerpt?: string | null
  content: string
  coverImageUrl?: string | null
  attachments?: ContentAttachment[] | null
  seoTitle?: string | null
  seoDescription?: string | null
  published?: boolean
}

export interface CloudinarySignature {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  allowedFormats?: string
  maxFileSize?: number
}

export interface CloudinaryUploadResult {
  secure_url: string
  resource_type: string
  bytes: number
}

export function useAdminContentPosts() {
  return createQuery(() => ({
    queryKey: ["admin", "content", "posts"],
    queryFn: () => api<ContentPost[]>("/api/admin/content/posts"),
    staleTime: 30 * 1000,
  }))
}

export function useCreateContentPost() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (data: ContentPostInput) =>
      api<ContentPost>("/api/admin/content/posts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "content", "posts"] }),
  }))
}

export function useUpdateContentPost() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (vars: { id: string; data: Partial<ContentPostInput> }) =>
      api<ContentPost>(`/api/admin/content/posts/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify(vars.data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "content", "posts"] }),
  }))
}

export function useDeleteContentPost() {
  const qc = useQueryClient()
  return createMutation(() => ({
    mutationFn: (id: string) =>
      api<void>(`/api/admin/content/posts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "content", "posts"] }),
  }))
}

export async function uploadContentCover(file: File): Promise<CloudinaryUploadResult> {
  const sig = await api<CloudinarySignature>("/api/admin/content/upload-signature/cover", {
    method: "POST",
  })
  const form = new FormData()
  form.append("file", file)
  form.append("api_key", sig.apiKey)
  form.append("timestamp", String(sig.timestamp))
  form.append("signature", sig.signature)
  form.append("folder", sig.folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Upload failed (${res.status})`)
  }
  return res.json() as Promise<CloudinaryUploadResult>
}
