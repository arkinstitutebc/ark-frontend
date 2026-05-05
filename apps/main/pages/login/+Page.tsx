import { createSignal } from "solid-js"
import { Button, Input, UI } from "@/components/ui"

export default function LoginPage() {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [showPassword, setShowPassword] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000"
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email(), password: password() }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Invalid credentials")
      }

      const user = await res.json().catch(() => ({}))

      // Honor ?return= query (e.g., from sub-portal AuthGate redirect)
      // unless the user must change their password — that takes priority
      const params = new URLSearchParams(window.location.search)
      const returnTo = params.get("return")

      if (user.mustChangePassword) {
        window.location.href = "/profile?required=1"
      } else if (returnTo) {
        window.location.href = returnTo
      } else {
        window.location.href = "/"
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="w-full max-w-md animate-fade-in">
        {/* Card */}
        <div class="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Header with Logo */}
          <div class="p-10 text-center border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
            <div class="flex justify-center mb-5">
              <div class="relative">
                <div class="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                <img
                  src="/logo/ark-transpa.png"
                  alt="Ark Institute Logo"
                  width="90"
                  height="90"
                  class="relative object-contain"
                />
              </div>
            </div>
            <h1 class="text-2xl font-bold text-foreground">Ark Institute</h1>
            <p class="text-muted text-sm mt-1">ERP Portal</p>
          </div>

          {/* Form */}
          <form class="p-10 space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={email()}
              onInput={e => setEmail(e.currentTarget.value)}
              leftIcon={<UI.mail class="w-5 h-5" />}
            />

            {/* Password Input */}
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password()}
              onInput={e => setPassword(e.currentTarget.value)}
              leftIcon={<UI.lock class="w-5 h-5" />}
              showPasswordToggle
              showPassword={showPassword()}
              onTogglePassword={() => setShowPassword(!showPassword())}
              eyeIcon={<UI.eye class="w-5 h-5" />}
              eyeOffIcon={<UI.eyeOff class="w-5 h-5" />}
            />

            {/* Error Message */}
            {error() && (
              <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <UI.alert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-red-700">{error()}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              class="w-full shadow-glow-primary"
              disabled={loading()}
            >
              {loading() ? (
                <>
                  <svg
                    class="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Loading"
                  >
                    <title>Loading</title>
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div class="px-10 pb-8 pt-5 border-t border-border bg-surface-muted/50">
            <p class="text-center text-xs text-muted">Secure portal access</p>
          </div>
        </div>

        <p class="text-center text-sm text-muted mt-6">
          <a href="https://arkinstitutebc.com" class="text-primary hover:underline font-medium">
            arkinstitutebc.com
          </a>
        </p>
      </div>
    </div>
  )
}
