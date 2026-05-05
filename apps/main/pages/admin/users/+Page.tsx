import {
  type AdminRole,
  type AdminUser,
  type UserWithTempPassword,
  useAdminUsers,
  useCurrentUser,
  useInviteUser,
  validateForm,
} from "@ark/api-client"
import { Button, Icons, Input, Modal } from "@ark/ui"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { z } from "zod"
import { Footer, Navbar } from "@/components"

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  firstName: z.string().min(1, "First name required").max(100),
  lastName: z.string().min(1, "Last name required").max(100),
  role: z.enum(["admin", "director", "trainer"]),
})

type InviteFormState = {
  email: string
  firstName: string
  lastName: string
  role: AdminRole
}

const emptyInvite: InviteFormState = {
  email: "",
  firstName: "",
  lastName: "",
  role: "trainer",
}

export default function AdminUsersPage() {
  const userQuery = useCurrentUser()
  const usersQuery = useAdminUsers(() => true)
  const invite = useInviteUser()

  const [inviteOpen, setInviteOpen] = createSignal(false)
  const [form, setForm] = createSignal<InviteFormState>({ ...emptyInvite })
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [submitError, setSubmitError] = createSignal("")
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

  const isAdmin = () => userQuery.data?.role === "admin"

  const sortedUsers = createMemo<AdminUser[]>(() => {
    const list = usersQuery.data ?? []
    return [...list].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return a.firstName.localeCompare(b.firstName)
    })
  })

  function resetForm() {
    setForm({ ...emptyInvite })
    setErrors({})
    setSubmitError("")
  }

  function openInvite() {
    resetForm()
    setInviteOpen(true)
  }

  function closeInvite() {
    setInviteOpen(false)
  }

  async function submitInvite(e: Event) {
    e.preventDefault()
    setSubmitError("")
    const parsed = validateForm(inviteSchema, form())
    if (!parsed.success) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})
    try {
      const result = await invite.mutateAsync(parsed.data)
      setInviteOpen(false)
      setTempCredentials(result)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not invite user")
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
          <div class="max-w-6xl mx-auto mt-4">
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <a
                  href="/"
                  class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-2"
                >
                  <Icons.arrowLeft class="w-4 h-4" /> Dashboard
                </a>
                <h1 class="text-2xl font-bold text-foreground">User Management</h1>
                <p class="text-sm text-muted mt-0.5">
                  Invite, edit, and deactivate users in the Ark Institute portal.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={openInvite}>
                <Icons.plus class="w-4 h-4" /> Invite user
              </Button>
            </div>

            <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
              <Show
                when={!usersQuery.isPending}
                fallback={<div class="p-12 text-center text-sm text-muted">Loading users…</div>}
              >
                <Show
                  when={usersQuery.isError}
                  fallback={
                    <table class="w-full text-sm">
                      <thead class="bg-surface-muted text-muted text-xs uppercase tracking-wide">
                        <tr>
                          <th class="px-5 py-3 text-left font-medium">Name</th>
                          <th class="px-5 py-3 text-left font-medium">Email</th>
                          <th class="px-5 py-3 text-left font-medium">Role</th>
                          <th class="px-5 py-3 text-left font-medium">Status</th>
                          <th class="px-5 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={sortedUsers()}>
                          {user => (
                            <tr class="border-t border-border hover:bg-surface-muted">
                              <td class="px-5 py-3 text-foreground">
                                {user.firstName} {user.lastName}
                                <Show when={user.mustChangePassword}>
                                  <span class="ml-2 inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                    <Icons.alert class="w-3 h-3" />
                                    Must change password
                                  </span>
                                </Show>
                              </td>
                              <td class="px-5 py-3 text-muted">{user.email}</td>
                              <td class="px-5 py-3 text-foreground capitalize">{user.role}</td>
                              <td class="px-5 py-3">
                                <Show
                                  when={user.isActive}
                                  fallback={
                                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-surface-muted text-muted">
                                      <span class="w-1.5 h-1.5 rounded-full bg-muted" />
                                      Inactive
                                    </span>
                                  }
                                >
                                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">
                                    <span class="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    Active
                                  </span>
                                </Show>
                              </td>
                              <td class="px-5 py-3 text-right">
                                <a
                                  href={`/admin/users/${user.id}`}
                                  class="text-sm text-primary hover:underline"
                                >
                                  Manage
                                </a>
                              </td>
                            </tr>
                          )}
                        </For>
                        <Show when={sortedUsers().length === 0}>
                          <tr>
                            <td colspan={5} class="px-5 py-12 text-center text-sm text-muted">
                              No users yet.
                            </td>
                          </tr>
                        </Show>
                      </tbody>
                    </table>
                  }
                >
                  <div class="p-12 text-center text-sm text-red-600">
                    Could not load users. Please refresh.
                  </div>
                </Show>
              </Show>
            </div>
          </div>
        </main>

        <Footer />
      </Show>

      <Modal open={inviteOpen()} onClose={closeInvite} title="Invite a new user">
        <form onSubmit={submitInvite} class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              value={form().firstName}
              onInput={e => setForm({ ...form(), firstName: e.currentTarget.value })}
              error={errors().firstName}
            />
            <Input
              label="Last name"
              value={form().lastName}
              onInput={e => setForm({ ...form(), lastName: e.currentTarget.value })}
              error={errors().lastName}
            />
          </div>
          <Input
            type="email"
            label="Email"
            value={form().email}
            onInput={e => setForm({ ...form(), email: e.currentTarget.value })}
            leftIcon={<Icons.mail class="w-5 h-5" />}
            error={errors().email}
          />
          <div>
            <label for="invite-role" class="block text-sm font-medium text-foreground mb-1.5">
              Role
            </label>
            <select
              id="invite-role"
              value={form().role}
              onChange={e => setForm({ ...form(), role: e.currentTarget.value as AdminRole })}
              class="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="trainer">Trainer</option>
              <option value="director">Director</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Show when={submitError()}>
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <Icons.alert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p class="text-sm text-red-700">{submitError()}</p>
            </div>
          </Show>

          <div class="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={closeInvite}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={invite.isPending}>
              {invite.isPending ? "Inviting…" : "Send invite"}
            </Button>
          </div>
        </form>
      </Modal>

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
      title="Temporary password"
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
                  They'll be prompted to change it on first login.
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
