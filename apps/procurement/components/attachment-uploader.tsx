import { Icons, toast } from "@ark/ui"
import { api } from "@data/api"
import type { PrAttachment } from "@data/types"
import { createSignal, For, Show } from "solid-js"

interface AttachmentUploaderProps {
  attachments: PrAttachment[]
  onChange: (next: PrAttachment[]) => void
}

interface SignatureResponse {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  resourceType: "image" | "raw" | "auto"
}

/**
 * Browser direct-upload to Cloudinary. The API issues a short-lived signature
 * (`POST /api/procurement/upload-signature/attachment`); the file goes
 * straight from browser → Cloudinary, never through our server.
 *
 * Receipts/quotes/invoices: jpg, jpeg, png, webp, pdf — up to 10MB each.
 */
export function AttachmentUploader(props: AttachmentUploaderProps) {
  const [uploading, setUploading] = createSignal(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const added: PrAttachment[] = []
    for (const file of Array.from(files)) {
      try {
        const sig = await api<SignatureResponse>("/api/procurement/upload-signature/attachment", {
          method: "POST",
        })
        const isPdf = file.type === "application/pdf"
        const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${isPdf ? "raw" : "image"}/upload`
        const form = new FormData()
        form.append("file", file)
        form.append("api_key", sig.apiKey)
        form.append("timestamp", String(sig.timestamp))
        form.append("signature", sig.signature)
        form.append("folder", sig.folder)
        const res = await fetch(url, { method: "POST", body: form })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error?.message ?? `Upload failed (${res.status})`)
        }
        const json = (await res.json()) as {
          secure_url: string
          resource_type: string
          bytes: number
        }
        added.push({
          name: file.name,
          url: json.secure_url,
          type: json.resource_type,
          size: json.bytes,
          uploadedAt: new Date().toISOString(),
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        toast.error(`${file.name}: ${msg}`)
      }
    }
    setUploading(false)
    if (added.length > 0) {
      props.onChange([...props.attachments, ...added])
      toast.success(`Uploaded ${added.length} file${added.length === 1 ? "" : "s"}`)
    }
  }

  const removeAt = (index: number) => {
    props.onChange(props.attachments.filter((_, i) => i !== index))
  }

  return (
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted">JPG, PNG, WebP, or PDF — up to 10MB each</span>
        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer">
          <Icons.upload class="w-3.5 h-3.5" />
          {uploading() ? "Uploading…" : "Add files"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            disabled={uploading()}
            onChange={e => {
              const target = e.currentTarget
              handleFiles(target.files).finally(() => {
                target.value = ""
              })
            }}
            class="hidden"
          />
        </label>
      </div>

      <Show
        when={props.attachments.length > 0}
        fallback={
          <p class="text-xs text-muted bg-surface-muted rounded-lg px-3 py-2 border border-dashed border-border">
            No attachments yet. Add receipts, quotes, or invoices.
          </p>
        }
      >
        <ul class="space-y-1.5">
          <For each={props.attachments}>
            {(att, i) => (
              <li class="flex items-center gap-2 px-3 py-2 bg-surface-muted rounded-lg border border-border">
                <Icons.fileText class="w-4 h-4 text-muted flex-shrink-0" />
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 text-sm text-foreground hover:text-primary truncate"
                  title={att.name}
                >
                  {att.name}
                </a>
                <Show when={att.size}>
                  <span class="text-xs text-muted flex-shrink-0">
                    {((att.size ?? 0) / 1024).toFixed(0)} KB
                  </span>
                </Show>
                <button
                  type="button"
                  onClick={() => removeAt(i())}
                  class="text-muted hover:text-red-500 transition-colors"
                  aria-label={`Remove ${att.name}`}
                >
                  <Icons.close class="w-4 h-4" />
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
