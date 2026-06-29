import { API_URL, useCurrentUser } from "@ark/api-client"
import { BackLink, Button, Icons, PageLoading } from "@ark/ui"
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

type FormMode = "Blank form" | "Generated template" | "Report template"

type BlankForm = {
  key: string
  group: string
  title: string
  code: string
  mode: FormMode
  detail: string
}

const forms: BlankForm[] = [
  {
    key: "cash-voucher-request",
    group: "Procurement",
    title: "Cash Voucher Request",
    code: "PCR",
    mode: "Blank form",
    detail: "Request for small operating cash releases.",
  },
  {
    key: "cash-voucher",
    group: "Procurement",
    title: "Cash Voucher",
    code: "PCV",
    mode: "Generated template",
    detail: "Voucher for cash release and liquidation.",
  },
  {
    key: "purchase-request",
    group: "Procurement",
    title: "Purchase Request",
    code: "PR",
    mode: "Blank form",
    detail: "Request goods or services before purchase order creation.",
  },
  {
    key: "purchase-order",
    group: "Procurement",
    title: "Purchase Order",
    code: "PO",
    mode: "Generated template",
    detail: "Supplier-facing purchase order template.",
  },
  {
    key: "check-voucher",
    group: "Finance",
    title: "Check Voucher",
    code: "CV",
    mode: "Generated template",
    detail: "Voucher for disbursement transactions.",
  },
  {
    key: "reimbursement-request",
    group: "Finance",
    title: "Reimbursement Request",
    code: "RR",
    mode: "Blank form",
    detail: "Claim form for reimbursable expenses and receipts.",
  },
  {
    key: "pnl-report",
    group: "Finance",
    title: "P&L Report",
    code: "PNL",
    mode: "Report template",
    detail: "Monthly profit and loss report template.",
  },
  {
    key: "income-statement",
    group: "Finance",
    title: "Income Statement",
    code: "IS",
    mode: "Report template",
    detail: "Segmented income statement template.",
  },
  {
    key: "billing-statement",
    group: "Billing",
    title: "Billing Statement",
    code: "BS",
    mode: "Generated template",
    detail: "Receivable statement template.",
  },
  {
    key: "payroll-summary",
    group: "HR",
    title: "Payroll Summary",
    code: "PAY",
    mode: "Report template",
    detail: "Payroll period report template.",
  },
  {
    key: "batch-setup",
    group: "Training",
    title: "Batch Setup",
    code: "BATCH",
    mode: "Blank form",
    detail: "Training batch setup form.",
  },
  {
    key: "student-profile",
    group: "Training",
    title: "Student Profile",
    code: "STU",
    mode: "Blank form",
    detail: "Student identity, contact, training, and document record.",
  },
]

const groups = [...new Set(forms.map(form => form.group))]

const modeTone: Record<FormMode, string> = {
  "Blank form": "border-blue-100 bg-blue-50 text-primary",
  "Generated template": "border-green-100 bg-green-50 text-green-700",
  "Report template": "border-amber-100 bg-amber-50 text-amber-700",
}

function formPdfUrl(key: string, download = false) {
  return `${API_URL}/api/admin/forms/${key}/pdf${download ? "?download=1" : ""}`
}

type LoadedPdf = {
  key: string
  blob: Blob
  url: string
}

export default function AdminFormsPage() {
  const userQuery = useCurrentUser()
  const [selectedKey, setSelectedKey] = createSignal(forms[0].key)
  const [loadedPdf, setLoadedPdf] = createSignal<LoadedPdf | null>(null)
  const [previewLoading, setPreviewLoading] = createSignal(true)
  const [previewError, setPreviewError] = createSignal<string | null>(null)
  const [downloadLoading, setDownloadLoading] = createSignal(false)

  createEffect(() => {
    if (typeof window === "undefined") return
    if (userQuery.isError) {
      window.location.href = "/login"
      return
    }
    if (userQuery.data && userQuery.data.role !== "admin") {
      window.location.href = "/"
    }
  })

  const isAdmin = () => userQuery.data?.role === "admin"
  const selected = createMemo(() => forms.find(form => form.key === selectedKey()) ?? forms[0])

  createEffect(() => {
    if (typeof window === "undefined" || !isAdmin()) return

    const controller = new AbortController()
    let objectUrl: string | null = null
    const key = selectedKey()
    setPreviewLoading(true)
    setPreviewError(null)
    setLoadedPdf(null)

    fetch(formPdfUrl(key), { credentials: "include", signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Could not load PDF (${response.status})`)
        return response.blob()
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob)
        setLoadedPdf({ key, blob, url: objectUrl })
      })
      .catch(error => {
        if (controller.signal.aborted) return
        setPreviewError(error instanceof Error ? error.message : "Could not load PDF preview")
      })
      .finally(() => {
        if (!controller.signal.aborted) setPreviewLoading(false)
      })

    onCleanup(() => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    })
  })

  const downloadSelected = async () => {
    const key = selected().key
    setDownloadLoading(true)
    try {
      const cached = loadedPdf()
      const blob =
        cached?.key === key
          ? cached.blob
          : await fetch(formPdfUrl(key), { credentials: "include" }).then(response => {
              if (!response.ok) throw new Error(`Could not download PDF (${response.status})`)
              return response.blob()
            })
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `${key}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Could not download PDF")
    } finally {
      setDownloadLoading(false)
    }
  }

  return (
    <div class="flex min-h-screen flex-col bg-surface-muted">
      <Show when={!userQuery.isPending && isAdmin()} fallback={<PageLoading />}>
        <Navbar
          userName={`${userQuery.data?.firstName ?? ""} ${userQuery.data?.lastName ?? ""}`.trim()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
          <div class="mx-auto max-w-7xl">
            <div class="mb-6">
              <div class="mb-2">
                <BackLink href="/">Dashboard</BackLink>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-foreground">Forms</h1>
                <p class="mt-1 text-sm text-muted">
                  Preview and download blank Ark ERP forms for manual use.
                </p>
              </div>
            </div>

            <div class="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]">
                <div class="border-b border-border px-4 py-3">
                  <p class="text-sm font-semibold text-foreground">Form Library</p>
                  <p class="text-xs text-muted">Choose a blank form to preview and download.</p>
                </div>
                <div class="max-h-[520px] overflow-y-auto lg:max-h-[calc(100vh-13rem)]">
                  <For each={groups}>
                    {group => (
                      <section class="border-b border-border last:border-b-0">
                        <div class="sticky top-0 z-10 bg-surface-muted px-4 py-2">
                          <p class="text-xs font-semibold uppercase text-muted">{group}</p>
                        </div>
                        <div class="p-2">
                          <For each={forms.filter(form => form.group === group)}>
                            {form => (
                              <button
                                type="button"
                                onClick={() => setSelectedKey(form.key)}
                                class={`group mb-1 w-full rounded-lg border px-3 py-3 text-left transition-colors last:mb-0 ${
                                  selectedKey() === form.key
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-transparent hover:border-border hover:bg-surface-muted"
                                }`}
                              >
                                <div class="flex items-start justify-between gap-3">
                                  <div class="min-w-0">
                                    <p class="font-semibold text-foreground group-hover:text-primary">
                                      {form.title}
                                    </p>
                                    <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                                      {form.detail}
                                    </p>
                                  </div>
                                  <span
                                    class={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${modeTone[form.mode]}`}
                                  >
                                    {form.code}
                                  </span>
                                </div>
                              </button>
                            )}
                          </For>
                        </div>
                      </section>
                    )}
                  </For>
                </div>
              </aside>

              <section class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                <div class="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class={`rounded-full border px-2.5 py-1 text-xs font-semibold ${modeTone[selected().mode]}`}
                      >
                        {selected().mode}
                      </span>
                      <span class="text-xs font-medium uppercase text-muted">
                        {selected().group}
                      </span>
                    </div>
                    <h2 class="mt-2 text-xl font-bold text-foreground">{selected().title}</h2>
                    <p class="mt-1 text-sm text-muted">{selected().detail}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    class="w-full sm:w-auto"
                    loading={downloadLoading()}
                    loadingLabel="Downloading..."
                    onClick={downloadSelected}
                  >
                    <Icons.download class="h-4 w-4" />
                    Download
                  </Button>
                </div>

                <div class="bg-[#eef1f5] p-3 sm:p-5">
                  <div class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                    <Show
                      when={!previewLoading()}
                      fallback={
                        <div class="flex h-[76vh] min-h-[620px] items-center justify-center text-sm text-muted">
                          Loading PDF preview...
                        </div>
                      }
                    >
                      <Show
                        when={loadedPdf()?.url && !previewError()}
                        fallback={
                          <div class="flex h-[76vh] min-h-[620px] flex-col items-center justify-center gap-3 px-6 text-center">
                            <Icons.alert class="h-8 w-8 text-muted" />
                            <p class="text-sm font-medium text-foreground">
                              PDF preview unavailable
                            </p>
                            <p class="max-w-md text-sm text-muted">{previewError()}</p>
                            <Button type="button" size="sm" onClick={downloadSelected}>
                              <Icons.download class="h-4 w-4" />
                              Download instead
                            </Button>
                          </div>
                        }
                      >
                        <iframe
                          title={`${selected().title} PDF preview`}
                          src={loadedPdf()?.url ?? undefined}
                          class="h-[76vh] min-h-[620px] w-full bg-surface"
                        />
                      </Show>
                    </Show>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
