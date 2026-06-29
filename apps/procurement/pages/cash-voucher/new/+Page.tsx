import {
  AttachmentUploader,
  BackLink,
  Button,
  Field,
  fieldInputClass,
  formatPeso,
  Icons,
  PageContainer,
  Select,
} from "@ark/ui"
import { useCreatePettyCashRequest, useCurrentUser } from "@data/hooks"
import { createPettyCashRequestSchema } from "@data/schemas"
import type { PettyCashAttachmentInput, PettyCashReleaseMethod } from "@data/types"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, Show } from "solid-js"
import { navigate } from "vike/client/router"
import {
  pettyCashReleaseMethodLabels,
  pettyCashReleaseMethodOptions,
} from "@/components/petty-cash"

export default function NewPettyCashRequestPage() {
  const userQuery = useCurrentUser()
  const createRequest = useCreatePettyCashRequest()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [purpose, setPurpose] = createSignal("")
  const [amountRequested, setAmountRequested] = createSignal("")
  const [releaseMethod, setReleaseMethod] = createSignal<PettyCashReleaseMethod>("digital_transfer")
  const [releaseContactNumber, setReleaseContactNumber] = createSignal("")
  const [releaseAccountName, setReleaseAccountName] = createSignal("")
  const [attachments, setAttachments] = createSignal<PettyCashAttachmentInput[]>([])

  const amountPreview = createMemo(() => Number(amountRequested() || 0))

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    const data = {
      purpose: purpose(),
      amountRequested: Number(amountRequested()),
      releaseMethod: releaseMethod(),
      releaseContactNumber: releaseContactNumber().trim() || undefined,
      releaseAccountName: releaseAccountName().trim() || undefined,
      attachmentCount: attachments().length,
    }
    const result = validateForm(createPettyCashRequestSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    createRequest.mutate(
      {
        purpose: purpose().trim(),
        amountRequested: amountPreview().toFixed(2),
        releaseMethod: releaseMethod(),
        releaseContactNumber:
          releaseMethod() === "digital_transfer"
            ? releaseContactNumber().trim() || undefined
            : undefined,
        releaseAccountName:
          releaseMethod() === "digital_transfer"
            ? releaseAccountName().trim() || undefined
            : undefined,
        attachments: attachments().length ? attachments() : undefined,
      },
      {
        onSuccess: request => navigate(`/cash-voucher/${request.id}`),
      }
    )
  }

  return (
    <PageContainer>
      <div class="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center">
        <BackLink
          variant="icon"
          label="Back to Cash Voucher"
          onClick={() => navigate("/cash-voucher")}
        />
        <div class="min-w-0">
          <h1 class="text-xl font-semibold text-foreground sm:text-2xl">
            New Cash Voucher Request
          </h1>
          <p class="mt-1 text-sm text-muted">
            Request a small cash release for immediate operating needs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="space-y-6">
          <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 class="text-base font-semibold text-foreground sm:text-lg">Request Details</h2>
            <div class="mt-4 grid gap-4 md:grid-cols-2 sm:mt-5">
              <Field label="Amount Requested" error={errors().amountRequested}>
                <input
                  id="pc-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountRequested()}
                  onInput={e => setAmountRequested(e.currentTarget.value)}
                  placeholder="0.00"
                  class={fieldInputClass(errors().amountRequested)}
                />
              </Field>
              <div>
                <span class="mb-1 block text-sm font-medium text-foreground">Mode of Release</span>
                <Select
                  options={pettyCashReleaseMethodOptions}
                  value={releaseMethod()}
                  onChange={value => setReleaseMethod(value as PettyCashReleaseMethod)}
                  ariaLabel="Mode of release"
                />
              </div>
              <Show when={releaseMethod() === "digital_transfer"}>
                <Field label="Mobile / GCash Number" error={errors().releaseContactNumber}>
                  <input
                    id="pc-release-contact"
                    type="tel"
                    value={releaseContactNumber()}
                    onInput={e => setReleaseContactNumber(e.currentTarget.value)}
                    placeholder="09XX XXX XXXX"
                    class={fieldInputClass(errors().releaseContactNumber)}
                  />
                  <p class="mt-1 text-xs text-muted">
                    Enter the number for transfer, or upload a GCash QR below.
                  </p>
                </Field>
                <Field label="Account Name">
                  <input
                    id="pc-release-account"
                    type="text"
                    value={releaseAccountName()}
                    onInput={e => setReleaseAccountName(e.currentTarget.value)}
                    placeholder="Optional"
                    class={fieldInputClass()}
                  />
                </Field>
              </Show>
              <div class="md:col-span-2">
                <Field label="Purpose / Description" error={errors().purpose}>
                  <textarea
                    id="pc-purpose"
                    rows={4}
                    value={purpose()}
                    onInput={e => setPurpose(e.currentTarget.value)}
                    placeholder="Describe what the cash is for and why it is needed."
                    class={`${fieldInputClass(errors().purpose)} resize-none`}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <h2 class="text-base font-semibold text-foreground sm:text-lg">Supporting Documents</h2>
            <p class="mt-1 text-sm text-muted">
              Attach quotes, screenshots, or receipts if available.
            </p>
            <div class="mt-4">
              <AttachmentUploader
                attachments={attachments()}
                onChange={next => setAttachments(next)}
                signatureEndpoint="/api/procurement/upload-signature/attachment"
              />
            </div>
          </section>
        </div>

        <aside class="h-fit rounded-lg border border-border bg-surface p-4 sm:p-6 lg:sticky lg:top-24">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icons.wallet class="h-6 w-6" />
          </div>
          <h2 class="mt-4 text-lg font-semibold text-foreground">Request Summary</h2>
          <dl class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Requested by</dt>
              <dd class="text-right text-foreground">{userQuery.data?.email ?? "Current user"}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Release mode</dt>
              <dd class="text-right text-foreground">
                {pettyCashReleaseMethodLabels[releaseMethod()]}
              </dd>
            </div>
            <Show when={releaseMethod() === "digital_transfer" && releaseContactNumber().trim()}>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Transfer to</dt>
                <dd class="text-right text-foreground">{releaseContactNumber().trim()}</dd>
              </div>
            </Show>
            <div class="flex justify-between gap-4 border-t border-border pt-3">
              <dt class="font-medium text-foreground">Amount</dt>
              <dd class="text-right text-lg font-semibold text-foreground">
                {formatPeso(amountPreview())}
              </dd>
            </div>
          </dl>
          <Button type="submit" size="sm" class="mt-6 w-full" disabled={createRequest.isPending}>
            <Icons.plus class="h-4 w-4" />
            {createRequest.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </aside>
      </form>
    </PageContainer>
  )
}
