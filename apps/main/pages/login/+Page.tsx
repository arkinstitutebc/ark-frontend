import { createSignal } from "solid-js"
import { Button, Input, UI } from "@/components/ui"

const collageImages = [
  {
    src: "/login/portal-collage-1.jpg",
    alt: "Ark Institute students outside the campus building",
  },
  {
    src: "/login/portal-collage-2.jpg",
    alt: "Ark Institute training group in front of the main building",
  },
  {
    src: "/login/portal-collage-3.jpg",
    alt: "Ark Institute team group photo",
  },
]

export default function LoginPage() {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [showPassword, setShowPassword] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [fieldErrors, setFieldErrors] = createSignal<{ email?: string; password?: string }>({})

  const validate = () => {
    const next: { email?: string; password?: string } = {}
    const trimmedEmail = email().trim()

    if (!trimmedEmail) next.email = "Enter your email address first."
    else if (!trimmedEmail.includes("@")) next.email = "Enter a valid email address."

    if (!password()) next.password = "Enter your password."

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)

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
    <main class="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <BrandCollage />

      <section class="flex min-h-[calc(100vh-18rem)] items-center justify-center px-6 py-10 sm:px-10 lg:min-h-screen lg:px-14">
        <div class="w-full max-w-[420px]">
          <div class="mb-10 flex items-center gap-4 lg:hidden">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute Logo"
              width="56"
              height="56"
              class="object-contain"
            />
            <div>
              <p class="text-lg font-bold text-foreground">Ark Institute</p>
              <p class="text-sm text-muted">ERP Portal</p>
            </div>
          </div>

          <div class="hidden items-center gap-4 lg:flex">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute Logo"
              width="64"
              height="64"
              class="object-contain"
            />
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-foreground">Ark Institute</h1>
              <p class="mt-1 text-sm text-muted">ERP Portal</p>
            </div>
          </div>

          <div class="mt-8 border-t border-border pt-8 lg:mt-10">
            <div class="mb-7">
              <h2 class="text-xl font-semibold text-foreground">Sign in</h2>
              <p class="mt-2 text-sm text-muted">
                Access operations, training, finance, and records.
              </p>
            </div>

            <form class="space-y-5" onSubmit={handleSubmit}>
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={email()}
                onInput={e => {
                  setEmail(e.currentTarget.value)
                  if (fieldErrors().email) setFieldErrors(prev => ({ ...prev, email: undefined }))
                }}
                leftIcon={UI.mail}
                autocomplete="email"
                error={fieldErrors().email}
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password()}
                onInput={e => {
                  setPassword(e.currentTarget.value)
                  if (fieldErrors().password) {
                    setFieldErrors(prev => ({ ...prev, password: undefined }))
                  }
                }}
                leftIcon={UI.lock}
                showPasswordToggle
                showPassword={showPassword()}
                onTogglePassword={() => setShowPassword(!showPassword())}
                eyeIcon={UI.eye}
                eyeOffIcon={UI.eyeOff}
                autocomplete="current-password"
                error={fieldErrors().password}
              />

              {error() && (
                <div class="flex items-start gap-2 border border-red-200 bg-red-50 p-3">
                  <UI.alert class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  <p class="text-sm text-red-700">{error()}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                class="w-full shadow-none hover:shadow-none"
                loading={loading()}
                loadingLabel="Signing in..."
              >
                Sign In
              </Button>
            </form>

            <div class="mt-8 flex items-center justify-between border-t border-border pt-5 text-xs text-muted">
              <span>Secure portal access</span>
              <a href="https://arkinstitutebc.com" class="font-medium text-primary hover:underline">
                arkinstitutebc.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function BrandCollage() {
  return (
    <section class="relative min-h-[18rem] overflow-hidden bg-primary lg:min-h-screen">
      <div class="absolute inset-0 grid grid-rows-3">
        {collageImages.map(image => (
          <div class="relative overflow-hidden border-b border-white/10 last:border-b-0">
            <img
              src={image.src}
              alt={image.alt}
              class="h-full w-full object-cover"
              loading="eager"
            />
            <div class="absolute inset-0 bg-primary/45 mix-blend-multiply" />
            <div class="absolute inset-0 bg-gradient-to-r from-primary/75 via-primary/25 to-accent/35" />
          </div>
        ))}
      </div>

      <div class="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-transparent" />
      <div class="absolute inset-x-0 bottom-0 p-8 sm:p-10 lg:p-12">
        <div class="max-w-xl text-white">
          <div class="flex items-center gap-4">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute Logo"
              width="54"
              height="54"
              class="object-contain"
            />
            <div>
              <p class="text-2xl font-bold tracking-tight">Ark Institute ERP</p>
              <p class="mt-1 text-sm text-white/75">Operations, training, finance, and records.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
