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
  const hasFile = () => !!props.value
  const isPhoto = () => props.kind === "photo"

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
    <div class="rounded-lg border border-border bg-surface p-3">
      <div class="flex items-start gap-3">
        <Show
          when={hasFile() && isPhoto()}
          fallback={
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted">
              <Icons.fileText class="h-5 w-5 text-muted" />
            </div>
          }
        >
          <img
            src={props.value ?? ""}
            alt=""
            class="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
          />
        </Show>

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-foreground">{props.label}</p>
              <p class="mt-0.5 text-xs text-muted">{props.description}</p>
            </div>
            <span
              class={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                hasFile() ? "bg-primary/10 text-primary" : "bg-surface-muted text-muted"
              }`}
            >
              {hasFile() ? "Uploaded" : "Missing"}
            </span>
          </div>

          <Show
            when={props.value}
            fallback={
              <div class="mt-3">
                <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted">
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
            }
          >
            {url => (
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={url()}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
                >
                  <Icons.eye class="h-3.5 w-3.5 text-muted" />
                  View
                </a>
                <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted">
                  <Icons.upload class="h-3.5 w-3.5 text-muted" />
                  {uploading() ? "Uploading..." : "Replace"}
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
                <button
                  type="button"
                  onClick={() => props.onChange(null)}
                  class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Icons.trash class="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  )
}
