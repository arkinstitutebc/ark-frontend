import {
  type AdminRole,
  type UserWithTempPassword,
  useActivateUser,
  useAdminUser,
  useCurrentUser,
  useDeactivateUser,
  useResetUserPassword,
  useUpdateUser,
} from "@ark/api-client"
import { Button, Icons, Input, Modal } from "@ark/ui"
import { createEffect, createMemo, createSignal, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { Footer, Navbar } from "@/components"

export default function AdminUserDetailPage() {
  const pageContext = usePageContext()
  const id = createMemo(() => pageContext.routeParams.id as string)

  const userQuery = useCurrentUser()
  const target = useAdminUser(id)
  const update = useUpdateUser()
  const deactivate = useDeactivateUser()
  const activate = useActivateUser()
  const reset = useResetUserPassword()

  const [firstName, setFirstName] = createSignal("")
  const [lastName, setLastName] = createSignal("")
  const [role, setRole] = createSignal<AdminRole>("trainer")
  const [hydrated, setHydrated] = createSignal(false)
  const [error, setError] = createSignal("")
  const [success, setSuccess] = createSignal("")
  const [tempCredentials, setTempCredentials] = createSignal<UserWithTempPassword | null>(null)

  // Auth gate: must be admin.
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
    const u = target.data
    if (u && !hydrated()) {
      setFirstName(u.firstName)
      setLastName(u.lastName)
      setRole(u.role)
      setHydrated(true)
    }
  })

  const isSelf = () => userQuery.data?.id === id()
  const isAdmin = () => userQuery.data?.role === "admin"

  function clearMessages() {
    setError("")
    setSuccess("")
  }

  async function saveChanges(e: Event) {
    e.preventDefault()
    clearMessages()
    const u = target.data
    if (!u) return
    const payload: { firstName?: string; lastName?: string; role?: AdminRole } = {}
    if (firstName() !== u.firstName) payload.firstName = firstName()
    if (lastName() !== u.lastName) payload.lastName = lastName()
    if (!isSelf() && role() !== u.role) payload.role = role()
    if (Object.keys(payload).length === 0) {
      setSuccess("No changes to save.")
      return
    }
    try {
      await update.mutateAsync({ id: id(), data: payload })
      setSuccess("Changes saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes")
    }
  }

  async function handleDeactivate() {
    clearMessages()
    if (!confirm("Deactivate this user? They will not be able to log in.")) return
    try {
      await deactivate.mutateAsync(id())
      setSuccess("User deactivated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate user")
    }
  }

  async function handleActivate() {
    clearMessages()
    try {
      await activate.mutateAsync(id())
      setSuccess("User reactivated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reactivate user")
    }
  }

  async function handleReset() {
    clearMessages()
    if (!confirm("Issue a new temporary password? The user will be forced to change it.")) return
    try {
      const result = await reset.mutateAsync(id())
      setTempCredentials(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password")
    }
  }

  return (
    <div class="min-h-screen bg-surface-muted flex flex-col">
      <Show
        when={!userQuery.isPending && isAdmin()}
        fallback={
          <div class="flex-1 flex items-center justify-center">
            <div class="animate-pulse text-sm text-muted">Loading…</div>
          </div>
        }
      >
        <Navbar
          userName={`${userQuery.data?.firstName ?? ""} ${userQuery.data?.lastName ?? ""}`.trim()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
        />

        <main class="flex-1 px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
          <div class="max-w-3xl mx-auto mt-4">
            <a
              href="/admin/users"
              class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-4"
            >
              <Icons.arrowLeft class="w-4 h-4" /> Back to users
            </a>

            <Show
              when={!target.isPending}
              fallback={
                <div class="bg-surface rounded-2xl border border-border p-12 text-center text-sm text-muted">
                  Loading user…
                </div>
              }
            >
              <Show
                when={target.data}
                fallback={
                  <div class="bg-surface rounded-2xl border border-border p-12 text-center text-sm text-red-600">
                    User not found.
                  </div>
                }
              >
                {user => (
                  <div class="space-y-6">
                    <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                      <div class="px-6 py-5 border-b border-border flex items-start justify-between gap-4">
                        <div>
                          <h1 class="text-xl font-bold text-foreground">
                            {user().firstName} {user().lastName}
                          </h1>
                          <p class="text-sm text-muted mt-0.5">{user().email}</p>
                        </div>
                        <Show
                          when={user().isActive}
                          fallback={
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-surface-muted text-muted">
                              <span class="w-1.5 h-1.5 rounded-full bg-muted" /> Inactive
                            </span>
                          }
                        >
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                          </span>
                        </Show>
                      </div>

                      <form onSubmit={saveChanges} class="px-6 py-6 space-y-5">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="First name"
                            value={firstName()}
                            onInput={e => setFirstName(e.currentTarget.value)}
                          />
                          <Input
                            label="Last name"
                            value={lastName()}
                            onInput={e => setLastName(e.currentTarget.value)}
                          />
                        </div>
                        <div>
                          <label
                            for="user-role"
                            class="block text-sm font-medium text-foreground mb-1.5"
                          >
                            Role
                          </label>
                          <select
                            id="user-role"
                            value={role()}
                            disabled={isSelf()}
                            onChange={e => setRole(e.currentTarget.value as AdminRole)}
                            class="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-lg focus:border-primary outline-none transition-colors disabled:bg-surface-muted disabled:cursor-not-allowed"
                          >
                            <option value="trainer">Trainer</option>
                            <option value="director">Director</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Show when={isSelf()}>
                            <p class="text-xs text-muted mt-1">You cannot change your own role.</p>
                          </Show>
                        </div>

                        <Show when={error()}>
                          <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <Icons.alert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p class="text-sm text-red-700">{error()}</p>
                          </div>
                        </Show>
                        <Show when={success()}>
                          <div class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                            <Icons.checkCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p class="text-sm text-green-700">{success()}</p>
                          </div>
                        </Show>

                        <div class="flex justify-end">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={update.isPending}
                          >
                            {update.isPending ? "Saving…" : "Save changes"}
                          </Button>
                        </div>
                      </form>
                    </div>

                    <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                      <div class="px-6 py-5 border-b border-border">
                        <h2 class="text-base font-semibold text-foreground">Account actions</h2>
                      </div>
                      <div class="px-6 py-5 space-y-3">
                        <button
                          type="button"
                          onClick={handleReset}
                          disabled={reset.isPending}
                          class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-left transition-colors disabled:opacity-50"
                        >
                          <span>
                            <span class="block text-sm font-medium text-foreground">
                              Reset password
                            </span>
                            <span class="block text-xs text-muted mt-0.5">
                              Generate a new temporary password. The user will be forced to change
                              it on next login.
                            </span>
                          </span>
                          <Icons.lock class="w-5 h-5 text-muted" />
                        </button>

                        <Show
                          when={user().isActive}
                          fallback={
                            <button
                              type="button"
                              onClick={handleActivate}
                              disabled={activate.isPending}
                              class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border hover:border-green-500 hover:bg-green-50 text-left transition-colors disabled:opacity-50"
                            >
                              <span>
                                <span class="block text-sm font-medium text-foreground">
                                  Reactivate user
                                </span>
                                <span class="block text-xs text-muted mt-0.5">
                                  Restore login access for this user.
                                </span>
                              </span>
                              <Icons.checkCircle class="w-5 h-5 text-muted" />
                            </button>
                          }
                        >
                          <button
                            type="button"
                            onClick={handleDeactivate}
                            disabled={isSelf() || deactivate.isPending}
                            class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border hover:border-red-500 hover:bg-red-50 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>
                              <span class="block text-sm font-medium text-foreground">
                                Deactivate user
                              </span>
                              <span class="block text-xs text-muted mt-0.5">
                                {isSelf()
                                  ? "You cannot deactivate yourself."
                                  : "Block this user from logging in. Their data is preserved."}
                              </span>
                            </span>
                            <Icons.xCircle class="w-5 h-5 text-muted" />
                          </button>
                        </Show>
                      </div>
                    </div>
                  </div>
                )}
              </Show>
            </Show>
          </div>
        </main>

        <Footer />
      </Show>

      <TempPasswordModal credentials={tempCredentials()} onClose={() => setTempCredentials(null)} />
    </div>
  )
}

function TempPasswordModal(props: {
  credentials: UserWithTempPassword | null
  onClose: () => void
}) {
  const [copied, setCopied] = createSignal(false)
  const [acknowledged, setAcknowledged] = createSignal(false)

  createEffect(() => {
    if (props.credentials) {
      setCopied(false)
      setAcknowledged(false)
    }
  })

  async function copyPassword() {
    const cred = props.credentials
    if (!cred || typeof navigator === "undefined") return
    try {
      await navigator.clipboard.writeText(cred.tempPassword)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal
      open={!!props.credentials}
      onClose={() => acknowledged() && props.onClose()}
      title="New temporary password"
    >
      <Show when={props.credentials}>
        {cred => (
          <div class="space-y-4">
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Icons.alert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-amber-900">
                <p class="font-medium">This password is shown only once.</p>
                <p class="text-amber-800 mt-0.5">
                  Share it with <span class="font-medium">{cred().user.email}</span> securely.
                </p>
              </div>
            </div>

            <div class="bg-surface-muted border border-border rounded-lg p-3">
              <p class="text-xs text-muted mb-1">Temporary password</p>
              <div class="flex items-center gap-2">
                <code class="flex-1 font-mono text-sm bg-surface px-3 py-2 rounded border border-border select-all">
                  {cred().tempPassword}
                </code>
                <Button type="button" variant="secondary" size="sm" onClick={copyPassword}>
                  <Show when={copied()} fallback={<Icons.upload class="w-4 h-4" />}>
                    <Icons.check class="w-4 h-4" />
                  </Show>
                  {copied() ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <label class="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={acknowledged()}
                onChange={e => setAcknowledged(e.currentTarget.checked)}
                class="mt-0.5"
              />
              <span>I have copied this password and shared it securely.</span>
            </label>

            <div class="flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!acknowledged()}
                onClick={props.onClose}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Show>
    </Modal>
  )
}
