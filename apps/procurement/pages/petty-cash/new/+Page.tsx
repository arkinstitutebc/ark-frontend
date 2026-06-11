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
import { createEffect, createMemo, createSignal } from "solid-js"
import { navigate } from "vike/client/router"
import {
  pettyCashReleaseMethodLabels,
  pettyCashReleaseMethodOptions,
} from "@/components/petty-cash"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function NewPettyCashRequestPage() {
  const userQuery = useCurrentUser()
  const createRequest = useCreatePettyCashRequest()
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [requestDate, setRequestDate] = createSignal(today())
  const [department, setDepartment] = createSignal(userQuery.data?.department ?? "")
  const [purpose, setPurpose] = createSignal("")
  const [amountRequested, setAmountRequested] = createSignal("")
  const [urgency, setUrgency] = createSignal("")
  const [releaseMethod, setReleaseMethod] = createSignal<PettyCashReleaseMethod>("digital_transfer")
  const [notes, setNotes] = createSignal("")
  const [attachments, setAttachments] = createSignal<PettyCashAttachmentInput[]>([])

  const amountPreview = createMemo(() => Number(amountRequested() || 0))

  createEffect(() => {
    if (!department().trim() && userQuery.data?.department) {
      setDepartment(userQuery.data.department)
    }
  })

  const handleSubmit = (event: Event) => {
    event.preventDefault()
    const data = {
      requestDate: requestDate(),
      department: department(),
      purpose: purpose(),
      amountRequested: Number(amountRequested()),
      releaseMethod: releaseMethod(),
    }
    const result = validateForm(createPettyCashRequestSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    createRequest.mutate(
      {
        requestDate: requestDate(),
        department: department().trim(),
        purpose: purpose().trim(),
        amountRequested: amountPreview().toFixed(2),
        releaseMethod: releaseMethod(),
        urgency: urgency().trim() || undefined,
        notes: notes().trim() || undefined,
        attachments: attachments().length ? attachments() : undefined,
      },
      {
        onSuccess: request => navigate(`/petty-cash/${request.id}`),
      }
    )
  }

  return (
    <PageContainer>
      <div class="mb-8 flex items-center gap-3">
        <BackLink
          variant="icon"
          label="Back to Petty Cash"
          onClick={() => navigate("/petty-cash")}
        />
        <div>
          <h1 class="text-2xl font-semibold text-foreground">New Petty Cash Request</h1>
          <p class="mt-1 text-sm text-muted">
            Request a small cash release for immediate operating needs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="space-y-6">
          <section class="rounded-lg border border-border bg-surface p-6">
            <h2 class="text-lg font-semibold text-foreground">Request Details</h2>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Request Date" error={errors().requestDate}>
                <input
                  id="pc-request-date"
                  type="date"
                  value={requestDate()}
                  onInput={e => setRequestDate(e.currentTarget.value)}
                  class={fieldInputClass(errors().requestDate)}
                />
              </Field>
              <Field label="Department" error={errors().department}>
                <input
                  id="pc-department"
                  value={department()}
                  onInput={e => setDepartment(e.currentTarget.value)}
                  placeholder="Training, Procurement, Admin..."
                  class={fieldInputClass(errors().department)}
                />
              </Field>
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
              <Field label="Urgency" hint="Optional">
                <input
                  id="pc-urgency"
                  value={urgency()}
                  onInput={e => setUrgency(e.currentTarget.value)}
                  placeholder="Normal, urgent, same day..."
                  class={fieldInputClass()}
                />
              </Field>
              <Field label="Notes" hint="Optional">
                <input
                  id="pc-notes"
                  value={notes()}
                  onInput={e => setNotes(e.currentTarget.value)}
                  placeholder="Extra context for admin"
                  class={fieldInputClass()}
                />
              </Field>
            </div>
          </section>

          <section class="rounded-lg border border-border bg-surface p-6">
            <h2 class="text-lg font-semibold text-foreground">Supporting Documents</h2>
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

        <aside class="h-fit rounded-lg border border-border bg-surface p-6">
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
            <div class="flex justify-between gap-4 border-t border-border pt-3">
              <dt class="font-medium text-foreground">Amount</dt>
              <dd class="text-right text-lg font-semibold text-foreground">
                {formatPeso(amountPreview())}
              </dd>
            </div>
          </dl>
          <Button type="submit" class="mt-6 w-full" disabled={createRequest.isPending}>
            <Icons.plus class="h-4 w-4" />
            {createRequest.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </aside>
      </form>
    </PageContainer>
  )
}
