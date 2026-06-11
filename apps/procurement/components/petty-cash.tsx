import { Icons } from "@ark/ui"
import type { PettyCashAttachment, PettyCashReleaseMethod, PettyCashRequest } from "@data/types"
import { For, Show } from "solid-js"

export const pettyCashReleaseMethodOptions: { value: PettyCashReleaseMethod; label: string }[] = [
  { value: "digital_transfer", label: "Digital Transfer" },
  { value: "physical_cash", label: "Physical Cash" },
]

export const pettyCashReleaseMethodLabels: Record<PettyCashReleaseMethod, string> = {
  digital_transfer: "Digital Transfer",
  physical_cash: "Physical Cash",
}

export function pettyCashAmount(request: PettyCashRequest) {
  return Number(request.amountApproved ?? request.amountRequested)
}

export function groupPettyCashAttachments(attachments: PettyCashAttachment[] | undefined) {
  return {
    supporting: (attachments ?? []).filter(att => att.type === "supporting_document"),
    receipts: (attachments ?? []).filter(att => att.type === "receipt"),
    forms: (attachments ?? []).filter(att => att.type === "liquidation_form"),
  }
}

export function PettyCashAttachmentList(props: {
  title: string
  attachments: PettyCashAttachment[]
}) {
  return (
    <section class="rounded-lg border border-border bg-surface">
      <div class="border-b border-border px-5 py-4">
        <h2 class="text-base font-semibold text-foreground">{props.title}</h2>
      </div>
      <Show
        when={props.attachments.length > 0}
        fallback={<p class="px-5 py-4 text-sm text-muted">No files uploaded.</p>}
      >
        <ul class="divide-y divide-border">
          <For each={props.attachments}>
            {att => (
              <li class="flex items-center gap-3 px-5 py-3">
                <Icons.fileText class="h-4 w-4 flex-shrink-0 text-muted" />
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-primary"
                >
                  {att.fileName}
                </a>
                <Show when={att.fileSize}>
                  <span class="text-xs text-muted">
                    {((att.fileSize ?? 0) / 1024).toFixed(0)} KB
                  </span>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  )
}
