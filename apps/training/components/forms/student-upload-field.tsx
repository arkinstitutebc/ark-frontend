import { Icons, toast } from "@ark/ui"
import { type StudentUploadKind, uploadStudentFile } from "@data/uploads"
import { createSignal, Show } from "solid-js"

interface StudentUploadFieldProps {
  label: string
  description: string
  kind: StudentUploadKind
  value?: string | null
  accept: string
  onChange: (url: string | null) => void
}

export function StudentUploadField(props: StudentUploadFieldProps) {
  const [uploading, setUploading] = createSignal(false)

  async function handleUpload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadStudentFile(props.kind, file)
      props.onChange(result.secure_url)
      toast.success(`${props.label} uploaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div class="rounded-lg border border-border bg-surface-muted/40 p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-foreground">{props.label}</p>
          <p class="mt-0.5 text-xs text-muted">{props.description}</p>
        </div>
        <label class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted">
          <Icons.upload class="h-3.5 w-3.5 text-muted" />
          {uploading() ? "Uploading..." : "Upload"}
          <input
            type="file"
            accept={props.accept}
            disabled={uploading()}
            onChange={e => {
              const target = e.currentTarget
              handleUpload(target.files?.[0]).finally(() => {
                target.value = ""
              })
            }}
            class="hidden"
          />
        </label>
      </div>

      <Show when={props.value} fallback={<p class="mt-3 text-xs text-muted">No file uploaded.</p>}>
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
              onClick={() => props.onChange(null)}
              class="text-xs font-medium text-muted transition-colors hover:text-red-600"
            >
              Remove
            </button>
          </div>
        )}
      </Show>
    </div>
  )
}
