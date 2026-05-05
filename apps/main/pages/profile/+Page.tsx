import { performLogout, useChangePassword, useCurrentUser } from "@ark/api-client"
import { Button, Icons, Input } from "@ark/ui"
import { createMemo, createSignal, Show } from "solid-js"

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

export default function ProfilePage() {
  const userQuery = useCurrentUser()
  const mutation = useChangePassword()

  const [oldPassword, setOldPassword] = createSignal("")
  const [newPassword, setNewPassword] = createSignal("")
  const [confirmPassword, setConfirmPassword] = createSignal("")
  const [showOld, setShowOld] = createSignal(false)
  const [showNew, setShowNew] = createSignal(false)
  const [error, setError] = createSignal("")
  const [success, setSuccess] = createSignal(false)

  const passingRules = createMemo(() => RULES.filter(r => r.test(newPassword())))
  const passwordsMatch = createMemo(
    () => newPassword().length > 0 && newPassword() === confirmPassword()
  )
  const canSubmit = createMemo(
    () =>
      oldPassword().length > 0 &&
      passingRules().length === RULES.length &&
      passwordsMatch() &&
      !mutation.isPending
  )

  async function handleSubmit(e: Event) {
    e.preventDefault()
    setError("")
    if (!canSubmit()) return

    try {
      await mutation.mutateAsync({
        oldPassword: oldPassword(),
        newPassword: newPassword(),
      })
      setSuccess(true)
      // Backend cleared the cookie. Redirect to /login fresh.
      setTimeout(() => performLogout(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password")
    }
  }

  const required = () => {
    if (typeof window === "undefined") return false
    return new URLSearchParams(window.location.search).get("required") === "1"
  }
  const mustChange = () => userQuery.data?.mustChangePassword === true

  return (
    <div class="min-h-screen bg-background">
      <div class="max-w-2xl mx-auto px-4 py-12">
        <Show when={!required() && !mustChange()}>
          <div class="mb-6">
            <a
              href="/"
              class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
            >
              <Icons.arrowLeft class="w-4 h-4" /> Dashboard
            </a>
          </div>
        </Show>

        <Show when={required() || mustChange()}>
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

        <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          <div class="px-8 pt-8 pb-6 border-b border-border">
            <h1 class="text-2xl font-bold text-foreground">Profile</h1>
            <Show when={userQuery.data}>
              {user => (
                <p class="text-sm text-muted mt-1">
                  {user().firstName} {user().lastName} · {user().email} ·{" "}
                  <span class="capitalize">{user().role}</span>
                </p>
              )}
            </Show>
          </div>

          <form onSubmit={handleSubmit} class="px-8 py-8 space-y-6">
            <h2 class="text-lg font-semibold text-foreground">Change Password</h2>

            <Input
              type={showOld() ? "text" : "password"}
              label="Current Password"
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
              label="New Password"
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
              label="Confirm New Password"
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

            <Show when={error()}>
              <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Icons.alert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-red-700">{error()}</p>
              </div>
            </Show>

            <Show when={success()}>
              <div class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <Icons.checkCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-green-700">Password changed. Logging you out…</p>
              </div>
            </Show>

            <Button type="submit" variant="primary" class="w-full" disabled={!canSubmit()}>
              {mutation.isPending ? "Changing…" : "Change Password"}
            </Button>

            <p class="text-xs text-muted text-center">
              You'll be logged out after a successful password change.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
