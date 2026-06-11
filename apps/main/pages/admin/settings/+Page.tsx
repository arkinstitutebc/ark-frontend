import { useCurrentUser, useEmailAlertSettings, useUpdateEmailAlertSettings } from "@ark/api-client"
import { BackLink, Button, Icons, Input, PageLoading, toast } from "@ark/ui"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { Footer, Navbar } from "@/components"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export default function AdminSettingsPage() {
  const userQuery = useCurrentUser()
  const settingsQuery = useEmailAlertSettings()
  const updateSettings = useUpdateEmailAlertSettings()

  const [recipients, setRecipients] = createSignal<string[]>([])
  const [emailInput, setEmailInput] = createSignal("")
  const [emailError, setEmailError] = createSignal("")
  const [dirty, setDirty] = createSignal(false)

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

  createEffect(() => {
    const data = settingsQuery.data
    if (!data || dirty()) return
    setRecipients(data.requestRecipients)
  })

  const isAdmin = () => userQuery.data?.role === "admin"
  const sortedRecipients = createMemo(() => [...recipients()].sort((a, b) => a.localeCompare(b)))
  const hasChanges = createMemo(() => {
    const saved = [...(settingsQuery.data?.requestRecipients ?? [])].sort()
    const current = sortedRecipients()
    return saved.length !== current.length || saved.some((email, index) => email !== current[index])
  })

  function addRecipient() {
    const email = normalizeEmail(emailInput())
    if (!email) return
    if (!emailPattern.test(email)) {
      setEmailError("Enter a valid email address")
      return
    }
    if (recipients().includes(email)) {
      setEmailError("That email is already included")
      return
    }
    setRecipients([...recipients(), email])
    setEmailInput("")
    setEmailError("")
    setDirty(true)
  }

  function removeRecipient(email: string) {
    setRecipients(recipients().filter(item => item !== email))
    setDirty(true)
  }

  function onEmailKeyDown(e: KeyboardEvent) {
    if (e.key !== "Enter") return
    e.preventDefault()
    addRecipient()
  }

  async function saveSettings() {
    try {
      await updateSettings.mutateAsync({ requestRecipients: sortedRecipients() })
      setDirty(false)
      toast.success("Email alert settings saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings")
    }
  }

  return (
    <div class="min-h-screen bg-surface-muted flex flex-col">
      <Show when={!userQuery.isPending && isAdmin()} fallback={<PageLoading />}>
        <Navbar
          userName={`${userQuery.data?.firstName ?? ""} ${userQuery.data?.lastName ?? ""}`.trim()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div class="mx-auto mt-4 max-w-5xl">
            <div class="mb-6">
              <div class="mb-2">
                <BackLink href="/">Dashboard</BackLink>
              </div>
              <h1 class="text-2xl font-bold text-foreground">Settings</h1>
              <p class="mt-0.5 text-sm text-muted">
                Portal-wide controls for request alerts and system behavior.
              </p>
            </div>

            <section class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div class="border-b border-border px-5 py-4 sm:px-6">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icons.mail class="h-4 w-4" />
                      </span>
                      <div>
                        <h2 class="text-base font-semibold text-foreground">Email Alerts</h2>
                        <p class="text-sm text-muted">
                          These people receive email when staff submit requests.
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    class={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      settingsQuery.data?.smtpConfigured
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span
                      class={`h-1.5 w-1.5 rounded-full ${
                        settingsQuery.data?.smtpConfigured ? "bg-green-500" : "bg-amber-500"
                      }`}
                    />
                    {settingsQuery.data?.smtpConfigured ? "SMTP ready" : "SMTP not configured"}
                  </span>
                </div>
              </div>

              <div class="space-y-5 px-5 py-5 sm:px-6">
                <div class="rounded-xl border border-border bg-surface-muted/40 p-3">
                  <Show
                    when={sortedRecipients().length > 0}
                    fallback={<p class="px-1 py-2 text-sm text-muted">No recipients added.</p>}
                  >
                    <div class="flex flex-wrap gap-2">
                      <For each={sortedRecipients()}>
                        {email => (
                          <span class="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground">
                            <span class="truncate">{email}</span>
                            <button
                              type="button"
                              class="rounded-full p-0.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              aria-label={`Remove ${email}`}
                              onClick={() => removeRecipient(email)}
                            >
                              <Icons.close class="h-3.5 w-3.5" />
                            </button>
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>

                <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <Input
                    label="Add recipient"
                    type="email"
                    value={emailInput()}
                    onInput={e => {
                      setEmailInput(e.currentTarget.value)
                      setEmailError("")
                    }}
                    onKeyDown={onEmailKeyDown}
                    leftIcon={Icons.mail}
                    placeholder="name@example.com"
                    error={emailError()}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    class="mt-0 sm:mt-7"
                    onClick={addRecipient}
                  >
                    <Icons.plus class="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>

              <div class="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p class="text-xs text-muted">
                  SMTP username and password stay on the server, not in portal settings.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={!hasChanges()}
                  loading={updateSettings.isPending}
                  loadingLabel="Saving"
                  onClick={saveSettings}
                >
                  Save changes
                </Button>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </Show>
    </div>
  )
}
