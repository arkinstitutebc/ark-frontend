import {
  type CurrentUser,
  performLogout,
  useChangePassword,
  useCurrentUser,
  useUpdateMe,
  useUploadAvatar,
} from "@ark/api-client"
import { Button, Icons, Input, RolePill, toast } from "@ark/ui"
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"

interface PasswordRule {
  label: string
  test: (v: string) => boolean
}

const RULES: PasswordRule[] = [
  { label: "At least 12 characters", test: v => v.length >= 12 },
  { label: "Contains an uppercase letter", test: v => /[A-Z]/.test(v) },
  { label: "Contains a lowercase letter", test: v => /[a-z]/.test(v) },
  { label: "Contains a digit", test: v => /\d/.test(v) },
]

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_AVATAR_MIMES = ["image/jpeg", "image/png", "image/webp"]

/** Single-source-of-truth header — extracted Component per SOP hydration rule. */
function ProfileHeader(props: { user: CurrentUser }) {
  return (
    <div class="px-8 pt-8 pb-6 border-b border-border">
      <h1 class="text-2xl font-bold text-foreground">Manage Profile</h1>
      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span class="truncate">
          {props.user.firstName} {props.user.lastName}
        </span>
        <span aria-hidden="true">·</span>
        <span class="truncate">{props.user.email}</span>
        <RolePill role={props.user.role} />
      </div>
    </div>
  )
}

/**
 * Avatar preview — image when set, branded fallback otherwise.
 * Ternary wrapped in a JSX fragment so the conditional lives inside a JSX
 * expression boundary and is REACTIVE. A bare `return cond ? A : B` from a
 * Solid component is evaluated once at mount and never updates when props
 * change. `<Show fallback={JSX}>` is forbidden by SOP (commit e1d3713).
 */
function AvatarPreview(props: { photoUrl: string | undefined; alt: string }) {
  const hasPhoto = () => !!props.photoUrl && props.photoUrl.length > 0
  return (
    <>
      {hasPhoto() ? (
        <img
          src={props.photoUrl}
          alt={props.alt}
          class="w-20 h-20 rounded-full object-cover border border-border"
        />
      ) : (
        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
          <Icons.user class="w-10 h-10 text-white" />
        </div>
      )}
    </>
  )
}

export default function ProfilePage() {
  const userQuery = useCurrentUser()
  const updateMe = useUpdateMe()
  const uploadAvatar = useUploadAvatar()
  const changePassword = useChangePassword()

  // ── Name card state ──────────────────────────────────────────────
  const [firstName, setFirstName] = createSignal("")
  const [lastName, setLastName] = createSignal("")
  let initializedFromServer = false
  createEffect(() => {
    if (initializedFromServer) return
    const u = userQuery.data
    if (u) {
      setFirstName(u.firstName)
      setLastName(u.lastName)
      initializedFromServer = true
    }
  })
  const nameDirty = createMemo(() => {
    const u = userQuery.data
    if (!u) return false
    return firstName() !== u.firstName || lastName() !== u.lastName
  })
  const canSaveName = createMemo(
    () =>
      nameDirty() &&
      firstName().trim().length > 0 &&
      lastName().trim().length > 0 &&
      !updateMe.isPending
  )

  async function saveName() {
    if (!canSaveName()) return
    try {
      const updated = await updateMe.mutateAsync({
        firstName: firstName().trim(),
        lastName: lastName().trim(),
      })
      // Reflect the server's canonical (possibly trimmed) values immediately
      // so the inputs match what was persisted, without waiting for refetch.
      setFirstName(updated.firstName)
      setLastName(updated.lastName)
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile")
    }
  }

  // ── Photo card state ─────────────────────────────────────────────
  let fileInputRef: HTMLInputElement | undefined

  function pickPhoto() {
    fileInputRef?.click()
  }

  async function onFilePicked(e: Event) {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    target.value = "" // allow re-upload of the same filename
    if (!file) return
    if (!ALLOWED_AVATAR_MIMES.includes(file.type)) {
      toast.error("Avatar must be a JPEG, PNG, or WebP image")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Avatar must be 2 MB or smaller")
      return
    }
    try {
      await uploadAvatar.mutateAsync(file)
      toast.success("Photo uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload photo")
    }
  }

  // ── Password card state ──────────────────────────────────────────
  const [oldPassword, setOldPassword] = createSignal("")
  const [newPassword, setNewPassword] = createSignal("")
  const [confirmPassword, setConfirmPassword] = createSignal("")
  const [showOld, setShowOld] = createSignal(false)
  const [showNew, setShowNew] = createSignal(false)

  const passingRules = createMemo(() => RULES.filter(r => r.test(newPassword())))
  const passwordsMatch = createMemo(
    () => newPassword().length > 0 && newPassword() === confirmPassword()
  )
  const canChangePassword = createMemo(
    () =>
      oldPassword().length > 0 &&
      passingRules().length === RULES.length &&
      passwordsMatch() &&
      !changePassword.isPending
  )

  let logoutTimerId: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => {
    if (logoutTimerId) clearTimeout(logoutTimerId)
  })

  async function submitPassword(e: Event) {
    e.preventDefault()
    if (!canChangePassword()) return
    try {
      await changePassword.mutateAsync({
        oldPassword: oldPassword(),
        newPassword: newPassword(),
      })
      toast.success("Password changed. Logging you out…")
      logoutTimerId = setTimeout(() => performLogout(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password")
    }
  }

  // ── URL params (read in onMount; SSR-safe) ───────────────────────
  const [required, setRequired] = createSignal(false)
  const [returnUrl, setReturnUrl] = createSignal<string | null>(null)
  onMount(() => {
    const params = new URLSearchParams(window.location.search)
    setRequired(params.get("required") === "1")
    setReturnUrl(params.get("return"))
  })
  const mustChange = () => userQuery.data?.mustChangePassword === true
  const showRequiredBanner = () => required() || mustChange()

  return (
    <div class="min-h-screen bg-surface-muted">
      <div class="max-w-2xl mx-auto px-4 py-12">
        <Show when={!showRequiredBanner()}>
          <div class="mb-6">
            <a
              href={returnUrl() ?? "/"}
              class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
            >
              <Icons.arrowLeft class="w-4 h-4" /> {returnUrl() ? "Back" : "Dashboard"}
            </a>
          </div>
        </Show>

        <Show when={showRequiredBanner()}>
          <div class="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Icons.alert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-amber-900">
                You must change your password before using the system.
              </p>
              <p class="text-xs text-amber-700 mt-1">
                You won't be able to access any portal until you set a new password.
              </p>
            </div>
          </div>
        </Show>

        <div class="space-y-6">
          {/* ── Header card ─────────────────────────────────────── */}
          <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <Show when={userQuery.data}>{user => <ProfileHeader user={user()} />}</Show>
          </div>

          {/* ── Photo card ──────────────────────────────────────── */}
          <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div class="px-8 py-6">
              <h2 class="text-lg font-semibold text-foreground">Profile photo</h2>
              <p class="text-sm text-muted mt-1">
                Shown in the top-right account menu and across the portal.
              </p>
              <div class="mt-5 flex items-center gap-5">
                <AvatarPreview
                  photoUrl={userQuery.data?.photoUrl}
                  alt={`${userQuery.data?.firstName ?? ""} ${userQuery.data?.lastName ?? ""}`.trim()}
                />
                <div class="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="sr-only"
                    onChange={onFilePicked}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={pickPhoto}
                    disabled={uploadAvatar.isPending}
                  >
                    <Icons.upload class="w-4 h-4" />
                    {uploadAvatar.isPending ? "Uploading…" : "Upload photo"}
                  </Button>
                  <p class="text-xs text-muted mt-2">JPEG, PNG, or WebP. Max 2 MB.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Name card ───────────────────────────────────────── */}
          <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div class="px-8 py-6 space-y-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Your name</h2>
                <p class="text-sm text-muted mt-1">
                  How your name appears in the portal and in PDFs.
                </p>
              </div>
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
              <div class="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={saveName}
                  disabled={!canSaveName()}
                >
                  {updateMe.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Password card ───────────────────────────────────── */}
          <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <form onSubmit={submitPassword} class="px-8 py-6 space-y-4">
              <div>
                <h2 class="text-lg font-semibold text-foreground">Password</h2>
                <p class="text-sm text-muted mt-1">
                  You'll be logged out after a successful password change.
                </p>
              </div>

              <Input
                type={showOld() ? "text" : "password"}
                label="Current password"
                placeholder="Your current password"
                value={oldPassword()}
                onInput={e => setOldPassword(e.currentTarget.value)}
                leftIcon={Icons.lock}
                showPasswordToggle
                showPassword={showOld()}
                onTogglePassword={() => setShowOld(!showOld())}
                eyeIcon={Icons.eye}
                eyeOffIcon={Icons.eyeOff}
              />

              <Input
                type={showNew() ? "text" : "password"}
                label="New password"
                placeholder="At least 12 characters"
                value={newPassword()}
                onInput={e => setNewPassword(e.currentTarget.value)}
                leftIcon={Icons.lock}
                showPasswordToggle
                showPassword={showNew()}
                onTogglePassword={() => setShowNew(!showNew())}
                eyeIcon={Icons.eye}
                eyeOffIcon={Icons.eyeOff}
              />

              <Show when={newPassword().length > 0}>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {RULES.map(rule => {
                    const ok = rule.test(newPassword())
                    return (
                      <li class={`flex items-center gap-2 ${ok ? "text-green-700" : "text-muted"}`}>
                        {ok ? (
                          <Icons.check class="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Icons.minus class="w-3.5 h-3.5 text-muted" />
                        )}
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              </Show>

              <Input
                type="password"
                label="Confirm new password"
                placeholder="Type the new password again"
                value={confirmPassword()}
                onInput={e => setConfirmPassword(e.currentTarget.value)}
                leftIcon={Icons.lock}
                error={
                  confirmPassword().length > 0 && !passwordsMatch()
                    ? "Passwords don't match"
                    : undefined
                }
              />

              <div class="flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={!canChangePassword()}>
                  {changePassword.isPending ? "Changing…" : "Change password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
