import {
  type AdminRole,
  type AdminUser,
  portalAccessLabels,
  roleAccessSummary,
  roleLabels,
  type UserWithTempPassword,
  useAdminUsers,
  useCurrentUser,
  useInviteUser,
  validateForm,
} from "@ark/api-client"
import {
  BackLink,
  Button,
  DataTable,
  Icons,
  Input,
  Modal,
  PageLoading,
  RolePill,
  Select,
  StatusBadge,
  TableSkeleton,
  TableStateRow,
  THead,
  Th,
  Tr,
  toast,
} from "@ark/ui"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { z } from "zod"
import { Footer, Navbar } from "@/components"

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .transform(v => v.toLowerCase()),
  firstName: z.string().trim().min(1, "First name required").max(100),
  lastName: z.string().trim().min(1, "Last name required").max(100),
  role: z.enum(["admin", "director", "trainer"]),
  position: z
    .string()
    .max(100)
    .transform(v => v.trim())
    .optional(),
  department: z
    .string()
    .max(100)
    .transform(v => v.trim())
    .optional(),
})

type InviteFormState = {
  email: string
  firstName: string
  lastName: string
  role: AdminRole
  position: string
  department: string
}

const emptyInvite: InviteFormState = {
  email: "",
  firstName: "",
  lastName: "",
  role: "trainer",
  position: "",
  department: "",
}

const roleFilterOptions = [
  { label: "All roles", value: "all" },
  { label: "Admins", value: "admin" },
  { label: "Directors", value: "director" },
  { label: "Trainers", value: "trainer" },
] as const

type RoleFilter = (typeof roleFilterOptions)[number]["value"]

function previewRoleForFilter(filter: RoleFilter): AdminRole {
  return filter === "all" ? "trainer" : filter
}

export default function AdminUsersPage() {
  const userQuery = useCurrentUser()
  const usersQuery = useAdminUsers(() => true)
  const invite = useInviteUser()

  const [inviteOpen, setInviteOpen] = createSignal(false)
  const [form, setForm] = createSignal<InviteFormState>({ ...emptyInvite })
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [tempCredentials, setTempCredentials] = createSignal<UserWithTempPassword | null>(null)
  const [search, setSearch] = createSignal("")
  const [roleFilter, setRoleFilter] = createSignal<RoleFilter>("all")

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

  const userStats = createMemo(() => {
    const list = usersQuery.data ?? []
    return {
      total: list.length,
      active: list.filter(user => user.isActive).length,
      pendingPassword: list.filter(user => user.mustChangePassword).length,
      trainers: list.filter(user => user.role === "trainer").length,
    }
  })

  const sortedUsers = createMemo<AdminUser[]>(() => {
    const term = search().trim().toLowerCase()
    const role = roleFilter()
    const list = (usersQuery.data ?? []).filter(user => {
      const matchesRole = role === "all" || user.role === role
      const haystack = `${user.firstName} ${user.lastName} ${user.email} ${user.position ?? ""} ${
        user.department ?? ""
      }`.toLowerCase()
      return matchesRole && (!term || haystack.includes(term))
    })
    return [...list].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return a.firstName.localeCompare(b.firstName)
    })
  })

  function resetForm() {
    setForm({ ...emptyInvite })
    setErrors({})
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
      toast.success(`Created ${result.user.firstName} ${result.user.lastName}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create user")
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

        <main class="flex-1 px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
          <div class="max-w-6xl mx-auto mt-4">
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <div class="mb-2">
                  <BackLink href="/">Dashboard</BackLink>
                </div>
                <h1 class="text-2xl font-bold text-foreground">User Management</h1>
                <p class="text-sm text-muted mt-0.5">
                  Invite, edit, and deactivate users in the Ark Institute portal.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={openInvite}>
                <Icons.plus class="w-4 h-4" /> Create user
              </Button>
            </div>

            <div class="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile label="Total users" value={userStats().total} />
              <SummaryTile label="Active" value={userStats().active} tone="success" />
              <SummaryTile
                label="Pending password"
                value={userStats().pendingPassword}
                tone={userStats().pendingPassword > 0 ? "warning" : "neutral"}
              />
              <SummaryTile label="Trainers" value={userStats().trainers} />
            </div>

            <div class="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                  <Input
                    label="Search users"
                    value={search()}
                    onInput={e => setSearch(e.currentTarget.value)}
                    leftIcon={Icons.search}
                    placeholder="Name, email, position, department"
                  />
                  <div>
                    <label
                      for="role-filter"
                      class="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Role
                    </label>
                    <Select<RoleFilter>
                      id="role-filter"
                      ariaLabel="Filter by role"
                      options={[...roleFilterOptions]}
                      value={roleFilter()}
                      onChange={setRoleFilter}
                    />
                  </div>
                </div>
              </div>
              <RoleAccessPreview role={previewRoleForFilter(roleFilter())} compact />
            </div>

            <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
              <Show when={!usersQuery.isPending} fallback={<TableSkeleton rows={6} cols={5} />}>
                <Show
                  when={usersQuery.isError}
                  fallback={
                    <DataTable>
                      <THead>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Role</Th>
                        <Th>Access</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                      </THead>
                      <tbody>
                        <For each={sortedUsers()}>
                          {user => (
                            <Tr hover={false}>
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
                              <td class="px-5 py-3">
                                <RolePill role={user.role} showAdminLabel />
                              </td>
                              <td class="px-5 py-3">
                                <AccessChips role={user.role} />
                              </td>
                              <td class="px-5 py-3">
                                <StatusBadge status={user.isActive ? "Active" : "Inactive"} />
                              </td>
                              <td class="px-5 py-3 text-right">
                                <a
                                  href={`/admin/users/${user.id}`}
                                  class="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                                >
                                  <Icons.settings class="w-3.5 h-3.5 text-muted" />
                                  Manage
                                </a>
                              </td>
                            </Tr>
                          )}
                        </For>
                        <Show when={sortedUsers().length === 0}>
                          <TableStateRow
                            colSpan={6}
                            icon={Icons.users}
                            heading={
                              usersQuery.data?.length
                                ? "No users match your filters"
                                : "No users yet"
                            }
                            description={
                              usersQuery.data?.length
                                ? "Clear the search or change the role filter."
                                : "Create the first portal account to start assigning roles."
                            }
                            action={
                              usersQuery.data?.length
                                ? {
                                    label: "Clear filters",
                                    onClick: () => {
                                      setSearch("")
                                      setRoleFilter("all")
                                    },
                                  }
                                : { label: "Create user", onClick: openInvite }
                            }
                          />
                        </Show>
                      </tbody>
                    </DataTable>
                  }
                >
                  <DataTable>
                    <tbody>
                      <TableStateRow
                        colSpan={6}
                        icon={Icons.alert}
                        heading="Could not load users"
                        description="Refresh the page or try again in a moment."
                        tone="danger"
                      />
                    </tbody>
                  </DataTable>
                </Show>
              </Show>
            </div>
          </div>
        </main>

        <Footer />
      </Show>

      <Modal open={inviteOpen()} onClose={closeInvite} title="Create user">
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
            leftIcon={Icons.mail}
            error={errors().email}
          />
          <div>
            <label for="invite-role" class="block text-sm font-medium text-foreground mb-1.5">
              Role
            </label>
            <Select<AdminRole>
              id="invite-role"
              ariaLabel="Role"
              options={[
                { label: "Trainer", value: "trainer" },
                { label: "Director", value: "director" },
                { label: "Admin", value: "admin" },
              ]}
              value={form().role}
              onChange={role => setForm({ ...form(), role })}
            />
            <RoleAccessPreview role={form().role} />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Position / Role"
              value={form().position}
              onInput={e => setForm({ ...form(), position: e.currentTarget.value })}
              placeholder="e.g. Operations Coordinator"
              error={errors().position}
            />
            <Input
              label="Department"
              value={form().department}
              onInput={e => setForm({ ...form(), department: e.currentTarget.value })}
              placeholder="e.g. Training"
              error={errors().department}
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={closeInvite}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={invite.isPending}
              loadingLabel="Creating…"
            >
              Create user
            </Button>
          </div>
        </form>
      </Modal>

      <TempPasswordModal credentials={tempCredentials()} onClose={() => setTempCredentials(null)} />
    </div>
  )
}

function SummaryTile(props: {
  label: string
  value: number
  tone?: "neutral" | "success" | "warning"
}) {
  const toneClass = () => {
    if (props.tone === "success") return "text-green-700 bg-green-50 border-green-100"
    if (props.tone === "warning") return "text-amber-700 bg-amber-50 border-amber-100"
    return "text-primary bg-primary/5 border-primary/10"
  }
  return (
    <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">{props.label}</p>
      <div class={`mt-3 inline-flex rounded-xl border px-3 py-1.5 ${toneClass()}`}>
        <span class="text-2xl font-semibold tabular-nums">{props.value}</span>
      </div>
    </div>
  )
}

function RoleAccessPreview(props: { role: AdminRole; compact?: boolean }) {
  return (
    <div
      class={`rounded-xl border border-border bg-surface-muted px-4 py-3 ${
        props.compact ? "" : "mt-3"
      }`}
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">
        {roleLabels[props.role]} access
      </p>
      <p class="mt-1 text-sm text-foreground">{roleAccessSummary[props.role]}</p>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <For each={portalAccessLabels(props.role)}>
          {label => (
            <span class="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted border border-border">
              {label}
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

function AccessChips(props: { role: AdminRole }) {
  const labels = () => portalAccessLabels(props.role)
  const visible = () => labels().slice(0, 3)
  const hiddenCount = () => Math.max(0, labels().length - visible().length)
  return (
    <div class="flex flex-wrap gap-1.5">
      <For each={visible()}>
        {label => (
          <span class="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">
            {label}
          </span>
        )}
      </For>
      <Show when={hiddenCount() > 0}>
        <span class="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">
          +{hiddenCount()}
        </span>
      </Show>
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
                  {copied() ? <Icons.check class="w-4 h-4" /> : <Icons.upload class="w-4 h-4" />}
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
